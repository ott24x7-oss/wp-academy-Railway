'use client'

import { useState, useEffect } from 'react'
import { Bot, Plus, Play, Pause, Trash2, Loader2, Clock, Sparkles, X, Check } from 'lucide-react'

interface DailyJob {
  id: string
  name: string
  type: 'daily-quote' | 'daily-question' | 'social-post' | 'custom'
  topic: string
  tone: string
  platforms: string[]
  schedule_time: string
  timezone: string
  days_of_week: number[]
  mode: 'auto' | 'draft'
  provider: string
  active: boolean
  last_run_at: string | null
  total_runs: number
  created_at: string
}

const PLATFORMS = ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'whatsapp'] as const
const TYPES = [
  { value: 'daily-quote', label: 'Daily Quote', emoji: '✨' },
  { value: 'daily-question', label: 'Discussion Q', emoji: '💬' },
  { value: 'social-post', label: 'Social Post', emoji: '📱' },
  { value: 'custom', label: 'Custom', emoji: '🎨' },
] as const
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DailyBotPage() {
  const [jobs, setJobs] = useState<DailyJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<{ id: string; text: string; success: boolean; error?: string } | null>(null)

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/daily')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch {}
    setLoading(false)
  }

  async function toggleActive(job: DailyJob) {
    await fetch(`/api/ai/daily?id=${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !job.active }),
    })
    loadJobs()
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this bot?')) return
    await fetch(`/api/ai/daily?id=${id}`, { method: 'DELETE' })
    loadJobs()
  }

  async function runNow(id: string) {
    setRunningId(id)
    setRunResult(null)
    try {
      const res = await fetch(`/api/ai/daily/run?id=${id}`, { method: 'POST' })
      const data = await res.json()
      setRunResult({
        id,
        text: data.text || '',
        success: data.success,
        error: data.error,
      })
      loadJobs()
    } catch (e) {
      setRunResult({ id, text: '', success: false, error: (e as Error).message })
    }
    setRunningId(null)
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-2 flex items-center gap-2">
            <Bot className="text-amber" />
            Daily Bot
          </h1>
          <p className="text-text-dim">
            Auto-generate quotes, questions and posts on a schedule
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-amber text-bg rounded-lg font-bold hover:bg-amber/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Bot
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-bg-2 border border-line border-dashed rounded-lg p-12 text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h3 className="font-serif text-xl font-bold mb-2">No bots yet</h3>
          <p className="text-text-dim mb-4">
            Create a bot to auto-generate content daily
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-amber text-bg rounded-lg font-bold hover:bg-amber/90"
          >
            Create your first bot
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-bg-2 border border-line rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{TYPES.find((t) => t.value === job.type)?.emoji}</span>
                    <h3 className="font-bold truncate">{job.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        job.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-text-dim/20 text-text-dim'
                      }`}
                    >
                      {job.active ? 'Active' : 'Paused'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        job.mode === 'auto' ? 'bg-amber/20 text-amber' : 'bg-sky/20 text-sky'
                      }`}
                    >
                      {job.mode === 'auto' ? 'Auto-post' : 'Draft only'}
                    </span>
                  </div>
                  <div className="text-sm text-text-dim mb-2">{job.topic}</div>
                  <div className="flex items-center gap-3 text-xs text-text-dim flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {job.schedule_time.slice(0, 5)} {job.timezone}
                    </span>
                    <span>
                      {job.days_of_week.length === 7
                        ? 'Daily'
                        : job.days_of_week.map((d) => DAY_NAMES[d]).join(', ')}
                    </span>
                    <span>→ {job.platforms.join(', ')}</span>
                    {job.last_run_at && (
                      <span>Last run: {new Date(job.last_run_at).toLocaleString()}</span>
                    )}
                    <span>{job.total_runs} runs</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => runNow(job.id)}
                    disabled={runningId === job.id}
                    className="p-2 hover:bg-bg rounded-lg text-amber disabled:opacity-50"
                    title="Run now"
                  >
                    {runningId === job.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleActive(job)}
                    className="p-2 hover:bg-bg rounded-lg"
                    title={job.active ? 'Pause' : 'Resume'}
                  >
                    {job.active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 hover:bg-bg rounded-lg text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {runResult?.id === job.id && (
                <div
                  className={`mt-3 p-3 rounded-lg border text-sm ${
                    runResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {runResult.success ? (
                    <>
                      <div className="font-semibold mb-1 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Generated
                      </div>
                      <div className="whitespace-pre-wrap">{runResult.text}</div>
                    </>
                  ) : (
                    <>Error: {runResult.error}</>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && <NewBotModal onClose={() => setShowForm(false)} onCreated={loadJobs} />}
    </div>
  )
}

function NewBotModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'daily-quote' | 'daily-question' | 'social-post' | 'custom'>('daily-quote')
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('professional')
  const [platforms, setPlatforms] = useState<string[]>(['twitter'])
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [mode, setMode] = useState<'auto' | 'draft'>('draft')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function togglePlatform(p: string) {
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))
  }

  function toggleDay(d: number) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()))
  }

  async function save() {
    if (!name || !topic || !platforms.length) {
      setError('Name, topic, and at least one platform required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/ai/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          topic,
          tone,
          platforms,
          schedule_time: scheduleTime + ':00',
          days_of_week: days,
          mode,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create')
      } else {
        onCreated()
        onClose()
      }
    } catch (e) {
      setError((e as Error).message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-bg-2 border border-line rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl font-bold">New Bot</h2>
          <button onClick={onClose} className="p-1 hover:bg-bg rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Bot name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Morning marketing tip"
              className="w-full px-3 py-2 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Content type</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`p-2 rounded-lg border text-xs font-semibold ${
                    type === t.value
                      ? 'bg-amber text-bg border-amber'
                      : 'bg-bg border-line hover:border-amber'
                  }`}
                >
                  <div className="text-lg mb-1">{t.emoji}</div>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Topic / theme</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. growth marketing tips for SaaS founders"
              rows={2}
              className="w-full px-3 py-2 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky"
              >
                {['casual', 'professional', 'witty', 'inspirational', 'educational'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Time (24h)</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Days</label>
            <div className="flex gap-2">
              {DAY_NAMES.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${
                    days.includes(i)
                      ? 'bg-sky text-bg border-sky'
                      : 'bg-bg border-line hover:border-sky'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Post to</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize ${
                    platforms.includes(p)
                      ? 'bg-sky text-bg border-sky'
                      : 'bg-bg border-line hover:border-sky'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('draft')}
                className={`p-3 rounded-lg border text-sm font-semibold text-left ${
                  mode === 'draft'
                    ? 'bg-sky/10 border-sky'
                    : 'bg-bg border-line'
                }`}
              >
                <div className="font-bold mb-0.5">📝 Draft only</div>
                <div className="text-xs text-text-dim">Save as draft, you review & post manually</div>
              </button>
              <button
                onClick={() => setMode('auto')}
                className={`p-3 rounded-lg border text-sm font-semibold text-left ${
                  mode === 'auto'
                    ? 'bg-amber/10 border-amber'
                    : 'bg-bg border-line'
                }`}
              >
                <div className="font-bold mb-0.5">🚀 Auto-post</div>
                <div className="text-xs text-text-dim">Posts immediately to all platforms</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-line rounded-lg font-semibold hover:bg-bg"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2.5 bg-amber text-bg rounded-lg font-bold hover:bg-amber/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Bot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
