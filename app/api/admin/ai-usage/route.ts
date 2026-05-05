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
    const now = new Date()
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(now); startOfWeek.setDate(startOfWeek.getDate() - 7)
    const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)

    const [todayR, weekR, monthR, byProviderR, topUsersR, recentR] = await Promise.all([
      supabase.from('ai_usage_log').select('total_tokens, estimated_cost_cents')
        .gte('created_at', startOfDay.toISOString()),
      supabase.from('ai_usage_log').select('total_tokens, estimated_cost_cents')
        .gte('created_at', startOfWeek.toISOString()),
      supabase.from('ai_usage_log').select('total_tokens, estimated_cost_cents')
        .gte('created_at', startOfMonth.toISOString()),
      supabase.from('ai_usage_log').select('provider, total_tokens, estimated_cost_cents')
        .gte('created_at', startOfMonth.toISOString()),
      supabase.from('ai_usage_log').select('user_id, total_tokens, estimated_cost_cents')
        .gte('created_at', startOfMonth.toISOString())
        .not('user_id', 'is', null),
      supabase.from('ai_usage_log').select('*')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    function aggregate(rows: any[]) {
      return {
        calls: rows.length,
        tokens: rows.reduce((s, r) => s + (r.total_tokens || 0), 0),
        costCents: rows.reduce((s, r) => s + (r.estimated_cost_cents || 0), 0),
      }
    }

    // Aggregate by provider
    const providerMap = new Map<string, { calls: number; tokens: number; costCents: number }>()
    for (const r of byProviderR.data || []) {
      const cur = providerMap.get(r.provider) || { calls: 0, tokens: 0, costCents: 0 }
      cur.calls += 1
      cur.tokens += r.total_tokens || 0
      cur.costCents += r.estimated_cost_cents || 0
      providerMap.set(r.provider, cur)
    }

    // Aggregate by user
    const userMap = new Map<string, { tokens: number; costCents: number; calls: number }>()
    for (const r of topUsersR.data || []) {
      const cur = userMap.get(r.user_id) || { tokens: 0, costCents: 0, calls: 0 }
      cur.tokens += r.total_tokens || 0
      cur.costCents += r.estimated_cost_cents || 0
      cur.calls += 1
      userMap.set(r.user_id, cur)
    }
    const topUsers = Array.from(userMap.entries())
      .map(([userId, v]) => ({ userId, ...v }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10)

    // Hydrate user emails for top users
    if (topUsers.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', topUsers.map((u) => u.userId))
      const userMap2 = new Map((users || []).map((u: any) => [u.id, u]))
      topUsers.forEach((u: any) => {
        const profile = userMap2.get(u.userId) as any
        u.email = profile?.email
        u.name = profile?.name
      })
    }

    return NextResponse.json({
      today: aggregate(todayR.data || []),
      week: aggregate(weekR.data || []),
      month: aggregate(monthR.data || []),
      byProvider: Array.from(providerMap.entries()).map(([provider, v]) => ({ provider, ...v })),
      topUsers,
      recent: recentR.data || [],
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
