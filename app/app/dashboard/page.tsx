'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Share2,
  TrendingUp,
  Sparkles,
  CreditCard,
  Mail,
  Users,
  FileText,
  Coffee,
  Bell,
  IndianRupee,
  ListOrdered,
  ArrowRight,
  Shield,
} from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

const SUPER_ADMIN_EMAILS = ['ensofter@gmail.com']

interface ActionCard {
  href: string
  title: string
  subtitle: string
  icon: any
  iconBg: string
  iconColor: string
  badge?: string
}

const actionCards: ActionCard[] = [
  {
    href: '/app/learn',
    title: 'Learn',
    subtitle: 'Hindi & English courses',
    icon: BookOpen,
    iconBg: 'bg-sky/15',
    iconColor: 'text-sky',
  },
  {
    href: '/app/publish',
    title: 'Publish',
    subtitle: 'Schedule posts',
    icon: Share2,
    iconBg: 'bg-amber/15',
    iconColor: 'text-amber',
  },
  {
    href: '/app/ads',
    title: 'Ads',
    subtitle: 'Meta, Google, more',
    icon: TrendingUp,
    iconBg: 'bg-emerald/15',
    iconColor: 'text-emerald',
  },
  {
    href: '/app/ai',
    title: 'AI Assistant',
    subtitle: 'Claude powered',
    icon: Sparkles,
    iconBg: 'bg-violet/15',
    iconColor: 'text-violet',
  },
  {
    href: '/app/analytics',
    title: 'Insights',
    subtitle: 'Cross-channel reports',
    icon: FileText,
    iconBg: 'bg-rose/15',
    iconColor: 'text-rose',
  },
  {
    href: '/app/settings/billing',
    title: 'Billing',
    subtitle: 'UPI + Crypto',
    icon: CreditCard,
    iconBg: 'bg-gold/15',
    iconColor: 'text-gold',
    badge: 'Free',
  },
]

interface Stat {
  label: string
  value: string
  hint: string
  icon: any
}

const stats: Stat[] = [
  { label: 'Courses', value: '50+', hint: 'curated', icon: BookOpen },
  { label: 'AI Credits', value: '100', hint: 'this month', icon: Sparkles },
  { label: 'Posts', value: '0', hint: 'scheduled', icon: Share2 },
  { label: 'Earnings', value: '₹0', hint: 'lifetime', icon: IndianRupee },
]

export default function DashboardPage() {
  const [userName, setUserName] = useState('User')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        setUserName(name)
        const isSuper = SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')
        if (isSuper) {
          setIsAdmin(true)
        } else {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          setIsAdmin(profile?.role === 'admin')
        }
      }
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-1">
            Welcome back, {userName}
          </h1>
          <p className="text-text-dim text-sm md:text-base">
            From learning to earning · all in one panel
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber/10 border border-amber/30 text-amber rounded-xl text-sm font-semibold hover:bg-amber/20"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">Open Admin</span>
            <span className="md:hidden">Admin</span>
          </Link>
        )}
      </div>

      {/* Action Cards Grid (2-col on mobile, 3-col on tablet, 4-col on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {actionCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-bg-2 border border-line rounded-2xl p-4 hover:border-amber/50 active:scale-[0.97] transition-all relative overflow-hidden"
          >
            {card.badge && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-amber rounded-full"></div>
            )}
            <div
              className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}
            >
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <h3 className="font-semibold text-base leading-tight mb-1">{card.title}</h3>
            <p className="text-xs text-text-dim leading-snug">{card.subtitle}</p>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="font-serif text-xl font-bold mb-3">Your stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-bg-2 border border-line rounded-2xl p-4"
            >
              <stat.icon className="w-5 h-5 text-text-dim mb-3" />
              <p className="text-xs text-text-dim mb-1">{stat.label}</p>
              <p className="text-2xl font-bold leading-none">{stat.value}</p>
              <p className="text-[11px] text-text-dim mt-1.5">{stat.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Continue Learning */}
      <div className="bg-gradient-to-br from-amber/10 via-bg-2 to-bg-2 border border-amber/30 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-amber/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-bold mb-1">Start your first course</h3>
            <p className="text-sm text-text-dim leading-snug">
              50+ official courses from Google, Meta, HubSpot & YouTube
            </p>
          </div>
        </div>
        <Link
          href="/app/learn"
          className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm hover:bg-amber/90 active:scale-[0.97] transition-all"
        >
          Browse courses
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick links footer */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/app/settings/billing"
          className="flex items-center gap-3 bg-bg-2 border border-line rounded-2xl p-4 hover:border-line-2 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald/15 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-emerald" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Upgrade</p>
            <p className="text-xs text-text-dim truncate">Pro from ₹3,999</p>
          </div>
        </Link>
        <Link
          href="/app/settings/team"
          className="flex items-center gap-3 bg-bg-2 border border-line rounded-2xl p-4 hover:border-line-2 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-violet/15 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-violet" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Team</p>
            <p className="text-xs text-text-dim truncate">Invite members</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
