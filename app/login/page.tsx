'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

export const dynamic = 'force-dynamic'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Show error from query params (e.g., from auth callback)
  const queryError = searchParams.get('error')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!isSupabaseConfigured()) {
        // Demo mode
        setError('Demo mode: configure Supabase env vars for real login. Redirecting...')
        setTimeout(() => router.push('/app/dashboard'), 1500)
        return
      }

      const supabase = createSupabaseBrowserClient()
      const redirectTo = searchParams.get('redirect') || '/app/dashboard'

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) throw loginError

      router.push(redirectTo)
      router.refresh()
    } catch (e) {
      const err = e as Error
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Enter your email first')
      return
    }
    setError(null)
    setLoading(true)
    try {
      if (!isSupabaseConfigured()) {
        setError('Configure Supabase to use magic link')
        return
      }
      const supabase = createSupabaseBrowserClient()
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (magicError) throw magicError
      setMagicLinkSent(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-dim hover:text-text mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="bg-bg-2 border border-line rounded-lg p-8">
          <h1 className="font-serif text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-text-dim mb-8">Sign in to continue</p>

          {(error || queryError) && (
            <div className="bg-rose/10 border border-rose/30 rounded-lg p-3 mb-4 text-sm text-rose">
              {error || queryError}
            </div>
          )}

          {magicLinkSent ? (
            <div className="bg-emerald/10 border border-emerald/30 rounded-lg p-4 text-emerald text-sm">
              ✅ Check your email for the magic sign-in link!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-bg-2 text-text-dim">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="w-full py-2 border border-line text-text rounded-lg font-semibold hover:bg-bg-3 disabled:opacity-50 transition-colors"
              >
                Send Magic Link
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-text-dim">Don't have an account? </span>
            <Link href="/signup" className="text-amber hover:text-amber/90 font-semibold transition-colors">
              Sign up
            </Link>
          </div>

          {!isSupabaseConfigured() && (
            <p className="mt-4 text-xs text-text-dim text-center">
              ⚠️ Demo mode — configure Supabase env vars for real auth
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
