'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export interface SettingField {
  key: string
  label: string
  type?: 'text' | 'password' | 'email' | 'number' | 'textarea' | 'toggle'
  placeholder?: string
  description?: string
}

export function AdminSettingsForm({
  fields,
  title,
  description,
  testButton,
}: {
  fields: SettingField[]
  title: string
  description?: string
  testButton?: { label: string; onTest: (values: Record<string, string>) => Promise<{ ok: boolean; message?: string }> }
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [reveal, setReveal] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      const all = data.settings || {}
      const init: Record<string, string> = {}
      fields.forEach((f) => {
        init[f.key] = all[f.key]?.value || ''
      })
      setValues(init)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: values }),
      })
      const data = await res.json()
      if (data.success) {
        setSavedAt(Date.now())
        setTimeout(() => setSavedAt(null), 3000)
      } else {
        alert(data.error || 'Failed to save')
      }
    } catch (e) {
      alert('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function runTest() {
    if (!testButton) return
    setTesting(true)
    setTestResult(null)
    try {
      const r = await testButton.onTest(values)
      setTestResult((r.ok ? '✅ ' : '❌ ') + (r.message || (r.ok ? 'OK' : 'Failed')))
    } catch (e) {
      setTestResult('❌ ' + (e as Error).message)
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">{title}</h1>
        {description && <p className="text-text-dim text-sm">{description}</p>}
      </div>

      <div className="bg-bg-2 border border-line rounded-2xl p-5 md:p-6 space-y-5">
        {fields.map((field) => {
          const isSecret = field.type === 'password'
          const isRevealed = reveal[field.key]
          const inputType = isSecret && !isRevealed ? 'password' : (field.type === 'password' ? 'text' : (field.type || 'text'))

          if (field.type === 'toggle') {
            return (
              <div key={field.key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{field.label}</p>
                  {field.description && (
                    <p className="text-xs text-text-dim">{field.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, [field.key]: v[field.key] === '1' ? '0' : '1' }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    values[field.key] === '1' ? 'bg-amber' : 'bg-bg-3'
                  }`}
                  aria-label={field.label}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      values[field.key] === '1' ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            )
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1.5">{field.label}</label>
                {field.description && (
                  <p className="text-xs text-text-dim mb-2">{field.description}</p>
                )}
                <textarea
                  value={values[field.key] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg text-sm focus:outline-none focus:border-sky"
                />
              </div>
            )
          }

          return (
            <div key={field.key}>
              <label className="block text-sm font-medium mb-1.5">{field.label}</label>
              {field.description && (
                <p className="text-xs text-text-dim mb-2">{field.description}</p>
              )}
              <div className="relative">
                <input
                  type={inputType}
                  value={values[field.key] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg text-sm focus:outline-none focus:border-sky pr-10"
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => setReveal((r) => ({ ...r, [field.key]: !r[field.key] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-dim hover:text-text"
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-line">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm hover:bg-amber/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {testButton && (
            <button
              onClick={runTest}
              disabled={testing || saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-line rounded-xl font-medium text-sm hover:bg-bg-3 disabled:opacity-50"
            >
              {testing && <Loader2 className="w-4 h-4 animate-spin" />}
              {testButton.label}
            </button>
          )}
          {savedAt && (
            <span className="text-emerald text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Saved
            </span>
          )}
          {testResult && <span className="text-sm">{testResult}</span>}
        </div>
      </div>
    </div>
  )
}
