import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseServerClient } from '@/lib/supabase'
import { isConfigured } from '@/lib/admin-config'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = getSupabaseServerClient()

    // DB ping
    const dbStart = Date.now()
    const { error: dbError } = await supabase.from('users').select('id').limit(1)
    const dbLatency = Date.now() - dbStart

    // Last cron runs
    const { data: lastCronRun } = await supabase
      .from('ai_daily_job_runs')
      .select('started_at, status')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Recent errors (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: aiErrorCount } = await supabase
      .from('ai_usage_log')
      .select('*', { count: 'exact', head: true })
      .eq('success', false)
      .gte('created_at', yesterday)
    const { count: failedPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', yesterday)

    // Integration status
    const integrationsStatus = await Promise.all(
      [
        'GEMINI_API_KEY',
        'OPENROUTER_API_KEY',
        'ANTHROPIC_API_KEY',
        'AYRSHARE_API_KEY',
        'SMTP_HOST',
        'IMAP_HOST',
        'ENCRYPTION_KEY',
      ].map(async (k) => ({ key: k, configured: await isConfigured(k) }))
    )

    return NextResponse.json({
      status: dbError ? 'unhealthy' : 'healthy',
      checks: {
        database: {
          ok: !dbError,
          latencyMs: dbLatency,
          error: dbError?.message,
        },
        cron: {
          ok: !!lastCronRun,
          lastRunAt: lastCronRun?.started_at,
          lastStatus: lastCronRun?.status,
        },
        errors24h: {
          aiFailures: aiErrorCount || 0,
          postFailures: failedPosts || 0,
        },
        integrations: integrationsStatus,
      },
      env: {
        node: process.version,
        platform: process.platform,
        siteUrl: process.env.SITE_URL || 'not set',
      },
    })
  } catch (e) {
    return NextResponse.json({ status: 'error', error: (e as Error).message }, { status: 500 })
  }
}
