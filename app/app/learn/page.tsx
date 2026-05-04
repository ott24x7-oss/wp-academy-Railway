'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { COURSE_CATEGORIES, getCategoryLabel } from '@/lib/supabase'

interface Course {
  id: string
  title: string
  slug: string
  description?: string
  category: string
  thumbnail_url?: string
  is_official?: boolean
  has_certificate?: boolean
  quality_score?: number
  lesson_count?: number
}

// Demo courses (used when database not configured)
const DEMO_COURSES: Course[] = [
  {
    id: 'demo-1',
    title: 'Google Ads Skillshop',
    slug: 'google-ads-skillshop',
    description: 'Official Google Ads training and certification',
    category: 'google-ads',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    is_official: true,
    has_certificate: true,
    quality_score: 100,
    lesson_count: 12,
  },
  {
    id: 'demo-2',
    title: 'Meta Blueprint',
    slug: 'meta-blueprint',
    description: 'Official Meta advertising platform course',
    category: 'meta-ads',
    is_official: true,
    has_certificate: true,
    quality_score: 98,
    lesson_count: 18,
  },
  {
    id: 'demo-3',
    title: 'YouTube Creator Academy',
    slug: 'youtube-creator-academy',
    description: 'Grow your YouTube channel with official guidance',
    category: 'youtube-marketing',
    is_official: true,
    quality_score: 90,
    lesson_count: 24,
  },
  {
    id: 'demo-4',
    title: 'HubSpot Digital Marketing',
    slug: 'hubspot-digital-marketing',
    description: 'Comprehensive digital marketing certification',
    category: 'digital-marketing-basics',
    is_official: true,
    has_certificate: true,
    quality_score: 95,
    lesson_count: 14,
  },
  {
    id: 'demo-5',
    title: 'Canva Design Mastery',
    slug: 'canva-design-mastery',
    description: 'Master Canva for stunning marketing visuals',
    category: 'design-canva',
    quality_score: 85,
    lesson_count: 10,
  },
  {
    id: 'demo-6',
    title: 'AI Marketing with ChatGPT',
    slug: 'ai-marketing-chatgpt',
    description: 'Use AI tools to accelerate your marketing',
    category: 'ai-marketing',
    quality_score: 88,
    lesson_count: 8,
  },
]

export default function LearnPage() {
  const [courses, setCourses] = useState<Course[]>(DEMO_COURSES)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [selectedCategory])

  async function loadCourses() {
    setLoading(true)
    try {
      // Try to fetch from Supabase if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { getCourses } = await import('@/lib/supabase')
        const data = await getCourses({
          category: selectedCategory || undefined,
          limit: 50,
        })
        if (data.length > 0) {
          setCourses(data as any)
        } else {
          setCourses(filterDemo(selectedCategory))
        }
      } else {
        setCourses(filterDemo(selectedCategory))
      }
    } catch (err) {
      console.warn('Falling back to demo courses:', err)
      setCourses(filterDemo(selectedCategory))
    } finally {
      setLoading(false)
    }
  }

  function filterDemo(category: string): Course[] {
    if (!category) return DEMO_COURSES
    return DEMO_COURSES.filter((c) => c.category === category)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-2">Learn</h1>
      <p className="text-text-dim mb-8">Explore curated marketing courses in Hindi & English</p>

      {/* Category filter */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex gap-2 whitespace-nowrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-amber text-bg'
                : 'border border-line text-text hover:bg-bg-3'
            }`}
          >
            All Courses
          </button>
          {COURSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber text-bg'
                  : 'border border-line text-text hover:bg-bg-3'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Courses grid */}
      {loading ? (
        <div className="text-center py-12 text-text-dim">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-text-dim">
          No courses in this category yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/app/learn/${course.slug}`}
              className="bg-bg-2 border border-line rounded-lg overflow-hidden hover:border-amber hover:bg-bg-3 transition-colors"
            >
              <div className="w-full h-40 bg-gradient-to-br from-amber/20 to-sky/20 relative overflow-hidden">
                {course.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    📚
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold line-clamp-2 flex-1">{course.title}</h3>
                  {course.is_official && (
                    <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded whitespace-nowrap">
                      Official
                    </span>
                  )}
                </div>
                {course.description && (
                  <p className="text-sm text-text-dim mb-4 line-clamp-2">{course.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      (course.quality_score || 0) >= 90
                        ? 'bg-emerald/20 text-emerald'
                        : 'bg-amber/20 text-amber'
                    }`}
                  >
                    {(course.quality_score || 0) >= 90 ? 'Advanced' : 'Beginner'}
                  </span>
                  <span className="text-xs text-text-dim">
                    {course.lesson_count ? `${course.lesson_count} lessons` : 'Course'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
