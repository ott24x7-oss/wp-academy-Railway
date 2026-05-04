'use client'

import { useState } from 'react'
import { Sparkles, Calendar, Send, Loader2, CheckCircle2 } from 'lucide-react'

const PLATFORMS = [
  { id: 'twitter', name: 'Twitter', emoji: '𝕏' },
  { id: 'instagram', name: 'Instagram', emoji: '📷' },
  { id: 'facebook', name: 'Facebook', emoji: '📘' },
  { id: 'linkedin', name: 'LinkedIn', emoji: '💼' },
  { id: 'tiktok', name: 'TikTok', emoji: '🎵' },
]

export default function ComposePage() {
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  async function generateWithAI() {
    setAiLoading(true)
    setError(null)
    try {
      const topic = prompt('What topic should the AI write about?') || 'digital marketing'
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Write a short, engaging social media post (max 280 characters) about: ${topic}. Include 2-3 relevant hashtags. Just write the post, no preamble.`,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setContent(data.message.trim())
      } else {
        setError(data.error || 'AI generation failed')
      }
    } catch (err) {
      setError('AI request failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function handlePost() {
    setError(null)
    setSuccess(null)

    if (!content.trim() || selectedPlatforms.length === 0) {
      setError('Add content and select at least one platform')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          platforms: selectedPlatforms,
          scheduleAt: scheduledAt || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(
          result.draftMode
            ? '✅ Saved as draft (Ayrshare not configured)'
            : scheduledAt
              ? `✅ Scheduled for ${new Date(scheduledAt).toLocaleString()}`
              : '✅ Posted successfully!'
        )
        setContent('')
        setSelectedPlatforms([])
        setScheduledAt('')
      } else {
        setError(result.error || 'Post failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const charCount = content.length
  const charLimit = 280

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-2">Compose Post</h1>
      <p className="text-text-dim mb-8">Create and schedule posts across multiple platforms</p>

      {success && (
        <div className="bg-emerald/10 border border-emerald/30 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald" />
          <p className="text-emerald text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose/10 border border-rose/30 rounded-lg p-4 mb-6 text-rose text-sm">
          {error}
        </div>
      )}

      {/* Content editor */}
      <div className="bg-bg-2 border border-line rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium mb-3">Post Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? Share your ideas with your audience..."
          className="w-full p-4 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky resize-vertical min-h-32"
        />
        <div className="flex items-center justify-between mt-3">
          <span className={`text-sm ${charCount > charLimit ? 'text-rose' : 'text-text-dim'}`}>
            {charCount} / {charLimit}
          </span>
          <button
            type="button"
            onClick={generateWithAI}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-amber hover:bg-amber/10 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            AI Generate
          </button>
        </div>
      </div>

      {/* Platform selection */}
      <div className="bg-bg-2 border border-line rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium mb-4">Select Platforms</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`p-3 rounded-lg border-2 transition-all text-center font-medium text-sm ${
                selectedPlatforms.includes(platform.id)
                  ? 'border-amber bg-amber/10'
                  : 'border-line bg-bg hover:border-line-2'
              }`}
            >
              <div className="text-xl mb-1">{platform.emoji}</div>
              {platform.name}
            </button>
          ))}
        </div>
      </div>

      {/* Scheduling */}
      <div className="bg-bg-2 border border-line rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule (Optional)
        </label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full p-3 bg-bg border border-line rounded-lg text-text focus:outline-none focus:border-sky"
        />
        {scheduledAt && (
          <p className="mt-3 text-sm text-amber">
            📅 Will be posted on {new Date(scheduledAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Preview */}
      {content && (
        <div className="bg-bg-2 border border-line rounded-lg p-6 mb-6">
          <p className="text-sm font-medium mb-3 text-text-dim">Preview</p>
          <div className="p-4 bg-bg rounded-lg border border-line">
            <p className="text-text break-words whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={handlePost}
        disabled={loading || !content.trim() || selectedPlatforms.length === 0}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
        {loading ? 'Posting...' : scheduledAt ? 'Schedule Post' : 'Post Now'}
      </button>
    </div>
  )
}
