'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2, Save, Eye, Code } from 'lucide-react'

interface Template {
  id: string
  slug: string
  name: string
  subject: string
  html_body: string
  text_body: string
  variables: string[]
  active: boolean
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [edit, setEdit] = useState<Partial<Template>>({})
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [previewMode, setPreviewMode] = useState<'html' | 'preview'>('preview')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/email-templates')
      const data = await res.json()
      setTemplates(data.templates || [])
      if (!selectedId && data.templates?.length) {
        setSelectedId(data.templates[0].id)
        setEdit(data.templates[0])
      }
    } finally {
      setLoading(false)
    }
  }

  function selectTemplate(t: Template) {
    setSelectedId(t.id)
    setEdit(t)
  }

  async function save() {
    if (!selectedId) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, ...edit }),
      })
      if (res.ok) {
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 1500)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
          <FileText className="text-amber" /> Email Templates
        </h1>
        <p className="text-text-dim text-sm">
          Edit transactional email templates. Use <code>{'{{variable}}'}</code> placeholders.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar list */}
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  selectedId === t.id
                    ? 'bg-amber/10 border-amber'
                    : 'bg-bg-2 border-line hover:border-amber/50'
                }`}
              >
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-xs text-text-dim font-mono">{t.slug}</p>
                {!t.active && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose/20 text-rose rounded mt-1 inline-block">
                    Disabled
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Editor */}
          {selectedId && (
            <div className="bg-bg-2 border border-line rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-text-dim">Slug (immutable)</label>
                <input
                  value={edit.slug || ''}
                  disabled
                  className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm font-mono opacity-70"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-text-dim">Name</label>
                <input
                  value={edit.name || ''}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm focus:outline-none focus:border-sky"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-text-dim">Subject</label>
                <input
                  value={edit.subject || ''}
                  onChange={(e) => setEdit({ ...edit, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm focus:outline-none focus:border-sky"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-dim">HTML Body</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPreviewMode('html')}
                      className={`px-2 py-1 text-xs rounded ${
                        previewMode === 'html' ? 'bg-amber text-bg' : 'bg-bg text-text-dim'
                      }`}
                    >
                      <Code className="w-3 h-3 inline mr-1" /> HTML
                    </button>
                    <button
                      onClick={() => setPreviewMode('preview')}
                      className={`px-2 py-1 text-xs rounded ${
                        previewMode === 'preview' ? 'bg-amber text-bg' : 'bg-bg text-text-dim'
                      }`}
                    >
                      <Eye className="w-3 h-3 inline mr-1" /> Preview
                    </button>
                  </div>
                </div>
                {previewMode === 'html' ? (
                  <textarea
                    value={edit.html_body || ''}
                    onChange={(e) => setEdit({ ...edit, html_body: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm font-mono focus:outline-none focus:border-sky"
                  />
                ) : (
                  <div
                    className="p-4 bg-white text-black rounded-lg min-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: edit.html_body || '' }}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-text-dim">Plain text body</label>
                <textarea
                  value={edit.text_body || ''}
                  onChange={(e) => setEdit({ ...edit, text_body: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm font-mono focus:outline-none focus:border-sky"
                />
              </div>

              {edit.variables && edit.variables.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-2 text-text-dim">Available variables</label>
                  <div className="flex flex-wrap gap-1.5">
                    {edit.variables.map((v) => (
                      <code
                        key={v}
                        className="px-2 py-1 bg-bg border border-line rounded text-xs text-amber"
                      >
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-line">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={edit.active ?? true}
                    onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
                    className="accent-amber"
                  />
                  Active (sends to users)
                </label>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-5 py-2 bg-amber text-bg rounded-lg font-bold hover:bg-amber/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : savedFlash ? (
                    '✓ Saved'
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
