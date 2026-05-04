'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const CATEGORIES = [
  'digital-marketing-basics',
  'google-ads',
  'meta-ads',
  'seo',
  'social-media-marketing',
  'youtube-marketing',
  'video-editing',
  'design-canva',
  'ai-marketing',
  'whatsapp-marketing',
  'agency-sales',
  'analytics-reporting',
  'content-creation',
  'freelancing-client-hunting',
]

interface CourseRow {
  title: string
  url: string
  category: string
  language: 'en' | 'hi' | 'both'
  quality_score: number
  is_official: boolean
  has_certificate: boolean
}

const emptyRow = (): CourseRow => ({
  title: '',
  url: '',
  category: 'digital-marketing-basics',
  language: 'en',
  quality_score: 75,
  is_official: false,
  has_certificate: false,
})

export default function AddCoursesPage() {
  const [rows, setRows] = useState<CourseRow[]>([emptyRow()])
  const [bulkText, setBulkText] = useState('')
  const [mode, setMode] = useState<'rows' | 'bulk'>('rows')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)

  function updateRow(i: number, field: keyof CourseRow, value: any) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  function parseBulkText(): CourseRow[] {
    // Parse formats:
    // "Title | URL"
    // "Title, URL"
    // "Title\thttps://..."
    // Just URL (title will auto-fill from YouTube)
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean)
    return lines.map((line) => {
      // Try | separator first
      let parts = line.split('|').map((p) => p.trim())
      if (parts.length < 2) parts = line.split('\t').map((p) => p.trim())
      if (parts.length < 2) {
        // Try last comma (URLs may have commas)
        const idx = line.lastIndexOf(',')
        if (idx > 0) parts = [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
      }

      let title = ''
      let url = ''
      if (parts.length >= 2) {
        title = parts[0]
        url = parts[1]
      } else {
        // Just a URL — title will auto-fetch
        url = line
      }

      return { ...emptyRow(), title, url }
    })
  }

  async function handleSubmit() {
    setResults(null)
    const courses = mode === 'bulk' ? parseBulkText() : rows
    const validCourses = courses.filter((c) => c.url.trim())

    if (validCourses.length === 0) {
      alert('Add at least one course with a URL')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/courses/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: validCourses }),
      })
      const data = await response.json()
      setResults(data)
      if (data.successful === validCourses.length) {
        // All success — reset form
        if (mode === 'bulk') setBulkText('')
        else setRows([emptyRow()])
      }
    } catch (e) {
      alert('Network error: ' + (e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/app/admin/courses"
        className="inline-flex items-center gap-2 text-amber hover:text-amber/90 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to courses
      </Link>

      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Add Courses</h1>
        <p className="text-text-dim text-sm">
          Add courses one by one or paste a bulk list. URLs auto-extract YouTube metadata.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="bg-bg-2 border border-line rounded-2xl p-1 inline-flex gap-1">
        <button
          onClick={() => setMode('rows')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            mode === 'rows' ? 'bg-amber text-bg' : 'text-text-dim hover:text-text'
          }`}
        >
          Form
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            mode === 'bulk' ? 'bg-amber text-bg' : 'text-text-dim hover:text-text'
          }`}
        >
          Bulk Paste
        </button>
      </div>

      {mode === 'rows' && (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="bg-bg-2 border border-line rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-dim">Course #{i + 1}</span>
                {rows.length > 1 && (
                  <button
                    onClick={() => removeRow(i)}
                    className="p-1.5 text-rose hover:bg-rose/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1">
                  Title (leave blank to auto-fetch from YouTube)
                </label>
                <input
                  type="text"
                  value={row.title}
                  onChange={(e) => updateRow(i, 'title', e.target.value)}
                  placeholder="e.g. Google Ads Fundamentals"
                  className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm focus:outline-none focus:border-sky"
                />
              </div>
              <div>
                <label className="block text-xs text-text-dim mb-1">YouTube URL *</label>
                <input
                  type="url"
                  value={row.url}
                  onChange={(e) => updateRow(i, 'url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm focus:outline-none focus:border-sky"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-dim mb-1">Category</label>
                  <select
                    value={row.category}
                    onChange={(e) => updateRow(i, 'category', e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm focus:outline-none focus:border-sky"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1">Language</label>
                  <select
                    value={row.language}
                    onChange={(e) => updateRow(i, 'language', e.target.value as any)}
                    className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-sm focus:outline-none focus:border-sky"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.is_official}
                    onChange={(e) => updateRow(i, 'is_official', e.target.checked)}
                  />
                  Official course
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.has_certificate}
                    onChange={(e) => updateRow(i, 'has_certificate', e.target.checked)}
                  />
                  Has certificate
                </label>
                <label className="flex items-center gap-2">
                  Quality:
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.quality_score}
                    onChange={(e) => updateRow(i, 'quality_score', parseInt(e.target.value) || 75)}
                    className="w-16 px-2 py-1 bg-bg border border-line rounded text-sm"
                  />
                </label>
              </div>
            </div>
          ))}
          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-line text-text-dim hover:text-text hover:bg-bg-2 rounded-2xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add another course
          </button>
        </div>
      )}

      {mode === 'bulk' && (
        <div className="bg-bg-2 border border-line rounded-2xl p-4 space-y-3">
          <label className="block text-sm font-medium">
            Paste courses (one per line)
          </label>
          <p className="text-xs text-text-dim">
            Format: <code className="text-amber">Title | URL</code> &nbsp; or just URL (title auto-fetched)
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Google Ads Fundamentals | https://youtube.com/watch?v=...
Meta Blueprint | https://youtube.com/playlist?list=...
https://youtu.be/dQw4w9WgXcQ`}
            rows={10}
            className="w-full px-3 py-3 bg-bg border border-line rounded-lg text-sm font-mono focus:outline-none focus:border-sky resize-y"
          />
          <p className="text-xs text-text-dim">
            {bulkText.split('\n').filter((l) => l.trim()).length} lines detected
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber text-bg rounded-xl font-semibold hover:bg-amber/90 disabled:opacity-50 transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {submitting ? 'Importing...' : 'Import Courses'}
      </button>

      {results && (
        <div className="bg-bg-2 border border-line rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald" />
            <h3 className="font-semibold">
              Imported {results.successful} of {results.total}
              {results.failed > 0 && ` (${results.failed} failed)`}
            </h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.results?.map((r: any, i: number) => (
              <div
                key={i}
                className={`text-xs flex items-start gap-2 p-2 rounded ${
                  r.success ? 'text-emerald' : 'text-rose'
                }`}
              >
                {r.success ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{r.title}</p>
                  {r.error && <p className="text-text-dim">{r.error}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
