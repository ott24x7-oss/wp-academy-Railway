import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin, getAllSettings, updateSetting, logAdminAction } from '@/lib/admin'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const settings = await getAllSettings()
    return NextResponse.json({ settings })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = (await request.json()) as { updates: Record<string, string> }
    if (!body.updates || typeof body.updates !== 'object') {
      return NextResponse.json({ error: 'updates object required' }, { status: 400 })
    }

    const keys = Object.keys(body.updates)
    for (const key of keys) {
      await updateSetting(key, body.updates[key], user.id)
    }
    await logAdminAction(user.id, 'update_settings', 'admin_settings', undefined, { keys })

    return NextResponse.json({ success: true, updated: keys.length })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
