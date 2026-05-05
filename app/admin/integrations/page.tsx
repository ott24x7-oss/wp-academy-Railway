'use client'

import { useState, useEffect } from 'react'
import { Plug, Eye, EyeOff, Save, Loader2, Check, X, ExternalLink, Database, Server } from 'lucide-react'

interface Integration {
  key: string
  label: string
  category: string
  help: string
  configured: boolean
  source: 'db' | 'env' | 'none'
  masked: string
}

interface TestResult {
  ok: boolean
  message: string
}

const CATEGORY_LABELS: Record<string, string> = {
  ai: '🤖 AI Providers',
  social: '📱 Social Media',
  security: '🔐 Security',
  email: '✉️ Email / SMTP',
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [revealKeys, setRevealKeys] = useState<Set<string>>(new Set())
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [testingKey, setTestingKey] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [savedFlash, setSavedFlash] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/integrations')
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } finally {
      setLoading(false)
    }
  }

  async function save(key: string) {
    setSavingKey(key)
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editValues[key] || '' }),
      })
      if (res.ok) {
        setSavedFlash(key)
        setTimeout(() => setSavedFlash(null), 1500)
        setEditValues((cur) => ({ ...cur, [key]: '' }))
        load()
      }
    } finally {
      setSavingKey(null)
    }
  }

  async function test(key: string) {
    setTestingKey(key)
    try {
      const res = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const data = await res.json()
      setTestResults((cur) => ({ ...cur, [key]: data }))
    } catch (e) {
      setTestResults((cur) => ({
        ...cur,
        [key]: { ok: false, message: (e as Error).message },
      }))
    } finally {
      setTestingKey(null)
    }
  }

  function toggleReveal(key: string) {
    setRevealKeys((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const grouped: Record<string, Integration[]> = {}
  for (const i of integrations) {
    if (!grouped[i.category]) grouped[i.category] = []
    grouped[i.category].push(i)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
          <Plug className="text-amber" /> API Keys & Integrations
        </h1>
        <p className="text-text-dim text-sm">
          Manage API keys for AI providers, social platforms, email and security. Values stored
          here override environment variables — no redeploy needed.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber" />
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <h2 className="font-serif text-lg font-bold mb-3">{CATEGORY_LABELS[cat] || cat}</h2>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.key} className="bg-bg-2 border border-line rounded-2xl p-4">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{it.label}</h3>
                        {it.configured ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              it.source === 'db'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-sky/20 text-sky'
                            }`}
                            title={
                              it.source === 'db' ? 'Stored in database' : 'From environment variable'
                            }
                          >
                            {it.source === 'db' ? (
                              <span className="inline-flex items-center gap-1">
                                <Database className="w-3 h-3" /> DB
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Server className="w-3 h-3" /> ENV
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-rose/20 text-rose">
                            Not set
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-dim font-mono">{it.key}</p>
                      <p className="text-xs text-text-dim mt-1">{it.help}</p>
                    </div>
                    {testResults[it.key] && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          testResults[it.key].ok
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose/20 text-rose'
                        }`}
                      >
                        {testResults[it.key].ok ? '✓' : '✗'} {testResults[it.key].message}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <input
                        type={revealKeys.has(it.key) ? 'text' : 'password'}
                        value={editValues[it.key] ?? ''}
                        onChange={(e) =>
                          setEditValues((cur) => ({ ...cur, [it.key]: e.target.value }))
                        }
                        placeholder={it.configured ? it.masked : 'Paste new value to set'}
                        className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm pr-10 focus:outline-none focus:border-sky font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleReveal(it.key)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-dim hover:text-text"
                      >
                        {revealKeys.has(it.key) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => save(it.key)}
                      disabled={savingKey === it.key}
                      className="px-3 py-2 bg-amber text-bg rounded-lg text-sm font-bold hover:bg-amber/90 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingKey === it.key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : savedFlash === it.key ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                    {it.configured && (
                      <button
                        onClick={() => test(it.key)}
                        disabled={testingKey === it.key}
                        className="px-3 py-2 bg-bg border border-line rounded-lg text-sm font-semibold hover:border-sky disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {testingKey === it.key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        Test
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 text-sm">
        <p className="font-semibold mb-1">💡 How it works</p>
        <ul className="space-y-1 text-text-dim text-xs">
          <li>
            <strong>DB</strong> badge: value stored in <code>admin_settings</code> table —
            overrides env var, no redeploy needed.
          </li>
          <li>
            <strong>ENV</strong> badge: value comes from Vercel environment variable. To override
            from this UI, paste a new value and save.
          </li>
          <li>
            Empty value + Save = remove DB override (will fall back to env var if set).
          </li>
        </ul>
      </div>
    </div>
  )
}
