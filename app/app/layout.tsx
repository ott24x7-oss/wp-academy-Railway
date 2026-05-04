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
  Home,
  CreditCard,
  Users,
  Globe,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

// Bottom tab navigation (5 main items - mobile friendly)
const bottomTabs = [
  { href: '/app/dashboard', label: 'Home', icon: Home },
  { href: '/app/learn', label: 'Learn', icon: BookOpen },
  { href: '/app/publish', label: 'Publish', icon: Share2 },
  { href: '/app/ai', label: 'AI', icon: Sparkles },
]

// Drawer menu items (full menu)
const drawerItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/app/learn', label: 'Learn', icon: BookOpen },
  { href: '/app/publish', label: 'Publish', icon: Share2 },
  { href: '/app/ads', label: 'Ads', icon: TrendingUp },
  { href: '/app/analytics', label: 'Insights', icon: BarChart3 },
  { href: '/app/ai', label: 'AI Assistant', icon: Sparkles },
  { href: '/app/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/app/settings/team', label: 'Team', icon: Users },
]

interface UserInfo {
  email: string
  name?: string
  plan?: string
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  // Close drawer when route changes
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

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

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-r md:border-line md:bg-bg-2 md:overflow-y-auto md:flex md:flex-col z-30">
        <div className="p-6 border-b border-line">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-amber/50 flex items-center justify-center">
              <span className="text-bg font-bold text-sm">W</span>
            </div>
            <span className="font-serif text-lg font-bold">WatShop</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {drawerItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber text-bg font-semibold'
                    : 'text-text-dim hover:text-text hover:bg-bg-3'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-line p-4 space-y-2">
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-bg rounded-lg">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber to-gold flex items-center justify-center text-bg font-bold text-sm flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userDisplayName}</p>
                <p className="text-xs text-text-dim capitalize">{user.plan} plan</p>
              </div>
            </div>
          )}
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-text-dim hover:text-text hover:bg-bg-3 text-sm"
          >
            <Globe className="w-4 h-4" />
            Public site
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-rose hover:bg-rose/10 disabled:opacity-50 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 bg-bg-2/95 backdrop-blur-md border-b border-line">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/app/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-gold flex items-center justify-center shadow-lg shadow-amber/20">
                <span className="text-bg font-bold text-sm">W</span>
              </div>
              <div>
                <p className="font-serif font-bold text-base leading-none">WatShop</p>
                <p className="text-[10px] text-text-dim mt-0.5">Academy</p>
              </div>
            </Link>
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-medium leading-none">{userDisplayName}</p>
                  <p className="text-[10px] text-text-dim mt-0.5 capitalize">{user.plan}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber to-gold flex items-center justify-center text-bg font-bold text-xs">
                  {userInitials}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Mobile Drawer (slide-in from left) */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-label="Close menu"
          />
          {/* Drawer panel */}
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-bg-2 border-r border-line flex flex-col animate-in slide-in-from-left">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber to-gold flex items-center justify-center">
                  <span className="text-bg font-bold text-sm">W</span>
                </div>
                <div>
                  <p className="font-serif font-bold text-base leading-none">WatShop</p>
                  <p className="text-[10px] text-text-dim mt-0.5">Academy</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-bg-3 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="p-4 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber to-gold flex items-center justify-center text-bg font-bold text-sm">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{userDisplayName}</p>
                    <p className="text-xs text-text-dim capitalize">{user.plan} plan</p>
                  </div>
                </div>
              </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {drawerItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-amber text-bg font-semibold'
                        : 'text-text hover:bg-bg-3'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-line p-3 space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-text-dim hover:bg-bg-3 text-sm"
              >
                <Globe className="w-5 h-5" />
                Public site
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-rose hover:bg-rose/10 disabled:opacity-50 text-sm font-medium"
              >
                <LogOut className="w-5 h-5" />
                {loggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-2/95 backdrop-blur-md border-t border-line safe-bottom">
        <div className="grid grid-cols-5 items-center">
          {bottomTabs.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors min-h-[60px] ${
                  isActive ? 'text-amber' : 'text-text-dim active:text-text'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
          {/* Menu button (5th item) */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors min-h-[60px] text-text-dim active:text-text"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
