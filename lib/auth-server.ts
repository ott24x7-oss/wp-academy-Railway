import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for Server Components, Route Handlers, Server Actions.
 * Reads/writes cookies for session.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase not configured')
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as CookieOptions)
          )
        } catch {
          // Server Components can't set cookies — middleware refreshes them instead
        }
      },
    },
  })
}

/**
 * Get the current authenticated user (server-side).
 * Returns null if not authenticated or Supabase not configured.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

/**
 * Get current user with their database profile (joined).
 */
export async function getCurrentUserWithProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const supabase = await createSupabaseServerClient()
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    return { user, profile }
  } catch {
    return { user, profile: null }
  }
}
