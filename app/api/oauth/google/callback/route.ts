import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/app/ads/accounts?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL('/app/ads/accounts?error=no_code', request.url))
  }

  try {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL('/app/ads/accounts?error=not_configured', request.url)
      )
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const data = await tokenResponse.json()

    if (!tokenResponse.ok || !data.access_token) {
      return NextResponse.redirect(
        new URL(`/app/ads/accounts?error=${encodeURIComponent(data.error_description || 'token_failed')}`, request.url)
      )
    }

    // TODO: Store encrypted tokens in database

    return NextResponse.redirect(
      new URL('/app/ads/accounts?connected=google', request.url)
    )
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/app/ads/accounts?error=${encodeURIComponent((e as Error).message)}`, request.url)
    )
  }
}
