/**
 * YouTube URL parser and embed generator
 * Handles various YouTube URL formats and generates responsive embed URLs
 */

export interface YouTubeEmbedResult {
  embedUrl: string
  videoId?: string
  playlistId?: string
  type: 'video' | 'playlist' | 'unknown'
}

export function getYouTubeEmbedUrl(input: string): YouTubeEmbedResult {
  if (!input) {
    return {
      embedUrl: '',
      type: 'unknown',
    }
  }

  const trimmedInput = input.trim()

  // Check for youtube.com/watch?v=VIDEO_ID format
  const watchMatch = trimmedInput.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/
  )
  if (watchMatch) {
    const videoId = watchMatch[1]
    // Check if there's also a playlist
    const playlistMatch = trimmedInput.match(/[&?]list=([a-zA-Z0-9_-]+)/)
    if (playlistMatch) {
      return {
        embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}&rel=0&modestbranding=1`,
        videoId,
        playlistId: playlistMatch[1],
        type: 'playlist',
      }
    }
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
      videoId,
      type: 'video',
    }
  }

  // Check for youtu.be/VIDEO_ID format
  const shortMatch = trimmedInput.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) {
    const videoId = shortMatch[1]
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
      videoId,
      type: 'video',
    }
  }

  // Check for youtube.com/playlist?list=PLAYLIST_ID format
  const playlistMatch = trimmedInput.match(/youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/)
  if (playlistMatch) {
    const playlistId = playlistMatch[1]
    return {
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0&modestbranding=1`,
      playlistId,
      type: 'playlist',
    }
  }

  // Check for youtube.com/embed/VIDEO_ID format
  const embedMatch = trimmedInput.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) {
    const videoId = embedMatch[1]
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
      videoId,
      type: 'video',
    }
  }

  // Check for youtube.com/embed/videoseries?list=PLAYLIST_ID format
  const embedPlaylistMatch = trimmedInput.match(/youtube\.com\/embed\/videoseries\?list=([a-zA-Z0-9_-]+)/)
  if (embedPlaylistMatch) {
    const playlistId = embedPlaylistMatch[1]
    return {
      embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0&modestbranding=1`,
      playlistId,
      type: 'playlist',
    }
  }

  // If no match found
  return {
    embedUrl: '',
    type: 'unknown',
  }
}

/**
 * Extract video ID from a YouTube URL
 */
export function getVideoId(url: string): string | null {
  const result = getYouTubeEmbedUrl(url)
  return result.videoId || null
}

/**
 * Extract playlist ID from a YouTube URL
 */
export function getPlaylistId(url: string): string | null {
  const result = getYouTubeEmbedUrl(url)
  return result.playlistId || null
}

/**
 * Check if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  const result = getYouTubeEmbedUrl(url)
  return result.type !== 'unknown'
}

/**
 * Get YouTube thumbnail URL for a video
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    standard: 'sddefault.jpg',
    maxres: 'maxresdefault.jpg',
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`
}
