'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Loader2, TrendingUp, IndianRupee, Send, Sparkles } from 'lucide-react'

interface AnalyticsData {
  signups: { date: string; value: number }[]
  revenue: { date: string; value: number }[]
  posts: { date: string; value: number }[]
  aiCalls: { date: string; value: number }[]
  aiTokens: { date: string; value: number }[]
  planDistribution: Record<string, number>
  topCourses: { id: string; slug: string; title: string; view_count: number; enrollment_count: number }[]
  totals: {
    signups30d: number
    revenue30d: number
    posts30d: number
    aiCalls30d: number
    aiTokens30d: number
  }
}

function MiniChart({ data, color = 'amber' }: { data: { date: string; value: number }[]; color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-0.5 h-16 mt-2">
      {data.map((d, i) => (
        <div
          key={i}
          className={`flex-1 bg-${color}/30 hover:bg-${color}/60 transition-colors rounded-sm relative group`}
          style={{ height: `${Math.max((d.value / max) * 100, 2)}%`, minHeight: '2px' }}
          title={`${d.date}: ${d.value}`}
        />
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber" />
      </div>
    )
  }

  const cards = [
    { label: 'Signups (30d)', value: data.totals.signups30d, icon: TrendingUp, chart: data.signups, color: 'sky' },
    { label: 'Revenue (30d)', value: '₹' + data.totals.revenue30d.toLocaleString('en-IN'), icon: IndianRupee, chart: data.revenue, color: 'amber' },
    { label: 'Posts (30d)', value: data.totals.posts30d, icon: Send, chart: data.posts, color: 'emerald-400' },
    { label: 'AI calls (30d)', value: data.totals.aiCalls30d, icon: Sparkles, chart: data.aiCalls, color: 'rose' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
          <BarChart3 className="text-amber" /> Analytics
        </h1>
        <p className="text-text-dim text-sm">Last 30 days · daily breakdown</p>
      </div>

      {/* Mini chart cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-bg-2 border border-line rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-dim font-semibold">{c.label}</p>
              <c.icon className="w-4 h-4 text-text-dim" />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <MiniChart data={c.chart} color={c.color} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan distribution */}
        <div className="bg-bg-2 border border-line rounded-2xl p-5">
          <h2 className="font-bold mb-3">Plan distribution (new signups, 30d)</h2>
          {Object.keys(data.planDistribution).length === 0 ? (
            <p className="text-text-dim text-sm">No signups yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.planDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([plan, count]) => {
                  const total = Object.values(data.planDistribution).reduce((s, c) => s + c, 0)
                  const pct = (count / total) * 100
                  return (
                    <div key={plan}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-semibold">{plan}</span>
                        <span className="text-text-dim">
                          {count} · {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-bg rounded-full overflow-hidden">
                        <div className="h-full bg-amber" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Top courses */}
        <div className="bg-bg-2 border border-line rounded-2xl p-5">
          <h2 className="font-bold mb-3">Top courses by views</h2>
          {data.topCourses.length === 0 ? (
            <p className="text-text-dim text-sm">No courses yet</p>
          ) : (
            <div className="space-y-2">
              {data.topCourses.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 hover:bg-bg rounded-lg">
                  <p className="text-sm font-semibold truncate flex-1">{c.title}</p>
                  <p className="text-xs text-text-dim ml-2 shrink-0">
                    {c.view_count || 0} views · {c.enrollment_count || 0} enrolled
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
