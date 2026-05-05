import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin, logAdminAction } from '@/lib/admin'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('slug')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ templates: data || [] })
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

    const body = await request.json()
    const { id, slug, name, subject, html_body, text_body, active } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const supabase = getSupabaseServerClient()
    const updates: any = { updated_at: new Date().toISOString(), updated_by: user.id }
    if (slug !== undefined) updates.slug = slug
    if (name !== undefined) updates.name = name
    if (subject !== undefined) updates.subject = subject
    if (html_body !== undefined) updates.html_body = html_body
    if (text_body !== undefined) updates.text_body = text_body
    if (active !== undefined) updates.active = active

    const { error } = await supabase.from('email_templates').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAdminAction(user.id, 'update_email_template', 'email_templates', id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
