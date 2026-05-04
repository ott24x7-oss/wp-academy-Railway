'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

export const dynamic = 'force-dynamic'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!accepted) {
      setError('Please accept the Terms of Service')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      if (!isSupabaseConfigured()) {
        // Demo mode — show message
        setSuccess('✅ Demo mode: Account would be created. Configure Supabase to enable real auth.')
        setTimeout(() => router.push('/app/dashboard'), 1500)
        return
      }

      const supabase = createSupabaseBrowserClient()
      const redirectTo = searchParams.get('redirect') || '/app/dashboard'

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (signupError) throw signupError

      // Create profile row in users table
      if (data.user) {
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email || email,
            name,
            plan: 'free',
            ai_credits_remaining: 100,
          })
        } catch (profileErr) {
          console.warn('Profile creation skipped:', profileErr)
        }
      }

      if (data.user?.identities?.length === 0) {
        setError('An account with this email already exists')
        setLoading(false)
        return
      }

      if (data.session) {
        // Auto-confirmed (email confirm disabled)
        router.push(redirectTo)
        router.refresh()
      } else {
        setSuccess('✅ Check your email to confirm your account!')
      }
    } catch (e) {
      const err = e as Error
      setError(err.message || 'Signup failed')
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
          <h1 className="font-serif text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-text-dim mb-8">Join 10,000+ marketers learning to earn</p>

          {error && (
            <div className="bg-rose/10 border border-rose/30 rounded-lg p-3 mb-4 text-sm text-rose">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald/10 border border-emerald/30 rounded-lg p-3 mb-4 text-sm text-emerald">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full px-4 py-2 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky transition-colors"
              />
            </div>

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
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky transition-colors"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-text-dim">
                I agree to the{' '}
                <Link href="/terms" className="text-amber hover:text-amber/90">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-amber hover:text-amber/90">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-text-dim">Already have an account? </span>
            <Link href="/login" className="text-amber hover:text-amber/90 font-semibold transition-colors">
              Sign in
            </Link>
          </div>

          {!isSupabaseConfigured() && (
            <p className="mt-4 text-xs text-text-dim text-center">
              ⚠️ Demo mode — configure Supabase env vars for real signup
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber" /></div>}>
      <SignupForm />
    </Suspense>
  )
}
