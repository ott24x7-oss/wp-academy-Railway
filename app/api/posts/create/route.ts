import { NextResponse, type NextRequest } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const body: CreatePostRequest = await request.json()
    const { content, platforms, mediaUrls, scheduleAt } = body

    if (!content?.trim() || !platforms?.length) {
      return NextResponse.json({ error: 'Content and platforms required' }, { status: 400 })
    }

    const ayrshareKey = process.env.AYRSHARE_API_KEY
    if (!ayrshareKey) {
      // Fallback: just save as draft (for testing without Ayrshare)
      return NextResponse.json({
        success: true,
        draftMode: true,
        message: 'Saved as draft. Configure AYRSHARE_API_KEY to publish.',
        postId: `draft-${Date.now()}`,
      })
    }

    const ayrsharePayload: any = {
      post: content,
      platforms: platforms.map((p) => PLATFORM_MAP[p] || p),
      mediaUrls: mediaUrls || [],
    }

    if (scheduleAt) {
      ayrsharePayload.scheduleDate = new Date(scheduleAt).toISOString()
    }

    if (process.env.AYRSHARE_DOMAIN) {
      ayrsharePayload.profileKey = process.env.AYRSHARE_DOMAIN
    }

    const response = await fetch('https://api.ayrshare.com/api/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ayrshareKey}`,
      },
      body: JSON.stringify(ayrsharePayload),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || 'Ayrshare API error', details: result },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      postId: result.postID || result.id,
      scheduledFor: result.scheduledDate || scheduleAt,
      platforms,
      ayrshareResponse: result,
    })
  } catch (error) {
    const err = error as Error
    console.error('[posts/create] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
