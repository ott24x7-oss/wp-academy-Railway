import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin } from '@/lib/admin'
import { getConfig } from '@/lib/admin-config'

// POST /api/admin/integrations/test { key: 'GEMINI_API_KEY' }
// Hits the actual provider with a tiny test request.
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { key } = await request.json()
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

    const value = await getConfig(key)
    if (!value) {
      return NextResponse.json({ ok: false, message: 'Not configured' })
    }

    switch (key) {
      case 'GEMINI_API_KEY': {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${value}`
        )
        const j = await r.json()
        if (j.error) return NextResponse.json({ ok: false, message: j.error.message })
        return NextResponse.json({ ok: true, message: `${j.models?.length || 0} models available` })
      }
      case 'OPENROUTER_API_KEY': {
        const r = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${value}` },
        })
        const j = await r.json()
        if (!r.ok) return NextResponse.json({ ok: false, message: j.error?.message || 'Auth failed' })
        return NextResponse.json({
          ok: true,
          message: `Credit limit: ${j.data?.limit ?? 'free tier'}`,
        })
      }
      case 'ANTHROPIC_API_KEY': {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': value,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        })
        const j = await r.json()
        if (j.error) return NextResponse.json({ ok: false, message: j.error.message })
        return NextResponse.json({ ok: true, message: 'API key valid' })
      }
      case 'AYRSHARE_API_KEY': {
        const r = await fetch('https://api.ayrshare.com/api/user', {
          headers: { Authorization: `Bearer ${value}` },
        })
        const j = await r.json()
        if (!r.ok) return NextResponse.json({ ok: false, message: j.message || 'Auth failed' })
        return NextResponse.json({ ok: true, message: `Profile: ${j.email || 'connected'}` })
      }
      default:
        return NextResponse.json({
          ok: true,
          message: 'Key is set (no live test for this provider)',
        })
    }
  } catch (e) {
    return NextResponse.json({ ok: false, message: (e as Error).message })
  }
}
