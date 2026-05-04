import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/auth-server'

/**
 * Handles auth callback from Supabase email confirmation links.
 * URL: /api/auth/callback?code=...&next=/app/dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/app/dashboard'

  if (code) {
    try {
      const supabase = await createSupabaseServerClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    } catch (e) {
      const err = e as Error
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(err.message)}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
