import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'

/**
 * Health check for all course YouTube embeds
 * Run on a cron (e.g. daily) or manually from admin panel
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, title, youtube_video_id, youtube_playlist_id')
      .eq('active', true)

    if (error) throw error

    let okCount = 0
    let brokenCount = 0
    const results: any[] = []

    for (const course of courses || []) {
      const videoId = course.youtube_video_id
      if (!videoId) continue

      try {
        // Check if YouTube oEmbed returns success (means video exists & is embeddable)
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        const response = await fetch(oembedUrl, { method: 'HEAD' })

        const status = response.ok ? 'ok' : 'broken'
        if (status === 'ok') okCount++
        else brokenCount++

        await supabase
          .from('courses')
          .update({
            health_status: status,
            last_reviewed_at: new Date().toISOString(),
          })
          .eq('id', course.id)

        results.push({ id: course.id, title: course.title, status })
      } catch (e) {
        brokenCount++
        results.push({ id: course.id, title: course.title, status: 'error', error: (e as Error).message })
      }
    }

    return NextResponse.json({
      success: true,
      checked: courses?.length || 0,
      ok: okCount,
      broken: brokenCount,
      results: results.slice(0, 20),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
