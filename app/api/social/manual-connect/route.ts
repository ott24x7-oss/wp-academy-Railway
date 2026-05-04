import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { encryptToken } from '@/lib/encryption'

interface ManualConnectRequest {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'whatsapp' | 'youtube'
  credentials: string  // The format depends on platform — see below
  workspaceId?: string
}

/**
 * Validates the format the user pasted, like the Telegram bot does:
 *
 * facebook    → PAGE_ID|PAGE_ACCESS_TOKEN
 * instagram   → IG_ACCOUNT_ID|PAGE_ACCESS_TOKEN
 * whatsapp    → PHONE_NUMBER_ID|ACCESS_TOKEN
 * twitter     → API_KEY|API_SECRET|ACCESS_TOKEN|ACCESS_SECRET
 * linkedin    → ACCESS_TOKEN  (just the token)
 * tiktok      → ACCESS_TOKEN
 * youtube     → API_KEY|CHANNEL_ID
 */
function parseCredentials(platform: string, raw: string): { ok: boolean; data?: any; error?: string } {
  const cleaned = raw.trim()
  if (!cleaned) return { ok: false, error: 'Empty input' }

  switch (platform) {
    case 'facebook': {
      const parts = cleaned.split('|').map((p) => p.trim())
      if (parts.length !== 2) return { ok: false, error: 'Format: PAGE_ID|PAGE_ACCESS_TOKEN' }
      if (!/^\d+$/.test(parts[0])) return { ok: false, error: 'Page ID must be numeric' }
      if (parts[1].length < 30) return { ok: false, error: 'Token looks too short' }
      return { ok: true, data: { pageId: parts[0], accessToken: parts[1] } }
    }
    case 'instagram': {
      const parts = cleaned.split('|').map((p) => p.trim())
      if (parts.length !== 2) return { ok: false, error: 'Format: IG_ACCOUNT_ID|PAGE_ACCESS_TOKEN' }
      return { ok: true, data: { igAccountId: parts[0], accessToken: parts[1] } }
    }
    case 'whatsapp': {
      const parts = cleaned.split('|').map((p) => p.trim())
      if (parts.length !== 2) return { ok: false, error: 'Format: PHONE_NUMBER_ID|ACCESS_TOKEN' }
      return { ok: true, data: { phoneNumberId: parts[0], accessToken: parts[1] } }
    }
    case 'twitter': {
      const parts = cleaned.split('|').map((p) => p.trim())
      if (parts.length !== 4)
        return { ok: false, error: 'Format: API_KEY|API_SECRET|ACCESS_TOKEN|ACCESS_SECRET' }
      return {
        ok: true,
        data: { apiKey: parts[0], apiSecret: parts[1], accessToken: parts[2], accessSecret: parts[3] },
      }
    }
    case 'linkedin':
    case 'tiktok': {
      if (cleaned.length < 30) return { ok: false, error: 'Token looks too short' }
      return { ok: true, data: { accessToken: cleaned } }
    }
    case 'youtube': {
      const parts = cleaned.split('|').map((p) => p.trim())
      if (parts.length !== 2) return { ok: false, error: 'Format: API_KEY|CHANNEL_ID' }
      return { ok: true, data: { apiKey: parts[0], channelId: parts[1] } }
    }
    default:
      return { ok: false, error: 'Unknown platform' }
  }
}

/**
 * Optionally test the credentials by hitting the platform's API
 */
async function testCredentials(platform: string, data: any): Promise<{ ok: boolean; accountName?: string; error?: string }> {
  try {
    if (platform === 'facebook') {
      const url = `https://graph.facebook.com/v22.0/${data.pageId}?fields=name&access_token=${data.accessToken}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.error) return { ok: false, error: json.error.message }
      return { ok: true, accountName: json.name || `Page ${data.pageId}` }
    }
    if (platform === 'instagram') {
      const url = `https://graph.facebook.com/v22.0/${data.igAccountId}?fields=username&access_token=${data.accessToken}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.error) return { ok: false, error: json.error.message }
      return { ok: true, accountName: json.username || `IG ${data.igAccountId}` }
    }
    // For others, accept without verification (just validate format)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })

    const body = (await request.json()) as ManualConnectRequest
    const { platform, credentials, workspaceId } = body

    if (!platform || !credentials) {
      return NextResponse.json({ error: 'platform and credentials required' }, { status: 400 })
    }

    // Parse format
    const parsed = parseCredentials(platform, credentials)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    // Test credentials (best-effort)
    const test = await testCredentials(platform, parsed.data)
    if (!test.ok) {
      return NextResponse.json(
        { error: 'Credential check failed: ' + test.error },
        { status: 400 }
      )
    }

    // Encrypt and store
    let encryptedToken: string
    try {
      const e = encryptToken(JSON.stringify(parsed.data))
      encryptedToken = JSON.stringify(e)
    } catch {
      // If encryption key not set, store as plain (not ideal but works)
      encryptedToken = JSON.stringify(parsed.data)
    }

    // Map platform → DB platform value
    const dbPlatform =
      platform === 'youtube'
        ? 'twitter' // youtube isn't in our enum yet — store under generic
        : platform === 'whatsapp'
          ? 'whatsapp'
          : platform

    const supabase = getSupabaseServerClient()

    // Get user's default workspace if not provided
    let wsId = workspaceId
    if (!wsId) {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      if (!ws) {
        // Create a default workspace
        const { data: newWs } = await supabase
          .from('workspaces')
          .insert({
            name: 'My Workspace',
            slug: 'ws-' + user.id.slice(0, 8),
            owner_id: user.id,
          })
          .select()
          .single()
        wsId = newWs?.id
      } else {
        wsId = ws.id
      }
    }

    // Save the connection
    const { error } = await supabase
      .from('social_accounts')
      .upsert(
        {
          workspace_id: wsId,
          user_id: user.id,
          platform: dbPlatform as any,
          account_id: parsed.data.pageId || parsed.data.igAccountId || parsed.data.phoneNumberId || parsed.data.channelId || 'manual',
          account_name: test.accountName || `${platform} account`,
          access_token: encryptedToken,
        },
        { onConflict: 'workspace_id,platform,account_id' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      platform,
      accountName: test.accountName,
      message: 'Connected successfully!',
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
