'use client'

import { useEffect, useState } from 'react'
import { BarChart3, BookOpen, Share2, TrendingUp, Users, Zap } from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

export default function DashboardPage() {
  const [userName, setUserName] = useState('User')

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        setUserName(name)
      }
    })
  }, [])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-2">Welcome back, {userName}</h1>
        <p className="text-text-dim">Here's what's happening with your learning and campaigns</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Learning Progress',
            value: '12',
            subtext: 'courses in progress',
            icon: BookOpen,
            color: 'text-sky',
          },
          {
            label: 'Posts Scheduled',
            value: '8',
            subtext: 'this week',
            icon: Share2,
            color: 'text-amber',
          },
          {
            label: 'Active Campaigns',
            value: '3',
            subtext: 'running now',
            icon: TrendingUp,
            color: 'text-emerald',
          },
          {
            label: 'Total Reach',
            value: '2.5K',
            subtext: 'last 7 days',
            icon: Users,
            color: 'text-rose',
          },
          {
            label: 'Engagement Rate',
            value: '4.8%',
            subtext: 'above average',
            icon: Zap,
            color: 'text-violet',
          },
          {
            label: 'AI Credits',
            value: '850',
            subtext: 'remaining',
            icon: BarChart3,
            color: 'text-gold',
          },
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-bg-2 border border-line rounded-lg hover:bg-bg-3 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-text-dim text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-xs text-text-dim">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-bg-2 border border-line rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold mb-4">Recent Courses</h2>
            <div className="space-y-4">
              {[
                { title: 'Google Ads Fundamentals', progress: 65, status: 'In Progress' },
                { title: 'Meta Ads Manager Mastery', progress: 40, status: 'In Progress' },
                { title: 'AI Marketing Copywriting', progress: 85, status: 'Nearly Complete' },
              ].map((course, i) => (
                <div key={i} className="pb-4 border-b border-line last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{course.title}</p>
                      <p className="text-xs text-text-dim">{course.status}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-bg rounded-full h-2">
                    <div
                      className="bg-amber h-2 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bg-2 border border-line rounded-lg p-6">
            <h3 className="font-serif font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-amber text-bg rounded-lg font-semibold text-sm hover:bg-amber/90 transition-colors">
                Continue Learning
              </button>
              <button className="w-full px-4 py-2 border border-line text-text rounded-lg font-semibold text-sm hover:bg-bg-3 transition-colors">
                Schedule Post
              </button>
              <button className="w-full px-4 py-2 border border-line text-text rounded-lg font-semibold text-sm hover:bg-bg-3 transition-colors">
                Create Campaign
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet/10 to-sky/10 border border-violet/20 rounded-lg p-6">
            <p className="font-serif font-bold mb-2">Pro Tip</p>
            <p className="text-sm text-text-dim">
              Use AI Assistant to generate social media captions in seconds. Try it now!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
