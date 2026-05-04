'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  Share2,
  TrendingUp,
  BarChart3,
  Sparkles,
  Menu,
  X,
  Settings,
  LogOut,
  User,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/app/learn', label: 'Learn', icon: BookOpen },
  { href: '/app/publish', label: 'Publish', icon: Share2 },
  { href: '/app/ads', label: 'Ads', icon: TrendingUp },
  { href: '/app/analytics', label: 'Insights', icon: BarChart3 },
  { href: '/app/ai', label: 'AI', icon: Sparkles },
]

interface UserInfo {
  email: string
  name?: string
  plan?: string
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    if (!isSupabaseConfigured()) {
      setUser({ email: 'demo@watshop.in', name: 'Demo User', plan: 'free' })
      return
    }
    try {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (authUser) {
        // Try to load profile from users table
        const { data: profile } = await supabase
          .from('users')
          .select('name, plan')
          .eq('id', authUser.id)
          .maybeSingle()
        setUser({
          email: authUser.email || '',
          name: profile?.name || authUser.user_metadata?.name,
          plan: profile?.plan || 'free',
        })
      }
    } catch (e) {
      console.warn('Auth check failed:', e)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      if (isSupabaseConfigured()) {
        const supabase = createSupabaseBrowserClient()
        await supabase.auth.signOut()
      }
      router.push('/')
      router.refresh()
    } catch (e) {
      console.error('Logout failed:', e)
    } finally {
      setLoggingOut(false)
    }
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-r md:border-line md:bg-bg-2 md:overflow-y-auto md:flex md:flex-col">
        <div className="p-6 border-b border-line">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-amber/50 flex items-center justify-center">
              <span className="text-bg font-bold text-sm">W</span>
            </div>
            <span className="font-serif text-lg font-bold">WatShop</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-bg text-amber'
                  : 'text-text-dim hover:text-text hover:bg-bg-3'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-line p-4 space-y-2">
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-bg rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-bg font-bold text-sm flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                <p className="text-xs text-text-dim capitalize">{user.plan} plan</p>
              </div>
            </div>
          )}
          <Link
            href="/app/settings/billing"
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-text-dim hover:text-text hover:bg-bg-3"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-text-dim hover:text-text hover:bg-bg-3 disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">{loggingOut ? 'Signing out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pb-24 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-40 bg-bg-2 border-b border-line">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber to-amber/50 flex items-center justify-center">
                <span className="text-bg font-bold text-xs">W</span>
              </div>
              <span className="font-serif font-bold text-sm">WatShop</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-bg-3 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="border-t border-line p-4 space-y-2">
              {user && (
                <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-bg rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-bg font-bold text-sm">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                    <p className="text-xs text-text-dim capitalize">{user.plan} plan</p>
                  </div>
                </div>
              )}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg transition-colors text-sm ${
                    pathname === item.href
                      ? 'bg-bg text-amber'
                      : 'text-text-dim hover:text-text hover:bg-bg-3'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/app/settings/billing"
                className="block px-4 py-2 rounded-lg transition-colors text-sm text-text-dim hover:text-text hover:bg-bg-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full text-left px-4 py-2 rounded-lg transition-colors text-sm text-rose hover:bg-bg-3"
              >
                {loggingOut ? 'Signing out...' : 'Logout'}
              </button>
            </nav>
          )}
        </div>

        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-2 border-t border-line">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
                pathname === item.href ? 'text-amber' : 'text-text-dim hover:text-text'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
