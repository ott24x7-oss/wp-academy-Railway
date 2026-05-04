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
    return NextResponse.redirect(new URL('/app/publish/accounts?error=no_code', request.url))
  }

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/oauth/linkedin/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/app/publish/accounts?error=not_configured', request.url)
      )
    }

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    const data = await tokenResponse.json()
    if (!tokenResponse.ok || !data.access_token) {
      return NextResponse.redirect(
        new URL(`/app/publish/accounts?error=${encodeURIComponent(data.error_description || 'token_failed')}`, request.url)
      )
    }

    return NextResponse.redirect(
      new URL('/app/publish/accounts?connected=linkedin', request.url)
    )
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/app/publish/accounts?error=${encodeURIComponent((e as Error).message)}`, request.url)
    )
  }
}
