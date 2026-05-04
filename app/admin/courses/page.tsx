'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

interface Course {
  id: string
  title: string
  category: string
  language: string
  quality_score: number
  is_official: boolean
  has_certificate: boolean
  health_status: string
  active: boolean
  youtube_url?: string
}

export default function AdminCoursesIndex() {
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'broken'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [filter])

  async function load() {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      let q = supabase.from('courses').select('*').order('created_at', { ascending: false })
      if (filter === 'broken') q = q.eq('health_status', 'broken')
      const { data } = await q.limit(200)
      setCourses((data as Course[]) || [])
    } finally {
      setLoading(false)
    }
  }

  async function runHealth() {
    const r = await fetch('/api/cron/healthcheck-courses')
    const d = await r.json()
    alert(`Checked ${d.checked || 0}: ${d.ok || 0} OK, ${d.broken || 0} broken`)
    load()
  }

  const filtered = courses.filter(
    (c) => !search || c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Courses</h1>
          <p className="text-text-dim text-sm">
            Approve, edit, bulk import, and health-check courses
          </p>
        </div>
        <Link
          href="/app/admin/courses/add"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm hover:bg-amber/90"
        >
          <Plus className="w-4 h-4" />
          Add / Bulk import
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            filter === 'all' ? 'bg-amber text-bg' : 'bg-bg-2 border border-line text-text-dim'
          }`}
        >
          All ({courses.length})
        </button>
        <button
          onClick={() => setFilter('broken')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            filter === 'broken' ? 'bg-amber text-bg' : 'bg-bg-2 border border-line text-text-dim'
          }`}
        >
          Broken
        </button>
        <button
          onClick={runHealth}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-2 border border-line text-text-dim hover:text-text"
        >
          <RefreshCw className="w-3 h-3" />
          Run health check
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full pl-10 pr-4 py-2.5 bg-bg-2 border border-line rounded-xl text-sm focus:outline-none focus:border-sky"
        />
      </div>

      {loading ? (
        <p className="text-center text-text-dim py-8">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-bg-2 border border-line rounded-2xl">
          <p className="text-text-dim mb-3">No courses</p>
          <Link
            href="/app/admin/courses/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber text-bg rounded-lg font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add courses
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-bg-2 border border-line rounded-2xl p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  c.health_status === 'ok'
                    ? 'bg-emerald/15 text-emerald'
                    : c.health_status === 'broken'
                      ? 'bg-rose/15 text-rose'
                      : 'bg-amber/15 text-amber'
                }`}
              >
                {c.health_status === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : c.health_status === 'broken' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.title}</p>
                <p className="text-xs text-text-dim">
                  {c.category} · {c.language?.toUpperCase()} · Q:{c.quality_score}
                </p>
              </div>
              {c.youtube_url && (
                <a
                  href={c.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-text-dim hover:text-text"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
