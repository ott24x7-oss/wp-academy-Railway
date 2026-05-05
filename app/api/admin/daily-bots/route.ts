import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = getSupabaseServerClient()

    const { data: jobs } = await supabase
      .from('ai_daily_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    // Hydrate user info
    const userIds = Array.from(new Set((jobs || []).map((j: any) => j.user_id).filter(Boolean)))
    const userMap = new Map<string, any>()
    if (userIds.length) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', userIds)
      for (const u of users || []) userMap.set((u as any).id, u)
    }

    const enriched = (jobs || []).map((j: any) => ({
      ...j,
      user_email: userMap.get(j.user_id)?.email,
      user_name: userMap.get(j.user_id)?.name,
    }))

    // Recent runs
    const { data: recentRuns } = await supabase
      .from('ai_daily_job_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      jobs: enriched,
      stats: {
        total: enriched.length,
        active: enriched.filter((j: any) => j.active).length,
        autoMode: enriched.filter((j: any) => j.mode === 'auto').length,
        totalRuns: enriched.reduce((s: number, j: any) => s + (j.total_runs || 0), 0),
      },
      recentRuns: recentRuns || [],
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
