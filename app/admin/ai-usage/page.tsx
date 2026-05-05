'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, TrendingUp, IndianRupee, Activity } from 'lucide-react'

interface UsageData {
  today: { calls: number; tokens: number; costCents: number }
  week: { calls: number; tokens: number; costCents: number }
  month: { calls: number; tokens: number; costCents: number }
  byProvider: { provider: string; calls: number; tokens: number; costCents: number }[]
  topUsers: { userId: string; email?: string; name?: string; tokens: number; costCents: number; calls: number }[]
  recent: any[]
}

function fmtCents(c: number) {
  return '$' + (c / 100).toFixed(2)
}

function fmtNum(n: number) {
  if (n > 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n > 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

export default function AIUsagePage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/ai-usage')
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

  const periods = [
    { label: 'Today', stats: data.today, icon: Activity },
    { label: 'Last 7 days', stats: data.week, icon: TrendingUp },
    { label: 'This month', stats: data.month, icon: IndianRupee },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
          <Sparkles className="text-amber" /> AI Usage
        </h1>
        <p className="text-text-dim text-sm">
          Tokens, calls and estimated cost across all AI endpoints
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {periods.map((p) => (
          <div key={p.label} className="bg-bg-2 border border-line rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-text-dim font-semibold">{p.label}</p>
              <p.icon className="w-4 h-4 text-text-dim" />
            </div>
            <p className="text-3xl font-bold mb-1">{fmtNum(p.stats.tokens)}</p>
            <p className="text-xs text-text-dim mb-3">tokens · {p.stats.calls} calls</p>
            <p className="text-amber font-semibold">~{fmtCents(p.stats.costCents)}</p>
            <p className="text-[10px] text-text-dim">est. cost</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Provider breakdown */}
        <div className="bg-bg-2 border border-line rounded-2xl p-5">
          <h2 className="font-bold mb-3">By provider (this month)</h2>
          {data.byProvider.length === 0 ? (
            <p className="text-text-dim text-sm">No usage yet</p>
          ) : (
            <div className="space-y-2">
              {data.byProvider.map((p) => (
                <div key={p.provider} className="flex items-center justify-between p-3 bg-bg rounded-lg">
                  <div>
                    <p className="font-semibold capitalize">{p.provider}</p>
                    <p className="text-xs text-text-dim">{p.calls} calls</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{fmtNum(p.tokens)}</p>
                    <p className="text-xs text-amber">~{fmtCents(p.costCents)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top users */}
        <div className="bg-bg-2 border border-line rounded-2xl p-5">
          <h2 className="font-bold mb-3">Top users (this month)</h2>
          {data.topUsers.length === 0 ? (
            <p className="text-text-dim text-sm">No usage yet</p>
          ) : (
            <div className="space-y-2">
              {data.topUsers.map((u) => (
                <div key={u.userId} className="flex items-center justify-between p-3 bg-bg rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name || u.email || u.userId.slice(0, 8)}</p>
                    <p className="text-xs text-text-dim truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-sm">{fmtNum(u.tokens)}</p>
                    <p className="text-xs text-text-dim">{u.calls} calls</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent calls */}
      <div className="bg-bg-2 border border-line rounded-2xl p-5">
        <h2 className="font-bold mb-3">Recent calls</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-text-dim uppercase">
              <tr className="border-b border-line">
                <th className="text-left py-2 pr-3">Time</th>
                <th className="text-left py-2 pr-3">Endpoint</th>
                <th className="text-left py-2 pr-3">Provider</th>
                <th className="text-left py-2 pr-3">Model</th>
                <th className="text-right py-2 pr-3">Tokens</th>
                <th className="text-right py-2 pr-3">Cost</th>
                <th className="text-center py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((r) => (
                <tr key={r.id} className="border-b border-line/50">
                  <td className="py-2 pr-3 text-xs text-text-dim">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{r.endpoint}</td>
                  <td className="py-2 pr-3 capitalize">{r.provider}</td>
                  <td className="py-2 pr-3 text-xs text-text-dim font-mono">
                    {r.model?.split('/').pop()?.split(':')[0]}
                  </td>
                  <td className="py-2 pr-3 text-right">{r.total_tokens}</td>
                  <td className="py-2 pr-3 text-right text-amber">
                    {fmtCents(r.estimated_cost_cents)}
                  </td>
                  <td className="py-2 text-center">
                    {r.success ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-rose" title={r.error_message}>
                        ✗
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recent.length === 0 && (
            <p className="text-text-dim text-sm text-center py-6">No AI calls yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
