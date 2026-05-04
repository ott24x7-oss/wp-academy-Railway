import { NextResponse, type NextRequest } from 'next/server'

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// Returns the OAuth authorization URL the user should be redirected to
function buildAuthUrl(provider: string): string | null {
  switch (provider) {
    case 'meta': {
      const appId = process.env.META_APP_ID
      if (!appId) return null
      const redirect = encodeURIComponent(`${BASE}/api/oauth/meta/callback`)
      const scope = 'pages_show_list,pages_manage_posts,instagram_basic,instagram_content_publish,public_profile,email'
      return `https://www.facebook.com/v22.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirect}&scope=${encodeURIComponent(
        scope
      )}&response_type=code`
    }
    case 'google': {
      const id = process.env.GOOGLE_ADS_CLIENT_ID
      if (!id) return null
      const redirect = encodeURIComponent(`${BASE}/api/oauth/google/callback`)
      const scope =
        'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/youtube.readonly'
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${id}&redirect_uri=${redirect}&scope=${encodeURIComponent(
        scope
      )}&response_type=code&access_type=offline&prompt=consent`
    }
    case 'linkedin': {
      const id = process.env.LINKEDIN_CLIENT_ID
      if (!id) return null
      const redirect = encodeURIComponent(`${BASE}/api/oauth/linkedin/callback`)
      const scope = 'r_liteprofile r_emailaddress w_member_social'
      const state = Math.random().toString(36).substring(2, 15)
      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${id}&redirect_uri=${redirect}&scope=${encodeURIComponent(
        scope
      )}&state=${state}`
    }
    case 'tiktok': {
      const key = process.env.TIKTOK_CLIENT_KEY
      if (!key) return null
      const redirect = encodeURIComponent(`${BASE}/api/oauth/tiktok/callback`)
      const scope = 'user.info.basic,video.upload,video.publish'
      return `https://www.tiktok.com/v2/auth/authorize/?client_key=${key}&scope=${encodeURIComponent(
        scope
      )}&response_type=code&redirect_uri=${redirect}`
    }
    case 'twitter':
    case 'instagram':
    case 'facebook':
      // These go through Ayrshare instead (one-click connect)
      if (process.env.AYRSHARE_API_KEY) {
        return `https://app.ayrshare.com/social-accounts`
      }
      return null
    default:
      return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const url = buildAuthUrl(provider)

  if (!url) {
    return NextResponse.json(
      {
        error: `${provider} OAuth not configured. Set the relevant env vars: META_APP_ID, GOOGLE_ADS_CLIENT_ID, LINKEDIN_CLIENT_ID, TIKTOK_CLIENT_KEY, or AYRSHARE_API_KEY.`,
      },
      { status: 503 }
    )
  }

  return NextResponse.redirect(url)
}
