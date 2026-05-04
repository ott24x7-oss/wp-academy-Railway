import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { decryptToken } from '@/lib/encryption'
import { postToPlatform, type PostResult } from '@/lib/social-direct'

interface CreatePostRequest {
  content: string
  platforms: string[]
  mediaUrls?: string[]
  scheduleAt?: string
}

const PLATFORM_MAP: Record<string, string> = {
  twitter: 'twitter',
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  tiktok: 'tiktok',
}

/**
 * Decode credentials stored by /api/social/manual-connect
 * The stored value is either:
 *   - JSON string of { encrypted, iv, authTag } (when ENCRYPTION_KEY is set)
 *   - JSON string of plain creds object (when ENCRYPTION_KEY is missing)
 */
function decodeStoredToken(stored: string): any | null {
  try {
    const parsed = JSON.parse(stored)
    if (parsed.encrypted && parsed.iv && parsed.authTag) {
      // Encrypted — decrypt
      const decrypted = decryptToken(parsed.encrypted, parsed.iv, parsed.authTag)
      return JSON.parse(decrypted)
    }
    return parsed
  } catch {
    return null
  }
}

async function postViaAyrshare(
  apiKey: string,
  content: string,
  platforms: string[],
  mediaUrls?: string[],
  scheduleAt?: string
): Promise<PostResult[]> {
  const payload: any = {
    post: content,
    platforms: platforms.map((p) => PLATFORM_MAP[p] || p),
    mediaUrls: mediaUrls || [],
  }
  if (scheduleAt) payload.scheduleDate = new Date(scheduleAt).toISOString()
  if (process.env.AYRSHARE_DOMAIN) payload.profileKey = process.env.AYRSHARE_DOMAIN

  const res = await fetch('https://api.ayrshare.com/api/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) {
    return platforms.map((p) => ({
      platform: p,
      success: false,
      error: json.message || 'Ayrshare error',
    }))
  }
  return platforms.map((p) => ({
    platform: p,
    success: true,
    postId: json.postID || json.id,
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePostRequest = await request.json()
    const { content, platforms, mediaUrls, scheduleAt } = body

    if (!content?.trim() || !platforms?.length) {
      return NextResponse.json(
        { error: 'Content and platforms required' },
        { status: 400 }
      )
    }

    const user = await getCurrentUser()
    const results: PostResult[] = []

    // ── Step 1: Try direct posting using stored manual-connect tokens ──
    if (user) {
      const supabase = getSupabaseServerClient()
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('platform, access_token, account_id, account_name')
        .eq('user_id', user.id)
        .in('platform', platforms)

      const platformsToHandle = new Set(platforms)
      for (const acc of accounts || []) {
        const creds = decodeStoredToken(acc.access_token)
        if (!creds) {
          results.push({
            platform: acc.platform,
            success: false,
            error: 'Stored token unreadable (rotate ENCRYPTION_KEY?)',
          })
          platformsToHandle.delete(acc.platform)
          continue
        }
        const r = await postToPlatform(
          acc.platform,
          creds,
          content,
          mediaUrls?.[0]
        )
        results.push(r)
        platformsToHandle.delete(acc.platform)
      }

      // ── Step 2: Fall back to Ayrshare for platforms without direct tokens ──
      if (platformsToHandle.size > 0 && process.env.AYRSHARE_API_KEY) {
        const fallbackPlatforms = Array.from(platformsToHandle)
        const ayrResults = await postViaAyrshare(
          process.env.AYRSHARE_API_KEY,
          content,
          fallbackPlatforms,
          mediaUrls,
          scheduleAt
        )
        results.push(...ayrResults)
        platformsToHandle.clear()
      }

      // Whatever's left has no connection
      for (const p of platformsToHandle) {
        results.push({
          platform: p,
          success: false,
          error: `No connection found for ${p}. Connect at /app/publish/accounts`,
        })
      }
    } else if (process.env.AYRSHARE_API_KEY) {
      // ── Anonymous fallback to Ayrshare ──
      const ayrResults = await postViaAyrshare(
        process.env.AYRSHARE_API_KEY,
        content,
        platforms,
        mediaUrls,
        scheduleAt
      )
      results.push(...ayrResults)
    } else {
      return NextResponse.json(
        {
          success: true,
          draftMode: true,
          message:
            'Saved as draft. Connect a social account at /app/publish/accounts (free) or set AYRSHARE_API_KEY to publish.',
        },
        { status: 200 }
      )
    }

    // ── Step 3: Persist to posts table for history ──
    if (user) {
      try {
        const supabase = getSupabaseServerClient()
        const { data: ws } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle()
        if (ws) {
          await supabase.from('posts').insert({
            workspace_id: ws.id,
            user_id: user.id,
            content,
            media_urls: mediaUrls || [],
            platforms,
            status: results.every((r) => r.success) ? 'posted' : 'failed',
            posted_at: new Date().toISOString(),
            scheduled_at: scheduleAt || null,
          })
        }
      } catch (e) {
        // Non-fatal
        console.warn('Post history save failed:', (e as Error).message)
      }
    }

    const allSucceeded = results.every((r) => r.success)
    return NextResponse.json({
      success: allSucceeded,
      partial: !allSucceeded && results.some((r) => r.success),
      results,
      message: allSucceeded
        ? 'Posted to all platforms'
        : results.some((r) => r.success)
          ? 'Posted to some platforms — check results'
          : 'All platforms failed — check connections',
    })
  } catch (error) {
    const err = error as Error
    console.error('[posts/create] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
