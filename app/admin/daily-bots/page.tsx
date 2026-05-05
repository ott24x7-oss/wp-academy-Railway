'use client'

import { useState, useEffect } from 'react'
import { Bot, Loader2, Clock, Play, Pause } from 'lucide-react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TYPE_EMOJI: Record<string, string> = {
  'daily-quote': '✨',
  'daily-question': '💬',
  'social-post': '📱',
  custom: '🎨',
}

export default function AdminDailyBotsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/daily-bots')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
          <Bot className="text-amber" /> Daily Bots — System View
        </h1>
        <p className="text-text-dim text-sm">All scheduled AI bots across all users</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total bots', value: data.stats.total },
          { label: 'Active', value: data.stats.active, color: 'text-emerald-400' },
          { label: 'Auto-post mode', value: data.stats.autoMode, color: 'text-amber' },
          { label: 'Total runs', value: data.stats.totalRuns },
        ].map((s) => (
          <div key={s.label} className="bg-bg-2 border border-line rounded-2xl p-4">
            <p className="text-xs text-text-dim">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color || ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-bold mb-3">All bots</h2>
        <div className="space-y-2">
          {data.jobs.length === 0 ? (
            <div className="bg-bg-2 border border-line border-dashed rounded-2xl p-8 text-center text-text-dim">
              No daily bots created yet
            </div>
          ) : (
            data.jobs.map((job: any) => (
              <div key={job.id} className="bg-bg-2 border border-line rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{TYPE_EMOJI[job.type]}</span>
                      <h3 className="font-bold truncate">{job.name}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          job.active
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-text-dim/20 text-text-dim'
                        }`}
                      >
                        {job.active ? 'Active' : 'Paused'}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          job.mode === 'auto' ? 'bg-amber/20 text-amber' : 'bg-sky/20 text-sky'
                        }`}
                      >
                        {job.mode}
                      </span>
                    </div>
                    <p className="text-xs text-text-dim">{job.topic}</p>
                    <div className="flex gap-3 mt-1.5 text-xs text-text-dim flex-wrap">
                      <span>👤 {job.user_email || job.user_name || job.user_id?.slice(0, 8)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {job.schedule_time?.slice(0, 5)}{' '}
                        {job.timezone}
                      </span>
                      <span>
                        {job.days_of_week?.length === 7
                          ? 'Daily'
                          : job.days_of_week?.map((d: number) => DAY_NAMES[d]).join(', ')}
                      </span>
                      <span>→ {job.platforms?.join(', ')}</span>
                      <span>{job.total_runs} runs</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent runs */}
      <div>
        <h2 className="font-bold mb-3">Recent runs</h2>
        <div className="bg-bg-2 border border-line rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-text-dim uppercase">
              <tr className="border-b border-line">
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Generated</th>
                <th className="text-left p-3">Posts</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRuns.map((r: any) => (
                <tr key={r.id} className="border-b border-line/50">
                  <td className="p-3 text-xs text-text-dim">
                    {new Date(r.started_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        r.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : r.status === 'failed'
                            ? 'bg-rose/20 text-rose'
                            : r.status === 'partial'
                              ? 'bg-amber/20 text-amber'
                              : 'bg-text-dim/20 text-text-dim'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs max-w-md truncate">{r.generated_text}</td>
                  <td className="p-3 text-xs text-text-dim">
                    {r.post_results?.length || 0} platforms
                  </td>
                </tr>
              ))}
              {data.recentRuns.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-text-dim">
                    No runs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
