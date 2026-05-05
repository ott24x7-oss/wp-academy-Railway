import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500)

    const supabase = getSupabaseServerClient()
    const { data: rows } = await supabase
      .from('admin_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Hydrate admin emails
    const adminIds = Array.from(new Set((rows || []).map((r: any) => r.admin_id).filter(Boolean)))
    const adminMap = new Map<string, string>()
    if (adminIds.length) {
      const { data: users } = await supabase.from('users').select('id, email, name').in('id', adminIds)
      for (const u of users || []) adminMap.set((u as any).id, (u as any).email)
    }

    return NextResponse.json({
      activity: (rows || []).map((r: any) => ({
        ...r,
        admin_email: adminMap.get(r.admin_id) || 'unknown',
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
