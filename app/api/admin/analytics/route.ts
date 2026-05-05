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
    const thirty = new Date(now); thirty.setDate(thirty.getDate() - 30)

    const [usersR, ordersR, postsR, aiR, coursesR] = await Promise.all([
      supabase.from('users').select('created_at, plan').gte('created_at', thirty.toISOString()),
      supabase.from('orders').select('created_at, amount, payment_status').gte('created_at', thirty.toISOString()),
      supabase.from('posts').select('created_at, status, platforms').gte('created_at', thirty.toISOString()),
      supabase.from('ai_usage_log').select('created_at, total_tokens, estimated_cost_cents').gte('created_at', thirty.toISOString()),
      supabase.from('courses').select('id, slug, title, view_count, enrollment_count').order('view_count', { ascending: false }).limit(10),
    ])

    // Bucket per day for the last 30 days
    function bucketByDay(rows: any[], valueFn: (r: any) => number = () => 1) {
      const map = new Map<string, number>()
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
        map.set(d.toISOString().slice(0, 10), 0)
      }
      for (const r of rows || []) {
        const day = String(r.created_at).slice(0, 10)
        if (map.has(day)) map.set(day, (map.get(day) || 0) + valueFn(r))
      }
      return Array.from(map.entries()).map(([date, value]) => ({ date, value }))
    }

    // Plan distribution
    const planDist: Record<string, number> = {}
    for (const u of usersR.data || []) {
      planDist[u.plan || 'free'] = (planDist[u.plan || 'free'] || 0) + 1
    }

    return NextResponse.json({
      signups: bucketByDay(usersR.data || []),
      revenue: bucketByDay(
        (ordersR.data || []).filter((o: any) => o.payment_status === 'verified'),
        (o: any) => parseFloat(o.amount) || 0
      ),
      posts: bucketByDay(postsR.data || []),
      aiCalls: bucketByDay(aiR.data || []),
      aiTokens: bucketByDay(aiR.data || [], (r: any) => r.total_tokens || 0),
      planDistribution: planDist,
      topCourses: coursesR.data || [],
      totals: {
        signups30d: usersR.data?.length || 0,
        revenue30d: (ordersR.data || [])
          .filter((o: any) => o.payment_status === 'verified')
          .reduce((s: number, o: any) => s + (parseFloat(o.amount) || 0), 0),
        posts30d: postsR.data?.length || 0,
        aiCalls30d: aiR.data?.length || 0,
        aiTokens30d: (aiR.data || []).reduce((s: number, r: any) => s + (r.total_tokens || 0), 0),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
