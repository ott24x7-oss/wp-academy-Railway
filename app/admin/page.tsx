'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  IndianRupee,
  Bell,
  Mail,
  CreditCard,
  Users,
  FileText,
  BookOpen,
  ListOrdered,
  TrendingUp,
  Shield,
  Plug,
  Sparkles,
  Bot,
  BarChart3,
  ToggleRight,
  Activity,
  Download,
  History,
} from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

interface ActionCard {
  href: string
  title: string
  subtitle: string
  icon: any
  iconBg: string
  iconColor: string
  hasAlert?: boolean
}

const actionCards: ActionCard[] = [
  // Operations
  { href: '/admin/users', title: 'Users', subtitle: 'Suspend, edit plan, assign', icon: Users, iconBg: 'bg-amber/15', iconColor: 'text-amber' },
  { href: '/admin/payments', title: 'Payments', subtitle: 'UPI + IMAP verification', icon: IndianRupee, iconBg: 'bg-amber/15', iconColor: 'text-amber' },
  { href: '/admin/courses', title: 'Courses', subtitle: 'Add, edit, bulk import', icon: BookOpen, iconBg: 'bg-amber/15', iconColor: 'text-amber' },
  { href: '/admin/plans', title: 'Plans', subtitle: 'Pricing & feature limits', icon: CreditCard, iconBg: 'bg-amber/15', iconColor: 'text-amber' },

  // AI & Integrations
  { href: '/admin/integrations', title: 'API Keys', subtitle: 'Gemini, OpenRouter, SMTP, etc.', icon: Plug, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', hasAlert: true },
  { href: '/admin/ai-usage', title: 'AI Usage', subtitle: 'Tokens, calls, cost', icon: Sparkles, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
  { href: '/admin/daily-bots', title: 'Daily Bots', subtitle: 'All scheduled AI bots', icon: Bot, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },

  // Insights
  { href: '/admin/analytics', title: 'Analytics', subtitle: 'Charts: signups, revenue, posts', icon: BarChart3, iconBg: 'bg-sky/15', iconColor: 'text-sky' },
  { href: '/admin/health', title: 'System Health', subtitle: 'DB, cron, errors, env status', icon: Activity, iconBg: 'bg-sky/15', iconColor: 'text-sky' },
  { href: '/admin/activity', title: 'Activity Log', subtitle: 'Admin actions audit trail', icon: History, iconBg: 'bg-sky/15', iconColor: 'text-sky' },

  // Configuration
  { href: '/admin/email', title: 'SMTP Config', subtitle: 'Outbound mail setup', icon: Mail, iconBg: 'bg-amber/15', iconColor: 'text-amber' },
  { href: '/admin/email-templates', title: 'Email Templates', subtitle: 'Welcome, payment, reset emails', icon: FileText, iconBg: 'bg-amber/15', iconColor: 'text-amber' },
  { href: '/admin/feature-flags', title: 'Feature Flags', subtitle: 'Toggle features on/off', icon: ToggleRight, iconBg: 'bg-amber/15', iconColor: 'text-amber' },
  { href: '/admin/backup', title: 'Backup / Export', subtitle: 'JSON dump of all data', icon: Download, iconBg: 'bg-amber/15', iconColor: 'text-amber' },
]

interface Stat {
  label: string
  value: string | number
  hint: string
  icon: any
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Total users', value: '—', hint: 'loading…', icon: Users },
    { label: 'Courses', value: '—', hint: 'loading…', icon: BookOpen },
    { label: 'Orders', value: '—', hint: 'loading…', icon: ListOrdered },
    { label: 'GMV', value: '₹0', hint: 'lifetime', icon: TrendingUp },
  ])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    if (!isSupabaseConfigured()) return
    try {
      const supabase = createSupabaseBrowserClient()
      const [usersR, coursesR, ordersR, paidOrdersR] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select('amount')
          .eq('payment_status', 'verified'),
      ])
      const gmv = (paidOrdersR.data || []).reduce(
        (s: number, r: any) => s + (parseFloat(r.amount) || 0),
        0
      )
      setStats([
        {
          label: 'Total users',
          value: usersR.count || 0,
          hint: 'all signups',
          icon: Users,
        },
        {
          label: 'Courses',
          value: coursesR.count || 0,
          hint: 'in catalog',
          icon: BookOpen,
        },
        {
          label: 'Orders',
          value: ordersR.count || 0,
          hint: 'all time',
          icon: ListOrdered,
        },
        {
          label: 'GMV',
          value: '₹' + gmv.toLocaleString('en-IN'),
          hint: 'verified',
          icon: TrendingUp,
        },
      ])
    } catch (e) {
      console.warn('stats load failed', e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-1">Super Admin</h1>
        <p className="text-text-dim text-sm md:text-base">
          Platform overview · all users
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
        {actionCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-bg-2 border border-line rounded-2xl p-4 md:p-5 hover:border-amber/50 active:scale-[0.97] transition-all relative"
          >
            <div
              className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center mb-3 relative`}
            >
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              {card.hasAlert && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber rounded-full ring-2 ring-bg-2 animate-pulse" />
              )}
            </div>
            <h3 className="font-bold text-base leading-tight mb-1">{card.title}</h3>
            <p className="text-xs md:text-sm text-text-dim leading-snug">{card.subtitle}</p>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div>
        <h2 className="font-serif text-lg font-bold mb-3">Platform stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-bg-2 border border-line rounded-2xl p-4"
            >
              <stat.icon className="w-5 h-5 text-text-dim mb-3" />
              <p className="text-xs text-text-dim">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-text-dim mt-0.5">{stat.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Setup checklist */}
      <div className="bg-gradient-to-br from-amber/10 via-bg-2 to-bg-2 border border-amber/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold mb-1">Quick setup</h3>
            <p className="text-sm text-text-dim mb-3">
              Configure these to enable all platform features:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <Link href="/admin/integrations" className="text-amber hover:underline">
                🔌 API keys (AI, SMTP, social) →
              </Link>
              <Link href="/admin/email" className="text-amber hover:underline">
                ✉️ SMTP / Email setup →
              </Link>
              <Link href="/admin/payments" className="text-amber hover:underline">
                💳 UPI + IMAP payment →
              </Link>
              <Link href="/admin/plans" className="text-amber hover:underline">
                💰 Pricing plans →
              </Link>
              <Link href="/admin/email-templates" className="text-amber hover:underline">
                📧 Email templates →
              </Link>
              <Link href="/admin/feature-flags" className="text-amber hover:underline">
                🚦 Feature flags →
              </Link>
              <Link href="/admin/health" className="text-amber hover:underline">
                ❤️ System health check →
              </Link>
              <Link href="/admin/site" className="text-amber hover:underline">
                🎨 Site branding →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
