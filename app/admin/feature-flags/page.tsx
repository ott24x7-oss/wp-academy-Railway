'use client'

import { useState, useEffect } from 'react'
import { ToggleRight, Loader2 } from 'lucide-react'

interface Flag {
  key: string
  enabled: boolean
  description: string
  category: string
}

const CATEGORY_LABELS: Record<string, string> = {
  auth: '🔐 Auth',
  ai: '🤖 AI',
  social: '📱 Social',
  payment: '💳 Payment',
  email: '✉️ Email',
  admin: '⚙️ Admin',
  general: '🌐 General',
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/feature-flags')
      const data = await res.json()
      setFlags(data.flags || [])
    } finally {
      setLoading(false)
    }
  }

  async function toggle(key: string, enabled: boolean) {
    setUpdatingKey(key)
    setFlags((cur) => cur.map((f) => (f.key === key ? { ...f, enabled } : f)))
    try {
      await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      })
    } finally {
      setUpdatingKey(null)
    }
  }

  const grouped: Record<string, Flag[]> = {}
  for (const f of flags) {
    const cat = f.category || 'general'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(f)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
          <ToggleRight className="text-amber" /> Feature Flags
        </h1>
        <p className="text-text-dim text-sm">
          Toggle features on/off across the platform. Disabled features are hidden from users.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber" />
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <h2 className="font-bold mb-3">{CATEGORY_LABELS[cat] || cat}</h2>
            <div className="space-y-2">
              {items.map((f) => (
                <div
                  key={f.key}
                  className="bg-bg-2 border border-line rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm font-bold">{f.key}</code>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          f.enabled
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose/20 text-rose'
                        }`}
                      >
                        {f.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-xs text-text-dim mt-1">{f.description}</p>
                  </div>
                  <button
                    onClick={() => toggle(f.key, !f.enabled)}
                    disabled={updatingKey === f.key}
                    className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                      f.enabled ? 'bg-amber' : 'bg-text-dim/30'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-bg rounded-full transition-transform ${
                        f.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
