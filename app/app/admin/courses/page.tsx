'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  RefreshCw,
  Edit2,
  ExternalLink,
} from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

interface Course {
  id: string
  title: string
  slug: string
  category: string
  language: string
  quality_score: number
  is_official: boolean
  has_certificate: boolean
  is_outdated: boolean
  health_status: string
  active: boolean
  youtube_url?: string
  created_at: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filter, setFilter] = useState<'all' | 'review' | 'broken'>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, broken: 0, needsReview: 0 })

  useEffect(() => {
    loadCourses()
  }, [filter])

  async function loadCourses() {
    setLoading(true)
    if (!isSupabaseConfigured()) {
      setCourses([])
      setLoading(false)
      return
    }
    try {
      const supabase = createSupabaseBrowserClient()
      let query = supabase.from('courses').select('*').order('created_at', { ascending: false })

      if (filter === 'broken') {
        query = query.eq('health_status', 'broken')
      } else if (filter === 'review') {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        query = query.lt('last_reviewed_at', sixMonthsAgo.toISOString())
      }

      const { data, error } = await query.limit(100)
      if (!error && data) {
        setCourses(data as Course[])
      }

      // Stats
      const { count: total } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
      const { count: broken } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('health_status', 'broken')
      setStats({
        total: total || 0,
        broken: broken || 0,
        needsReview: 0,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function runHealthCheck() {
    try {
      const res = await fetch('/api/cron/healthcheck-courses')
      const data = await res.json()
      alert(`Checked ${data.checked} courses. ${data.ok} OK, ${data.broken} broken.`)
      loadCourses()
    } catch (e) {
      alert('Health check failed')
    }
  }

  const displayed = courses.filter(
    (c) => !search || c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Course Management</h1>
          <p className="text-text-dim text-sm">Approve, edit, and review courses</p>
        </div>
        <Link
          href="/app/admin/courses/add"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm hover:bg-amber/90"
        >
          <Plus className="w-4 h-4" />
          Add Courses
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-2 border border-line rounded-2xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald mb-2" />
          <p className="text-xs text-text-dim">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-bg-2 border border-line rounded-2xl p-4">
          <Clock className="w-5 h-5 text-amber mb-2" />
          <p className="text-xs text-text-dim">Need Review</p>
          <p className="text-2xl font-bold text-amber">{stats.needsReview}</p>
        </div>
        <div className="bg-bg-2 border border-line rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-rose mb-2" />
          <p className="text-xs text-text-dim">Broken</p>
          <p className="text-2xl font-bold text-rose">{stats.broken}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            filter === 'all' ? 'bg-amber text-bg' : 'bg-bg-2 border border-line text-text-dim'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('review')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            filter === 'review' ? 'bg-amber text-bg' : 'bg-bg-2 border border-line text-text-dim'
          }`}
        >
          Needs Review
        </button>
        <button
          onClick={() => setFilter('broken')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            filter === 'broken' ? 'bg-amber text-bg' : 'bg-bg-2 border border-line text-text-dim'
          }`}
        >
          Broken ({stats.broken})
        </button>
        <button
          onClick={runHealthCheck}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-2 border border-line text-text-dim hover:text-text"
        >
          <RefreshCw className="w-3 h-3" />
          Health check
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="w-full pl-10 pr-4 py-2.5 bg-bg-2 border border-line rounded-xl text-sm focus:outline-none focus:border-sky"
        />
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-text-dim py-8">Loading...</p>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 bg-bg-2 border border-line rounded-2xl">
          <p className="text-text-dim mb-3">No courses yet</p>
          <Link
            href="/app/admin/courses/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber text-bg rounded-lg font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add your first course
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((c) => (
            <div
              key={c.id}
              className="bg-bg-2 border border-line rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm truncate">{c.title}</p>
                  {c.is_official && (
                    <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded">
                      Official
                    </span>
                  )}
                  {c.has_certificate && (
                    <span className="text-[10px] bg-emerald/20 text-emerald px-1.5 py-0.5 rounded">
                      Cert
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-dim">
                  <span>{c.category}</span>
                  <span>·</span>
                  <span className="uppercase">{c.language}</span>
                  <span>·</span>
                  <span>Quality: {c.quality_score}</span>
                  <span>·</span>
                  <span
                    className={
                      c.health_status === 'ok'
                        ? 'text-emerald'
                        : c.health_status === 'broken'
                          ? 'text-rose'
                          : 'text-amber'
                    }
                  >
                    {c.health_status}
                  </span>
                </div>
              </div>
              {c.youtube_url && (
                <a
                  href={c.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-text-dim hover:text-text"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button className="p-2 text-text-dim hover:text-text">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
