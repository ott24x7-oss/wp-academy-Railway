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
    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET

    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(
        new URL('/app/publish/accounts?error=not_configured', request.url)
      )
    }

    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/oauth/tiktok/callback`,
      }),
    })

    const data = await tokenResponse.json()
    if (!tokenResponse.ok || !data.access_token) {
      return NextResponse.redirect(
        new URL(`/app/publish/accounts?error=${encodeURIComponent(data.error_description || 'token_failed')}`, request.url)
      )
    }

    return NextResponse.redirect(
      new URL('/app/publish/accounts?connected=tiktok', request.url)
    )
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/app/publish/accounts?error=${encodeURIComponent((e as Error).message)}`, request.url)
    )
  }
}
