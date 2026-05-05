'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  IndianRupee,
  Mail,
  Globe,
  Image as ImageIcon,
  BookOpen,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  ArrowRight,
  ListOrdered,
  Plug,
  Sparkles,
  Bot,
  BarChart3,
  History,
  ToggleRight,
  Activity,
  Download,
  FileText,
} from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

const SUPER_ADMIN_EMAILS = ['ensofter@gmail.com']

interface NavItem {
  href: string
  label: string
  icon: any
  exact?: boolean
  group?: string
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true, group: 'Dashboard' },

  { href: '/admin/users', label: 'Users', icon: Users, group: 'Operations' },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard, group: 'Operations' },
  { href: '/admin/payments', label: 'Payments', icon: IndianRupee, group: 'Operations' },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen, group: 'Operations' },

  { href: '/admin/integrations', label: 'API Keys', icon: Plug, group: 'AI & Integrations' },
  { href: '/admin/ai-usage', label: 'AI Usage', icon: Sparkles, group: 'AI & Integrations' },
  { href: '/admin/daily-bots', label: 'Daily Bots', icon: Bot, group: 'AI & Integrations' },

  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, group: 'Insights' },
  { href: '/admin/activity', label: 'Activity Log', icon: History, group: 'Insights' },
  { href: '/admin/health', label: 'System Health', icon: Activity, group: 'Insights' },

  { href: '/admin/email', label: 'SMTP', icon: Mail, group: 'Configuration' },
  { href: '/admin/email-templates', label: 'Email Templates', icon: FileText, group: 'Configuration' },
  { href: '/admin/site', label: 'Site & Branding', icon: Globe, group: 'Configuration' },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleRight, group: 'Configuration' },
  { href: '/admin/backup', label: 'Backup / Export', icon: Download, group: 'Configuration' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, group: 'Configuration' },
]

const bottomTabs = [
  { href: '/admin', label: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard },
  { href: '/admin/payments', label: 'Payments', icon: IndianRupee },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null)
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    if (!isSupabaseConfigured()) {
      // Demo mode: allow access
      setUser({ email: 'admin@demo', name: 'Demo Admin' })
      setAuthorized(true)
      return
    }
    try {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) {
        router.replace('/login?redirect=/admin')
        return
      }
      const isSuper = SUPER_ADMIN_EMAILS.includes(authUser.email?.toLowerCase() || '')
      const { data: profile } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', authUser.id)
        .maybeSingle()
      const isAdmin = isSuper || profile?.role === 'admin'

      setUser({ email: authUser.email || '', name: profile?.name })
      setAuthorized(isAdmin)

      // Auto-promote super admin
      if (isSuper && profile?.role !== 'admin') {
        await supabase.from('users').update({ role: 'admin' }).eq('id', authUser.id)
      }
    } catch (e) {
      console.error(e)
      setAuthorized(false)
    }
  }

  async function handleLogout() {
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
    }
    router.push('/')
    router.refresh()
  }

  function isActive(item: typeof navItems[0]) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname?.startsWith(item.href + '/')
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-text-dim">Checking access…</p>
      </div>
    )
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="max-w-md text-center bg-bg-2 border border-line rounded-2xl p-8">
          <Shield className="w-12 h-12 text-rose mx-auto mb-3" />
          <h1 className="font-serif text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-text-dim mb-4 text-sm">
            Super admin access only. Sign in with the configured admin email.
          </p>
          <p className="text-xs text-text-dim mb-6">
            Configured: <code className="text-amber">{SUPER_ADMIN_EMAILS.join(', ')}</code>
          </p>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm"
          >
            Go to user dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop Sidebar (like Cafes screenshot) */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-bg-2 md:border-r md:border-line md:flex md:flex-col z-30">
        <div className="p-5 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber to-gold flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-bg" />
            </div>
            <div>
              <p className="font-serif font-bold text-base leading-none">Super Admin</p>
              <p className="text-[10px] text-text-dim mt-0.5">WatShop Academy</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
          {Array.from(new Set(navItems.map((i) => i.group))).map((group) => (
            <div key={group}>
              {group && (
                <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-text-dim/70">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {navItems
                  .filter((i) => i.group === group)
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors ${
                        isActive(item)
                          ? 'bg-amber text-bg font-semibold'
                          : 'text-text-dim hover:text-text hover:bg-bg-3'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3 space-y-1">
          <Link
            href="/app/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-text-dim hover:text-text hover:bg-bg-3 text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            User dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-text-dim hover:text-text hover:bg-bg-3 text-sm"
          >
            <Globe className="w-4 h-4" />
            Public site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose hover:bg-rose/10 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-30 bg-bg-2/95 backdrop-blur-md border-b border-line">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber to-gold flex items-center justify-center">
                <Shield className="w-4 h-4 text-bg" />
              </div>
              <div>
                <p className="font-serif font-bold text-base leading-none">Super Admin</p>
                <p className="text-[10px] text-text-dim mt-0.5">WatShop Academy</p>
              </div>
            </div>
            <Link
              href="/app/dashboard"
              className="text-xs text-amber inline-flex items-center gap-1"
            >
              User panel
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-label="Close menu"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-bg-2 border-r border-line flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber to-gold flex items-center justify-center">
                  <Shield className="w-5 h-5 text-bg" />
                </div>
                <div>
                  <p className="font-serif font-bold text-base leading-none">Super Admin</p>
                  <p className="text-[10px] text-text-dim mt-0.5">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-bg-3 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isActive(item)
                      ? 'bg-amber text-bg font-semibold'
                      : 'text-text hover:bg-bg-3'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-line p-3 space-y-1">
              <Link
                href="/app/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-dim hover:bg-bg-3 text-sm"
              >
                <ArrowRight className="w-5 h-5" />
                User dashboard
              </Link>
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-dim hover:bg-bg-3 text-sm"
              >
                <Globe className="w-5 h-5" />
                Public site
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose hover:bg-rose/10 text-sm font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-2/95 backdrop-blur-md border-t border-line safe-bottom">
        <div className="grid grid-cols-5 items-center">
          {bottomTabs.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2.5 gap-0.5 min-h-[60px] ${
                isActive(item) ? 'text-amber' : 'text-text-dim active:text-text'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-2.5 gap-0.5 min-h-[60px] text-text-dim active:text-text"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
