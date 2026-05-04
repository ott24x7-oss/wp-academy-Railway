'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/app/learn', label: 'Learn', icon: BookOpen },
  { href: '/app/publish', label: 'Publish', icon: Share2 },
  { href: '/app/ads', label: 'Ads', icon: TrendingUp },
  { href: '/app/analytics', label: 'Insights', icon: BarChart3 },
  { href: '/app/ai', label: 'AI', icon: Sparkles },
]

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-r md:border-line md:bg-bg-2 md:overflow-y-auto md:flex md:flex-col">
        <div className="p-6 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-amber/50 flex items-center justify-center">
              <span className="text-bg font-bold text-sm">W</span>
            </div>
            <span className="font-serif text-lg font-bold">WatShop</span>
          </div>
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
          <Link
            href="/app/settings/billing"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-text-dim hover:text-text hover:bg-bg-3`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-text-dim hover:text-text hover:bg-bg-3">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="border-t border-line p-4 space-y-2">
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
