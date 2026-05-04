import { describe, it, expect } from 'vitest'
import {
  getYouTubeEmbedUrl,
  getVideoId,
  getPlaylistId,
  isValidYouTubeUrl,
  getYouTubeThumbnail,
} from './youtube'

describe('YouTube Utility', () => {
  describe('getYouTubeEmbedUrl', () => {
    it('should parse youtube.com/watch?v= format', () => {
      const result = getYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(result.type).toBe('video')
      expect(result.videoId).toBe('dQw4w9WgXcQ')
      expect(result.embedUrl).toContain('embed/dQw4w9WgXcQ')
    })

    it('should parse youtu.be/ format', () => {
      const result = getYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')
      expect(result.type).toBe('video')
      expect(result.videoId).toBe('dQw4w9WgXcQ')
    })

    it('should parse youtube.com/playlist format', () => {
      const result = getYouTubeEmbedUrl('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
      expect(result.type).toBe('playlist')
      expect(result.playlistId).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
      expect(result.embedUrl).toContain('videoseries')
    })

    it('should handle watch with playlist parameter', () => {
      const result = getYouTubeEmbedUrl(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
      )
      expect(result.type).toBe('playlist')
      expect(result.videoId).toBe('dQw4w9WgXcQ')
      expect(result.playlistId).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
    })

    it('should parse youtube.com/embed format', () => {
      const result = getYouTubeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')
      expect(result.type).toBe('video')
      expect(result.videoId).toBe('dQw4w9WgXcQ')
    })

    it('should parse youtube.com/embed/videoseries format', () => {
      const result = getYouTubeEmbedUrl(
        'https://www.youtube.com/embed/videoseries?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
      )
      expect(result.type).toBe('playlist')
      expect(result.playlistId).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
    })

    it('should handle URLs without protocol', () => {
      const result = getYouTubeEmbedUrl('youtube.com/watch?v=dQw4w9WgXcQ')
      expect(result.type).toBe('video')
      expect(result.videoId).toBe('dQw4w9WgXcQ')
    })

    it('should return unknown for invalid URLs', () => {
      const result = getYouTubeEmbedUrl('https://example.com/video')
      expect(result.type).toBe('unknown')
      expect(result.videoId).toBeUndefined()
      expect(result.embedUrl).toBe('')
    })

    it('should handle empty input', () => {
      const result = getYouTubeEmbedUrl('')
      expect(result.type).toBe('unknown')
      expect(result.embedUrl).toBe('')
    })

    it('should add rel=0 and modestbranding=1 parameters', () => {
      const result = getYouTubeEmbedUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')
      expect(result.embedUrl).toContain('rel=0')
      expect(result.embedUrl).toContain('modestbranding=1')
    })
  })

  describe('getVideoId', () => {
    it('should extract video ID', () => {
      const videoId = getVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')
      expect(videoId).toBe('dQw4w9WgXcQ')
    })

    it('should return null for playlist-only URLs', () => {
      const videoId = getVideoId('https://youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
      expect(videoId).toBeNull()
    })

    it('should return null for invalid URLs', () => {
      const videoId = getVideoId('https://example.com')
      expect(videoId).toBeNull()
    })
  })

  describe('getPlaylistId', () => {
    it('should extract playlist ID from playlist URL', () => {
      const playlistId = getPlaylistId('https://youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
      expect(playlistId).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
    })

    it('should extract playlist ID from watch with list parameter', () => {
      const playlistId = getPlaylistId(
        'https://youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
      )
      expect(playlistId).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
    })

    it('should return null for video-only URLs', () => {
      const playlistId = getPlaylistId('https://youtube.com/watch?v=dQw4w9WgXcQ')
      expect(playlistId).toBeNull()
    })
  })

  describe('isValidYouTubeUrl', () => {
    it('should return true for valid YouTube URLs', () => {
      expect(isValidYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
      expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
      expect(isValidYouTubeUrl('https://youtube.com/playlist?list=PLtest')).toBe(true)
    })

    it('should return false for invalid URLs', () => {
      expect(isValidYouTubeUrl('https://example.com')).toBe(false)
      expect(isValidYouTubeUrl('')).toBe(false)
      expect(isValidYouTubeUrl('not a url')).toBe(false)
    })
  })

  describe('getYouTubeThumbnail', () => {
    it('should generate thumbnail URL with default quality', () => {
      const url = getYouTubeThumbnail('dQw4w9WgXcQ')
      expect(url).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    })

    it('should generate thumbnail with specified quality', () => {
      expect(getYouTubeThumbnail('dQw4w9WgXcQ', 'maxres')).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
      )
      expect(getYouTubeThumbnail('dQw4w9WgXcQ', 'default')).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg'
      )
    })
  })
})
