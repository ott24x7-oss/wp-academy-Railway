import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/app/publish/accounts?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/app/publish/accounts?error=no_code', request.url)
    )
  }

  try {
    // Exchange code for access token
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = process.env.META_REDIRECT_URI

    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL('/app/publish/accounts?error=not_configured', request.url)
      )
    }

    const tokenUrl = `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`

    const response = await fetch(tokenUrl)
    const data = await response.json()

    if (!response.ok || !data.access_token) {
      return NextResponse.redirect(
        new URL(`/app/publish/accounts?error=${encodeURIComponent(data.error?.message || 'token_exchange_failed')}`, request.url)
      )
    }

    // TODO: Store encrypted token in database
    // const encrypted = encryptToken(data.access_token)
    // await saveSocialAccount({ platform: 'facebook', access_token: encrypted, ... })

    return NextResponse.redirect(
      new URL('/app/publish/accounts?connected=meta', request.url)
    )
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/app/publish/accounts?error=${encodeURIComponent((e as Error).message)}`, request.url)
    )
  }
}
