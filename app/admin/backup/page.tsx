'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2, Database } from 'lucide-react'

export default function BackupPage() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/backup', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        setCounts(d.tables || {})
        setSelected(new Set(Object.keys(d.tables || {})))
      })
      .finally(() => setLoading(false))
  }, [])

  function toggle(table: string) {
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(table)) next.delete(table)
      else next.add(table)
      return next
    })
  }

  function selectAll() {
    if (counts) setSelected(new Set(Object.keys(counts)))
  }

  function selectNone() {
    setSelected(new Set())
  }

  async function download() {
    if (!selected.size) return
    setDownloading(true)
    try {
      const tables = Array.from(selected).join(',')
      window.location.href = `/api/admin/backup?tables=${tables}`
    } finally {
      setTimeout(() => setDownloading(false), 1500)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
          <Download className="text-amber" /> Backup / Export
        </h1>
        <p className="text-text-dim text-sm">
          Download a JSON snapshot. Sensitive fields (tokens, secrets) are automatically redacted.
        </p>
      </div>

      {loading || !counts ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber" />
        </div>
      ) : (
        <>
          <div className="bg-bg-2 border border-line rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Tables to export</h2>
              <div className="flex gap-2 text-xs">
                <button onClick={selectAll} className="text-amber hover:underline">
                  Select all
                </button>
                <button onClick={selectNone} className="text-text-dim hover:underline">
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(counts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([table, count]) => (
                  <label
                    key={table}
                    className="flex items-center justify-between p-3 bg-bg rounded-lg cursor-pointer hover:bg-bg-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(table)}
                        onChange={() => toggle(table)}
                        className="accent-amber"
                      />
                      <Database className="w-4 h-4 text-text-dim" />
                      <code className="text-sm font-mono">{table}</code>
                    </div>
                    <span className="text-xs text-text-dim">{count.toLocaleString()} rows</span>
                  </label>
                ))}
            </div>
          </div>

          <button
            onClick={download}
            disabled={!selected.size || downloading}
            className="w-full md:w-auto px-6 py-3 bg-amber text-bg rounded-xl font-bold hover:bg-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Download {selected.size} table{selected.size !== 1 ? 's' : ''} as JSON
          </button>

          <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 text-sm">
            <p className="font-semibold mb-1">⚠️ Security note</p>
            <ul className="space-y-1 text-text-dim text-xs">
              <li>• <code>social_accounts.access_token</code> is redacted</li>
              <li>• <code>admin_settings.value</code> is redacted when <code>is_secret=true</code></li>
              <li>• User passwords are never exported (Supabase auth handles them separately)</li>
              <li>• Store backups in a secure, encrypted location</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
