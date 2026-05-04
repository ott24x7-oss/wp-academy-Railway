import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = await createSupabaseServerClient()
      await supabase.auth.signOut()
    }
    return NextResponse.redirect(new URL('/', request.url), { status: 303 })
  } catch (e) {
    return NextResponse.redirect(new URL('/', request.url), { status: 303 })
  }
}
