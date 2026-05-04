'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Copy, Check, Send, RefreshCw } from 'lucide-react'

type ContentType = 'social-post' | 'daily-quote' | 'daily-question' | 'blog-intro' | 'custom'
type Provider = 'gemini' | 'openrouter' | 'anthropic'

const TYPE_OPTIONS: { value: ContentType; label: string; emoji: string }[] = [
  { value: 'social-post', label: 'Social Post', emoji: '📱' },
  { value: 'daily-quote', label: 'Daily Quote', emoji: '✨' },
  { value: 'daily-question', label: 'Discussion Q', emoji: '💬' },
  { value: 'blog-intro', label: 'Blog Intro', emoji: '📝' },
  { value: 'custom', label: 'Custom', emoji: '🎨' },
]

const PLATFORMS = ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok'] as const
const TONES = ['casual', 'professional', 'witty', 'inspirational', 'educational'] as const

interface Variant {
  text: string
  provider: string
  model: string
  tokensUsed?: number
}

export default function AIGeneratorPage() {
  const [type, setType] = useState<ContentType>('social-post')
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>('twitter')
  const [tone, setTone] = useState<typeof TONES[number]>('professional')
  const [variants, setVariants] = useState(3)
  const [provider, setProvider] = useState<Provider | ''>('')
  const [customSystem, setCustomSystem] = useState('')

  const [results, setResults] = useState<Variant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([])

  useEffect(() => {
    fetch('/api/ai/generate')
      .then((r) => r.json())
      .then((d) => setAvailableProviders(d.providers || []))
      .catch(() => {})
  }, [])

  async function generate() {
    if (!topic.trim()) {
      setError('Topic required')
      return
    }
    setLoading(true)
    setError('')
    setResults([])
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          topic,
          platform: type === 'social-post' ? platform : undefined,
          tone,
          variants,
          provider: provider || undefined,
          customSystem: type === 'custom' ? customSystem : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Generation failed')
      } else {
        setResults(data.variants)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function copy(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  function postNow(text: string) {
    const url = `/app/publish/compose?content=${encodeURIComponent(text)}`
    window.location.href = url
  }

  const noProviders = availableProviders.length === 0

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="text-amber" />
          AI Content Generator
        </h1>
        <p className="text-text-dim">
          Generate posts, quotes, questions and blog intros with Gemini, OpenRouter or Claude
        </p>
      </div>

      {noProviders && (
        <div className="mb-6 p-4 bg-amber/10 border border-amber/30 rounded-lg text-sm">
          <strong>No AI provider configured.</strong> Add one of these env vars in Vercel:
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>
              <code className="text-amber">GEMINI_API_KEY</code> — free at{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline">
                aistudio.google.com/apikey
              </a>
            </li>
            <li>
              <code className="text-amber">OPENROUTER_API_KEY</code> — free models at{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="underline">
                openrouter.ai/keys
              </a>
            </li>
          </ul>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: input form */}
        <div className="bg-bg-2 border border-line rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Content Type</label>
            <div className="grid grid-cols-5 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${
                    type === opt.value
                      ? 'bg-amber text-bg border-amber'
                      : 'bg-bg border-line hover:border-amber'
                  }`}
                >
                  <div className="text-lg mb-1">{opt.emoji}</div>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Topic / Prompt</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., 'how AI is changing small business marketing'"
              rows={3}
              className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky resize-none"
            />
          </div>

          {type === 'custom' && (
            <div>
              <label className="block text-sm font-semibold mb-2">System Instructions (optional)</label>
              <textarea
                value={customSystem}
                onChange={(e) => setCustomSystem(e.target.value)}
                placeholder="You are a..."
                rows={2}
                className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky resize-none text-sm"
              />
            </div>
          )}

          {type === 'social-post' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Platform</label>
              <div className="flex gap-2 flex-wrap">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                      platform === p
                        ? 'bg-sky text-bg border-sky'
                        : 'bg-bg border-line hover:border-sky'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Tone</label>
            <div className="flex gap-2 flex-wrap">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                    tone === t
                      ? 'bg-sky text-bg border-sky'
                      : 'bg-bg border-line hover:border-sky'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2">Variants</label>
              <select
                value={variants}
                onChange={(e) => setVariants(Number(e.target.value))}
                className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-text focus:outline-none focus:border-sky"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-text focus:outline-none focus:border-sky"
                disabled={noProviders}
              >
                <option value="">Auto (best available)</option>
                {availableProviders.map((p) => (
                  <option key={p} value={p}>
                    {p === 'gemini' ? 'Google Gemini' : p === 'openrouter' ? 'OpenRouter (free models)' : 'Claude'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || noProviders || !topic.trim()}
            className="w-full py-3 bg-amber text-bg rounded-lg font-bold hover:bg-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating {variants} variant{variants > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Right: results */}
        <div className="space-y-4">
          {results.length === 0 && !loading && (
            <div className="bg-bg-2 border border-line border-dashed rounded-lg p-8 text-center text-text-dim">
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
              Generated variants will appear here
            </div>
          )}

          {results.map((v, i) => (
            <div key={i} className="bg-bg-2 border border-line rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber">
                  Variant {i + 1}
                </span>
                <span className="text-xs text-text-dim">
                  {v.provider} · {v.model.split('/').pop()?.split(':')[0]}
                  {v.tokensUsed && ` · ${v.tokensUsed} tok`}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed mb-3">{v.text}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(v.text, i)}
                  className="flex-1 py-2 bg-bg border border-line rounded-lg text-sm font-semibold hover:border-amber transition-colors flex items-center justify-center gap-1.5"
                >
                  {copiedIdx === i ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => postNow(v.text)}
                  className="flex-1 py-2 bg-sky text-bg rounded-lg text-sm font-bold hover:bg-sky/90 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Post
                </button>
              </div>
            </div>
          ))}

          {results.length > 0 && (
            <button
              onClick={generate}
              disabled={loading}
              className="w-full py-2 border border-line rounded-lg text-sm hover:border-amber transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
