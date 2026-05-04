import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-text-dim hover:text-text mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="bg-bg-2 border border-line rounded-lg p-8">
          <h1 className="font-serif text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-text-dim mb-8">Join 10,000+ students learning to earn</p>

          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
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
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky transition-colors"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-text-dim">
                I agree to the{' '}
                <Link href="#" className="text-amber hover:text-amber/90">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-amber hover:text-amber/90">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 transition-colors"
            >
              Create account
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-text-dim">Already have an account? </span>
            <Link href="/login" className="text-amber hover:text-amber/90 font-semibold transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
