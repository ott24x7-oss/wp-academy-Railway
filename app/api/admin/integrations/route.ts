import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin, logAdminAction } from '@/lib/admin'
import { getSupabaseServerClient } from '@/lib/supabase'
import { getConfig, getConfigSource, maskSecret, clearConfigCache } from '@/lib/admin-config'

const INTEGRATION_KEYS = [
  { key: 'GEMINI_API_KEY', label: 'Google Gemini', category: 'ai', help: 'aistudio.google.com/apikey (free)' },
  { key: 'OPENROUTER_API_KEY', label: 'OpenRouter', category: 'ai', help: 'openrouter.ai/keys (free models available)' },
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic Claude', category: 'ai', help: 'console.anthropic.com (paid)' },
  { key: 'AYRSHARE_API_KEY', label: 'Ayrshare (social hub)', category: 'social', help: 'ayrshare.com — paid fallback for unconnected platforms' },
  { key: 'AYRSHARE_DOMAIN', label: 'Ayrshare Profile Key', category: 'social', help: 'Optional sub-profile key' },
  { key: 'ENCRYPTION_KEY', label: 'Token Encryption Key', category: 'security', help: '32-byte hex string for encrypting stored social tokens' },
  { key: 'CRON_SECRET', label: 'Cron Secret', category: 'security', help: 'Auth token for /api/ai/daily/run?cron=1' },
  { key: 'SMTP_HOST', label: 'SMTP Host', category: 'email', help: 'e.g. smtp.gmail.com' },
  { key: 'SMTP_USER', label: 'SMTP User', category: 'email', help: 'Gmail address for sending' },
  { key: 'SMTP_PASS', label: 'SMTP Password', category: 'email', help: 'Gmail app password (not regular password)' },
  { key: 'SMTP_PORT', label: 'SMTP Port', category: 'email', help: 'Usually 587 (STARTTLS) or 465 (SSL)' },
  { key: 'IMAP_HOST', label: 'IMAP Host', category: 'email', help: 'e.g. imap.gmail.com — for payment auto-verification' },
  { key: 'IMAP_USER', label: 'IMAP User', category: 'email', help: 'Same Gmail receiving payment notifications' },
  { key: 'IMAP_PASS', label: 'IMAP Password', category: 'email', help: 'Gmail app password' },
]

// GET — list all integrations with masked values + source
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const integrations = await Promise.all(
      INTEGRATION_KEYS.map(async (k) => {
        const value = await getConfig(k.key)
        const source = await getConfigSource(k.key)
        return {
          ...k,
          configured: !!value,
          source,
          masked: maskSecret(value),
        }
      })
    )

    return NextResponse.json({ integrations })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST — set/update a key in DB (overrides env)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { key, value } = await request.json()
    if (!key || !INTEGRATION_KEYS.find((k) => k.key === key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const trimmed = String(value || '').trim()

    if (!trimmed) {
      // Empty = delete from DB so env fallback applies
      await supabase.from('admin_settings').delete().eq('key', key)
    } else {
      await supabase.from('admin_settings').upsert({
        key,
        value: trimmed,
        category: INTEGRATION_KEYS.find((k) => k.key === key)?.category || 'integration',
        is_secret: true,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
    }

    clearConfigCache(key)
    await logAdminAction(user.id, 'update_integration', 'admin_settings', key)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
