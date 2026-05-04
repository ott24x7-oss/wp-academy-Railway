import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase'

// GET /api/ai/daily — list current user's bots
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('ai_daily_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ jobs: data || [] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST /api/ai/daily — create a bot
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      name,
      type,
      topic,
      tone,
      platforms,
      schedule_time,
      timezone,
      days_of_week,
      mode,
      provider,
      workspace_id,
    } = body

    if (!name || !type || !topic || !platforms?.length) {
      return NextResponse.json(
        { error: 'name, type, topic, platforms required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    // Resolve workspace_id
    let wsId = workspace_id
    if (!wsId) {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      if (!ws) {
        return NextResponse.json(
          { error: 'No workspace found. Create one first.' },
          { status: 400 }
        )
      }
      wsId = ws.id
    }

    const { data, error } = await supabase
      .from('ai_daily_jobs')
      .insert({
        workspace_id: wsId,
        user_id: user.id,
        name,
        type,
        topic,
        tone: tone || 'professional',
        platforms,
        schedule_time: schedule_time || '09:00:00',
        timezone: timezone || 'Asia/Kolkata',
        days_of_week: days_of_week || [0, 1, 2, 3, 4, 5, 6],
        mode: mode || 'draft',
        provider: provider || 'auto',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, job: data })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// PATCH /api/ai/daily?id=... — toggle/update
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updates = await request.json()
    delete updates.id
    delete updates.user_id
    delete updates.workspace_id

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('ai_daily_jobs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, job: data })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// DELETE /api/ai/daily?id=...
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('ai_daily_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
