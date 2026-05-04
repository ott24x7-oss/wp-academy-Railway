/**
 * Direct posting to social media platforms using stored access tokens.
 * 100% free — no Ayrshare or third party.
 *
 * Token formats are stored encrypted via /api/social/manual-connect:
 *   facebook    → { pageId, accessToken }
 *   instagram   → { igAccountId, accessToken }
 *   whatsapp    → { phoneNumberId, accessToken }
 *   twitter     → { apiKey, apiSecret, accessToken, accessSecret }
 *   linkedin    → { accessToken }
 *   tiktok      → { accessToken }
 *   youtube     → { apiKey, channelId }
 */

export interface PostResult {
  platform: string
  success: boolean
  postId?: string
  url?: string
  error?: string
}

interface FacebookCreds {
  pageId: string
  accessToken: string
}

interface InstagramCreds {
  igAccountId: string
  accessToken: string
}

interface WhatsAppCreds {
  phoneNumberId: string
  accessToken: string
}

interface LinkedInCreds {
  accessToken: string
}

interface TikTokCreds {
  accessToken: string
}

// ─── Facebook Page ───────────────────────────────────
export async function postToFacebook(
  creds: FacebookCreds,
  message: string,
  mediaUrl?: string
): Promise<PostResult> {
  try {
    const url = `https://graph.facebook.com/v22.0/${creds.pageId}/${
      mediaUrl ? 'photos' : 'feed'
    }`
    const body: any = { message, access_token: creds.accessToken }
    if (mediaUrl) body.url = mediaUrl

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (json.error) return { platform: 'facebook', success: false, error: json.error.message }
    return {
      platform: 'facebook',
      success: true,
      postId: json.id || json.post_id,
      url: `https://www.facebook.com/${json.post_id || json.id}`,
    }
  } catch (e) {
    return { platform: 'facebook', success: false, error: (e as Error).message }
  }
}

// ─── Instagram Business ──────────────────────────────
export async function postToInstagram(
  creds: InstagramCreds,
  caption: string,
  mediaUrl: string
): Promise<PostResult> {
  if (!mediaUrl) {
    return {
      platform: 'instagram',
      success: false,
      error: 'Instagram requires an image or video URL',
    }
  }
  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `https://graph.facebook.com/v22.0/${creds.igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: mediaUrl,
          caption,
          access_token: creds.accessToken,
        }),
      }
    )
    const containerJson = await containerRes.json()
    if (containerJson.error) {
      return { platform: 'instagram', success: false, error: containerJson.error.message }
    }
    const containerId = containerJson.id

    // Step 2: Publish container
    const publishRes = await fetch(
      `https://graph.facebook.com/v22.0/${creds.igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: creds.accessToken,
        }),
      }
    )
    const publishJson = await publishRes.json()
    if (publishJson.error) {
      return { platform: 'instagram', success: false, error: publishJson.error.message }
    }
    return {
      platform: 'instagram',
      success: true,
      postId: publishJson.id,
    }
  } catch (e) {
    return { platform: 'instagram', success: false, error: (e as Error).message }
  }
}

// ─── LinkedIn ────────────────────────────────────────
export async function postToLinkedIn(
  creds: LinkedInCreds,
  text: string
): Promise<PostResult> {
  try {
    // Get author URN first
    const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    })
    const me = await meRes.json()
    if (!me.sub) {
      return { platform: 'linkedin', success: false, error: 'Could not get user info' }
    }

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        Authorization: `Bearer ${creds.accessToken}`,
      },
      body: JSON.stringify({
        author: `urn:li:person:${me.sub}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    })
    const json = await res.json()
    if (!res.ok)
      return { platform: 'linkedin', success: false, error: json.message || 'Post failed' }
    return { platform: 'linkedin', success: true, postId: json.id }
  } catch (e) {
    return { platform: 'linkedin', success: false, error: (e as Error).message }
  }
}

// ─── WhatsApp Business (template/text message) ───────
export async function postToWhatsApp(
  creds: WhatsAppCreds,
  toPhone: string,
  message: string
): Promise<PostResult> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${creds.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creds.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    )
    const json = await res.json()
    if (json.error) return { platform: 'whatsapp', success: false, error: json.error.message }
    return { platform: 'whatsapp', success: true, postId: json.messages?.[0]?.id }
  } catch (e) {
    return { platform: 'whatsapp', success: false, error: (e as Error).message }
  }
}

// ─── TikTok ──────────────────────────────────────────
export async function postToTikTok(
  creds: TikTokCreds,
  videoUrl: string,
  caption: string
): Promise<PostResult> {
  if (!videoUrl) {
    return { platform: 'tiktok', success: false, error: 'TikTok requires a video URL' }
  }
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creds.accessToken}`,
      },
      body: JSON.stringify({
        post_info: {
          title: caption.substring(0, 150),
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      }),
    })
    const json = await res.json()
    if (json.error?.code && json.error.code !== 'ok') {
      return { platform: 'tiktok', success: false, error: json.error.message }
    }
    return { platform: 'tiktok', success: true, postId: json.data?.publish_id }
  } catch (e) {
    return { platform: 'tiktok', success: false, error: (e as Error).message }
  }
}

// ─── Twitter/X (API v2) ──────────────────────────────
// Note: Twitter v2 requires OAuth 1.0a request signing for posting tweets.
// This is complex — a stub is provided here that needs an OAuth 1.0a library.
export async function postToTwitter(
  creds: any,
  text: string
): Promise<PostResult> {
  return {
    platform: 'twitter',
    success: false,
    error:
      'Twitter posting requires OAuth 1.0a signing. Use Ayrshare or a Twitter SDK like twitter-api-v2.',
  }
}

// ─── Master dispatcher ───────────────────────────────
export async function postToPlatform(
  platform: string,
  credsObj: any,
  content: string,
  mediaUrl?: string
): Promise<PostResult> {
  switch (platform) {
    case 'facebook':
      return postToFacebook(credsObj, content, mediaUrl)
    case 'instagram':
      return postToInstagram(credsObj, content, mediaUrl || '')
    case 'linkedin':
      return postToLinkedIn(credsObj, content)
    case 'whatsapp':
      return {
        platform: 'whatsapp',
        success: false,
        error: 'WhatsApp requires a recipient phone number, not broadcast',
      }
    case 'tiktok':
      return postToTikTok(credsObj, mediaUrl || '', content)
    case 'twitter':
      return postToTwitter(credsObj, content)
    default:
      return {
        platform,
        success: false,
        error: `Direct posting not yet implemented for ${platform}`,
      }
  }
}
