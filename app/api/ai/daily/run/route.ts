/**
 * Run a single daily-bot job (or all due jobs).
 *
 * Usage:
 *   POST /api/ai/daily/run?id=<job_id>           → run one job (manual trigger from UI)
 *   POST /api/ai/daily/run?cron=1                → run all due jobs (called by Vercel Cron)
 *
 * Cron auth: requires CRON_SECRET header to match env var when ?cron=1
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { generateAI, SYSTEM_PROMPTS, type AIProvider } from '@/lib/ai-providers'
import { postToPlatform } from '@/lib/social-direct'
import { decryptToken } from '@/lib/encryption'

interface DailyJob {
  id: string
  workspace_id: string
  user_id: string
  name: string
  type: 'daily-quote' | 'daily-question' | 'social-post' | 'custom'
  topic: string
  tone: string
  platforms: string[]
  mode: 'auto' | 'draft'
  provider: string
}

function decodeStoredToken(stored: string): any | null {
  try {
    const parsed = JSON.parse(stored)
    if (parsed.encrypted && parsed.iv && parsed.authTag) {
      const decrypted = decryptToken(parsed.encrypted, parsed.iv, parsed.authTag)
      return JSON.parse(decrypted)
    }
    return parsed
  } catch {
    return null
  }
}

function systemFor(type: DailyJob['type']): string {
  switch (type) {
    case 'daily-quote':
      return SYSTEM_PROMPTS.dailyQuote
    case 'daily-question':
      return SYSTEM_PROMPTS.dailyQuestion
    case 'social-post':
      return SYSTEM_PROMPTS.socialPost
    default:
      return 'You are a helpful content writer.'
  }
}

async function runJob(job: DailyJob): Promise<{ success: boolean; text?: string; postResults?: any[]; error?: string }> {
  const supabase = getSupabaseServerClient()

  // Log run start
  const { data: runRow } = await supabase
    .from('ai_daily_job_runs')
    .insert({ job_id: job.id, status: 'running' })
    .select()
    .single()

  try {
    // 1. Generate content
    const ai = await generateAI({
      provider: job.provider === 'auto' ? undefined : (job.provider as AIProvider),
      system: systemFor(job.type),
      prompt: `Topic: ${job.topic}\nTone: ${job.tone}\nGenerate one fresh ${job.type.replace('-', ' ')} for today (${new Date().toDateString()}).`,
      temperature: 0.9,
      maxTokens: 300,
    })
    const generated = ai.text.trim()

    let postResults: any[] = []

    if (job.mode === 'auto') {
      // 2a. Auto-post to all configured platforms
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('platform, access_token')
        .eq('user_id', job.user_id)
        .in('platform', job.platforms)

      for (const acc of accounts || []) {
        const creds = decodeStoredToken(acc.access_token)
        if (!creds) {
          postResults.push({ platform: acc.platform, success: false, error: 'Token unreadable' })
          continue
        }
        const r = await postToPlatform(acc.platform, creds, generated)
        postResults.push(r)
      }

      // Save to posts history
      await supabase.from('posts').insert({
        workspace_id: job.workspace_id,
        user_id: job.user_id,
        content: generated,
        platforms: job.platforms,
        status: postResults.every((r) => r.success) ? 'posted' : 'failed',
        posted_at: new Date().toISOString(),
      })
    } else {
      // 2b. Draft mode — save as draft, no posting
      await supabase.from('posts').insert({
        workspace_id: job.workspace_id,
        user_id: job.user_id,
        content: generated,
        platforms: job.platforms,
        status: 'draft',
      })
    }

    // 3. Update job last_run + counter
    const { data: current } = await supabase
      .from('ai_daily_jobs')
      .select('total_runs')
      .eq('id', job.id)
      .single()
    await supabase
      .from('ai_daily_jobs')
      .update({
        last_run_at: new Date().toISOString(),
        total_runs: ((current?.total_runs as number) || 0) + 1,
      })
      .eq('id', job.id)

    // 4. Update run row
    if (runRow) {
      const overallStatus = job.mode === 'draft'
        ? 'success'
        : postResults.every((r) => r.success)
          ? 'success'
          : postResults.some((r) => r.success)
            ? 'partial'
            : 'failed'
      await supabase
        .from('ai_daily_job_runs')
        .update({
          finished_at: new Date().toISOString(),
          status: overallStatus,
          generated_text: generated,
          post_results: postResults,
        })
        .eq('id', runRow.id)
    }

    return { success: true, text: generated, postResults }
  } catch (e) {
    const err = (e as Error).message
    if (runRow) {
      await supabase
        .from('ai_daily_job_runs')
        .update({
          finished_at: new Date().toISOString(),
          status: 'failed',
          error_message: err,
        })
        .eq('id', runRow.id)
    }
    return { success: false, error: err }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const cron = searchParams.get('cron')

    const supabase = getSupabaseServerClient()

    // ── Cron mode: run all due jobs ──
    if (cron === '1') {
      const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
      if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized cron' }, { status: 401 })
      }

      // Find all active jobs whose next_run_at is in the past (or null = never run)
      const now = new Date().toISOString()
      const { data: jobs, error } = await supabase
        .from('ai_daily_jobs')
        .select('*')
        .eq('active', true)
        .or(`next_run_at.is.null,next_run_at.lte.${now}`)
        .limit(20)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const results = await Promise.all((jobs || []).map((j) => runJob(j as DailyJob)))
      return NextResponse.json({
        success: true,
        ranJobs: results.length,
        results,
      })
    }

    // ── Manual mode: run one job (must own it) ──
    if (!id) return NextResponse.json({ error: 'id or ?cron=1 required' }, { status: 400 })

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: job, error } = await supabase
      .from('ai_daily_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const result = await runJob(job as DailyJob)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
