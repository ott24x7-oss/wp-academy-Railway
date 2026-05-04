'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  FileSpreadsheet,
} from 'lucide-react'

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
  description: string
  quality_score: number
  is_official: boolean
  has_certificate: boolean
}

const emptyRow = (): CourseRow => ({
  title: '',
  url: '',
  category: 'digital-marketing-basics',
  language: 'en',
  description: '',
  quality_score: 75,
  is_official: false,
  has_certificate: false,
})

const CSV_TEMPLATE = `title,url,category,language,description,quality_score,is_official,has_certificate
Google Ads Fundamentals,https://www.youtube.com/watch?v=VIDEO_ID,google-ads,en,Master Google Ads from scratch,95,true,true
Meta Blueprint Course,https://www.youtube.com/playlist?list=PLAYLIST_ID,meta-ads,en,Official Meta advertising,98,true,true
SEO in Hindi,https://www.youtube.com/watch?v=VIDEO_ID,seo,hi,Complete SEO course in Hindi,85,false,false`

// Robust CSV parser handling quoted values & commas in fields
function parseCSV(text: string): CourseRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  // Header row
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const idx = (name: string) => headers.indexOf(name)

  const titleI = idx('title')
  const urlI = idx('url')
  const catI = idx('category')
  const langI = idx('language')
  const descI = idx('description')
  const qualI = idx('quality_score')
  const offI = idx('is_official')
  const certI = idx('has_certificate')

  const rows: CourseRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    rows.push({
      title: cells[titleI]?.trim() || '',
      url: cells[urlI]?.trim() || '',
      category: cells[catI]?.trim() || 'digital-marketing-basics',
      language: ((cells[langI]?.trim() || 'en') as 'en' | 'hi' | 'both'),
      description: cells[descI]?.trim() || '',
      quality_score: parseInt(cells[qualI]?.trim() || '75') || 75,
      is_official: /^(true|1|yes)$/i.test(cells[offI]?.trim() || ''),
      has_certificate: /^(true|1|yes)$/i.test(cells[certI]?.trim() || ''),
    })
  }
  return rows.filter((r) => r.url)
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        cells.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
  }
  cells.push(cur)
  return cells
}

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'wp-academy-courses-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function AddCoursesPage() {
  const [rows, setRows] = useState<CourseRow[]>([emptyRow()])
  const [bulkText, setBulkText] = useState('')
  const [csvPreview, setCsvPreview] = useState<CourseRow[]>([])
  const [mode, setMode] = useState<'rows' | 'bulk' | 'csv'>('rows')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean)
    return lines.map((line) => {
      let parts = line.split('|').map((p) => p.trim())
      if (parts.length < 2) parts = line.split('\t').map((p) => p.trim())
      if (parts.length < 2) {
        const idx = line.lastIndexOf(',')
        if (idx > 0) parts = [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
      }
      let title = ''
      let url = ''
      if (parts.length >= 2) {
        title = parts[0]
        url = parts[1]
      } else {
        url = line
      }
      return { ...emptyRow(), title, url }
    })
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || ''
      const parsed = parseCSV(text)
      setCsvPreview(parsed)
      if (parsed.length === 0) {
        alert('Could not parse any valid rows. Check that you have a "url" column with YouTube links.')
      }
    }
    reader.readAsText(file)
  }

  async function handleSubmit() {
    setResults(null)
    let courses: CourseRow[] = []
    if (mode === 'rows') courses = rows
    else if (mode === 'bulk') courses = parseBulkText()
    else if (mode === 'csv') courses = csvPreview

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
        if (mode === 'bulk') setBulkText('')
        else if (mode === 'rows') setRows([emptyRow()])
        else if (mode === 'csv') {
          setCsvPreview([])
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
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
          Add courses one by one, paste a list, or upload a CSV file.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="bg-bg-2 border border-line rounded-2xl p-1 inline-flex gap-1 flex-wrap">
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
        <button
          onClick={() => setMode('csv')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
            mode === 'csv' ? 'bg-amber text-bg' : 'text-text-dim hover:text-text'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          CSV Upload
        </button>
      </div>

      {/* CSV Upload mode */}
      {mode === 'csv' && (
        <div className="bg-bg-2 border border-line rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold mb-1">Upload CSV file</h3>
              <p className="text-xs text-text-dim">
                Columns: <code className="text-amber">title, url, category, language, description, quality_score, is_official, has_certificate</code>
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-lg text-xs hover:bg-bg-3 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
          </div>

          <div className="border-2 border-dashed border-line rounded-xl p-6 text-center hover:border-amber/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFile}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <FileSpreadsheet className="w-10 h-10 text-text-dim mx-auto mb-2" />
              <p className="font-medium text-sm mb-1">Choose CSV file</p>
              <p className="text-xs text-text-dim">
                {csvPreview.length > 0
                  ? `${csvPreview.length} rows ready to import`
                  : 'Drop a .csv file or click to browse'}
              </p>
            </label>
          </div>

          {csvPreview.length > 0 && (
            <div className="border border-line rounded-xl overflow-hidden">
              <div className="bg-bg-3 px-3 py-2 border-b border-line text-xs font-semibold text-text-dim">
                Preview ({csvPreview.length} rows)
              </div>
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-bg-3 sticky top-0">
                    <tr className="text-left text-text-dim">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Lang</th>
                      <th className="px-3 py-2">Q</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 50).map((c, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-3 py-1.5 text-text-dim">{i + 1}</td>
                        <td className="px-3 py-1.5 truncate max-w-xs">{c.title || <em className="text-text-dim">(auto-fetch)</em>}</td>
                        <td className="px-3 py-1.5 text-text-dim">{c.category}</td>
                        <td className="px-3 py-1.5 uppercase text-text-dim">{c.language}</td>
                        <td className="px-3 py-1.5 text-text-dim">{c.quality_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvPreview.length > 50 && (
                  <p className="text-xs text-text-dim text-center py-2">
                    + {csvPreview.length - 50} more rows
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rows mode */}
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
                  Official
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.has_certificate}
                    onChange={(e) => updateRow(i, 'has_certificate', e.target.checked)}
                  />
                  Certificate
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

      {/* Bulk paste mode */}
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
        disabled={submitting || (mode === 'csv' && csvPreview.length === 0)}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber text-bg rounded-xl font-semibold hover:bg-amber/90 disabled:opacity-50 transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {submitting ? 'Importing...' : `Import ${
          mode === 'csv' ? csvPreview.length : mode === 'bulk' ? bulkText.split('\n').filter(l=>l.trim()).length : rows.filter(r=>r.url.trim()).length
        } courses`}
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
