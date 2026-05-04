'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, BookOpen, Award, Loader2 } from 'lucide-react'
import { getYouTubeEmbedUrl } from '@/lib/youtube'

interface Course {
  id: string
  title: string
  slug: string
  description?: string
  category: string
  youtube_url?: string
  thumbnail_url?: string
  is_official?: boolean
  has_certificate?: boolean
  quality_score?: number
  lesson_count?: number
  duration_minutes?: number
  health_status?: string
}

const DEMO_COURSE: Course = {
  id: 'demo',
  title: 'Demo Course',
  slug: 'demo',
  description: 'This is a demo course. Connect Supabase to see real data.',
  category: 'digital-marketing-basics',
  youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  is_official: true,
  has_certificate: true,
  quality_score: 95,
  lesson_count: 12,
  duration_minutes: 240,
  health_status: 'ok',
}

export default function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [notes, setNotes] = useState<string[]>([])
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    loadCourse()
  }, [slug])

  async function loadCourse() {
    try {
      setLoading(true)
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { getCourseBySlug } = await import('@/lib/supabase')
        const data = await getCourseBySlug(slug)
        if (data) {
          setCourse(data as any)
          return
        }
      }
      setCourse({ ...DEMO_COURSE, slug, title: slugToTitle(slug) })
    } catch (e) {
      setCourse({ ...DEMO_COURSE, slug, title: slugToTitle(slug) })
    } finally {
      setLoading(false)
    }
  }

  function slugToTitle(s: string): string {
    return s
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  function addNote() {
    if (!newNote.trim()) return
    setNotes([...notes, newNote])
    setNewNote('')
  }

  function markComplete() {
    setProgress(100)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-text-dim mb-4">Course not found</p>
        <Link href="/app/learn" className="text-amber hover:text-amber/90">
          Back to courses
        </Link>
      </div>
    )
  }

  const youtubeEmbed = course.youtube_url ? getYouTubeEmbedUrl(course.youtube_url) : null

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/app/learn"
        className="inline-flex items-center gap-2 text-amber hover:text-amber/90 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to courses
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="font-serif text-4xl font-bold mb-2">{course.title}</h1>
            {course.description && <p className="text-text-dim">{course.description}</p>}
          </div>
          <div className="flex flex-col gap-2 items-end">
            {course.is_official && (
              <span className="bg-gold/20 text-gold px-3 py-1 rounded text-sm font-semibold">
                Official Course
              </span>
            )}
            {course.has_certificate ? (
              <span className="bg-emerald/20 text-emerald px-3 py-1 rounded text-sm font-semibold">
                ✓ Certificate
              </span>
            ) : (
              <span className="bg-sky/20 text-sky px-3 py-1 rounded text-sm font-semibold">
                ✓ Completion Badge
              </span>
            )}
          </div>
        </div>

        {progress > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-dim">Your progress</span>
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-bg-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* YouTube Embed */}
      {youtubeEmbed?.embedUrl ? (
        <div className="mb-8">
          <div className="aspect-video bg-bg-3 rounded-lg overflow-hidden border border-line">
            <iframe
              width="100%"
              height="100%"
              src={youtubeEmbed.embedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={course.title}
            />
          </div>
          {course.health_status === 'broken' && (
            <div className="mt-2 bg-rose/10 border border-rose/30 rounded-lg p-3 text-rose text-sm">
              ⚠️ Admin warning: This video may be unavailable
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 aspect-video bg-bg-3 rounded-lg flex items-center justify-center border border-line">
          <p className="text-text-dim">No video available</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-2 border border-line rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold mb-4">Course Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-dim text-sm mb-1">Quality Score</p>
                <p className="text-lg font-semibold text-amber">
                  {course.quality_score || 0}/100
                </p>
              </div>
              {course.lesson_count && (
                <div>
                  <p className="text-text-dim text-sm mb-1">Lessons</p>
                  <p className="text-lg font-semibold">{course.lesson_count}</p>
                </div>
              )}
              {course.duration_minutes && (
                <div>
                  <p className="text-text-dim text-sm mb-1">Duration</p>
                  <p className="text-lg font-semibold">
                    {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                  </p>
                </div>
              )}
              <div>
                <p className="text-text-dim text-sm mb-1">Status</p>
                <p className="text-lg font-semibold capitalize">{course.health_status || 'unknown'}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-bg-2 border border-line rounded-lg p-6">
            <h2 className="font-serif text-xl font-bold mb-4">Your Notes</h2>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Take notes about this course..."
                className="w-full p-3 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky resize-none"
                rows={3}
              />
              <button
                onClick={addNote}
                className="mt-2 px-4 py-2 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 transition-colors text-sm"
              >
                Add Note
              </button>
            </div>
            {notes.length > 0 && (
              <div className="space-y-2">
                {notes.map((note, i) => (
                  <div key={i} className="p-3 bg-bg rounded border border-line text-sm">
                    {note}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-bg-2 border border-line rounded-lg p-6 sticky top-24">
            <h3 className="font-serif font-bold mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={markComplete}
                className="w-full px-4 py-2 bg-emerald text-bg rounded-lg font-semibold hover:bg-emerald/90 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Complete
              </button>
              <button className="w-full px-4 py-2 border border-line text-text rounded-lg font-semibold hover:bg-bg-3 transition-colors flex items-center justify-center gap-2 text-sm">
                <BookOpen className="w-4 h-4" />
                Download Notes
              </button>
            </div>
          </div>

          {(course.has_certificate || progress >= 100) && (
            <div className="bg-gradient-to-br from-gold/10 to-amber/10 border border-gold/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-gold mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Earn Recognition</p>
                  <p className="text-sm text-text-dim">
                    {course.is_official && course.has_certificate
                      ? 'Complete to receive an official certificate'
                      : 'Complete to earn the WatShop Completion Badge'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
