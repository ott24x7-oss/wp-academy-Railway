'use client'

import { useState, useEffect } from 'react'
import { Activity, Loader2, Check, X, AlertTriangle, RefreshCw } from 'lucide-react'

interface HealthData {
  status: string
  checks: {
    database: { ok: boolean; latencyMs: number; error?: string }
    cron: { ok: boolean; lastRunAt?: string; lastStatus?: string }
    errors24h: { aiFailures: number; postFailures: number }
    integrations: { key: string; configured: boolean }[]
  }
  env: {
    node: string
    platform: string
    siteUrl: string
  }
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/health')
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber" />
      </div>
    )
  }

  const overallOk = data.status === 'healthy'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
            <Activity className="text-amber" /> System Health
          </h1>
          <p className="text-text-dim text-sm">Live diagnostics</p>
        </div>
        <button
          onClick={load}
          className="px-3 py-2 bg-bg-2 border border-line rounded-lg text-sm hover:border-amber flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Overall status */}
      <div
        className={`rounded-2xl p-5 border ${
          overallOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose/10 border-rose/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {overallOk ? (
            <Check className="w-8 h-8 text-emerald-400" />
          ) : (
            <X className="w-8 h-8 text-rose" />
          )}
          <div>
            <p className="font-bold text-lg">
              {overallOk ? 'All systems operational' : 'Issues detected'}
            </p>
            <p className="text-xs text-text-dim">
              Node {data.env.node} on {data.env.platform} · {data.env.siteUrl}
            </p>
          </div>
        </div>
      </div>

      {/* Database */}
      <div className="bg-bg-2 border border-line rounded-2xl p-5">
        <h2 className="font-bold mb-3">Database</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {data.checks.database.ok ? '✓ Connected' : '✗ Connection failed'}
          </span>
          {data.checks.database.ok && (
            <span className="text-xs text-text-dim">
              {data.checks.database.latencyMs}ms latency
            </span>
          )}
        </div>
        {data.checks.database.error && (
          <p className="mt-2 text-xs text-rose">{data.checks.database.error}</p>
        )}
      </div>

      {/* Cron */}
      <div className="bg-bg-2 border border-line rounded-2xl p-5">
        <h2 className="font-bold mb-3">Cron jobs</h2>
        {data.checks.cron.ok ? (
          <div className="flex items-center justify-between">
            <span className="text-sm">
              ✓ Last run:{' '}
              <span
                className={
                  data.checks.cron.lastStatus === 'success'
                    ? 'text-emerald-400'
                    : data.checks.cron.lastStatus === 'failed'
                      ? 'text-rose'
                      : 'text-amber'
                }
              >
                {data.checks.cron.lastStatus}
              </span>
            </span>
            <span className="text-xs text-text-dim">
              {data.checks.cron.lastRunAt && new Date(data.checks.cron.lastRunAt).toLocaleString()}
            </span>
          </div>
        ) : (
          <p className="text-text-dim text-sm">No cron runs yet</p>
        )}
      </div>

      {/* Recent errors */}
      <div className="bg-bg-2 border border-line rounded-2xl p-5">
        <h2 className="font-bold mb-3">Errors (last 24h)</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg rounded-lg p-3">
            <p className="text-xs text-text-dim">AI failures</p>
            <p
              className={`text-2xl font-bold ${
                data.checks.errors24h.aiFailures > 0 ? 'text-rose' : ''
              }`}
            >
              {data.checks.errors24h.aiFailures}
            </p>
          </div>
          <div className="bg-bg rounded-lg p-3">
            <p className="text-xs text-text-dim">Post failures</p>
            <p
              className={`text-2xl font-bold ${
                data.checks.errors24h.postFailures > 0 ? 'text-rose' : ''
              }`}
            >
              {data.checks.errors24h.postFailures}
            </p>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-bg-2 border border-line rounded-2xl p-5">
        <h2 className="font-bold mb-3">Integrations configured</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.checks.integrations.map((i) => (
            <div
              key={i.key}
              className="flex items-center justify-between p-2 bg-bg rounded-lg text-sm"
            >
              <code className="text-xs font-mono">{i.key}</code>
              {i.configured ? (
                <span className="text-emerald-400 flex items-center gap-1 text-xs">
                  <Check className="w-3.5 h-3.5" /> Set
                </span>
              ) : (
                <span className="text-text-dim flex items-center gap-1 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" /> Missing
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
