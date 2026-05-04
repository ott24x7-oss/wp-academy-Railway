import { NextResponse, type NextRequest } from 'next/server'
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/youtube'
import { getSupabaseServerClient } from '@/lib/supabase'

interface BulkCourseInput {
  title: string
  url: string
  category?: string
  description?: string
  language?: 'en' | 'hi' | 'both'
  is_official?: boolean
  has_certificate?: boolean
  quality_score?: number
}

interface BulkRequest {
  courses: BulkCourseInput[]
  defaultCategory?: string
  defaultLanguage?: 'en' | 'hi' | 'both'
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
}

async function fetchYouTubeMetadata(videoId: string): Promise<{ title?: string; description?: string }> {
  // Use YouTube oEmbed (no API key needed) for basic info
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const res = await fetch(oembedUrl)
    if (res.ok) {
      const data = await res.json()
      return { title: data.title, description: data.author_name }
    }
  } catch {}
  return {}
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkRequest = await request.json()

    if (!body.courses || !Array.isArray(body.courses) || body.courses.length === 0) {
      return NextResponse.json({ error: 'courses array required' }, { status: 400 })
    }

    if (body.courses.length > 200) {
      return NextResponse.json({ error: 'Max 200 courses per request' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const results: Array<{ title: string; success: boolean; error?: string; id?: string }> = []

    for (const input of body.courses) {
      try {
        if (!input.url) {
          results.push({ title: input.title || '(no title)', success: false, error: 'URL required' })
          continue
        }

        const youtubeData = getYouTubeEmbedUrl(input.url)
        if (youtubeData.type === 'unknown') {
          results.push({
            title: input.title || '(no title)',
            success: false,
            error: 'Invalid YouTube URL',
          })
          continue
        }

        // Auto-fetch title if not provided
        let title = input.title?.trim()
        if (!title && youtubeData.videoId) {
          const meta = await fetchYouTubeMetadata(youtubeData.videoId)
          title = meta.title || ''
        }
        if (!title) {
          results.push({ title: '(no title)', success: false, error: 'Title required and could not auto-fetch' })
          continue
        }

        const slug = slugify(title) + '-' + Date.now().toString(36)
        const thumbnail = youtubeData.videoId ? getYouTubeThumbnail(youtubeData.videoId, 'high') : undefined

        const { data, error } = await supabase
          .from('courses')
          .insert([
            {
              title,
              slug,
              description: input.description || '',
              category: input.category || body.defaultCategory || 'digital-marketing-basics',
              language: input.language || body.defaultLanguage || 'en',
              youtube_url: input.url,
              youtube_video_id: youtubeData.videoId,
              youtube_playlist_id: youtubeData.playlistId,
              thumbnail_url: thumbnail,
              quality_score: input.quality_score ?? 75,
              is_official: input.is_official ?? false,
              has_certificate: input.has_certificate ?? false,
              health_status: 'unknown',
              active: true,
            },
          ])
          .select()
          .single()

        if (error) {
          results.push({ title, success: false, error: error.message })
        } else {
          results.push({ title, success: true, id: data.id })
        }
      } catch (e) {
        results.push({
          title: input.title || '(no title)',
          success: false,
          error: (e as Error).message,
        })
      }
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      total: body.courses.length,
      successful,
      failed,
      results,
    })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
