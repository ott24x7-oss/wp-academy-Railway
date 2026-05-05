import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin, logAdminAction } from '@/lib/admin'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('category')
      .order('key')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ flags: data || [] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { key, enabled } = await request.json()
    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'key + enabled required' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('key', key)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAdminAction(user.id, 'toggle_feature_flag', 'feature_flags', key, { enabled })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
