'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Target, DollarSign, Calendar } from 'lucide-react'

const PLATFORMS = ['meta', 'google', 'linkedin', 'tiktok'] as const
const OBJECTIVES = ['awareness', 'traffic', 'engagement', 'leads', 'sales', 'app_installs']

export default function NewCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>('meta')
  const [objective, setObjective] = useState('traffic')
  const [budget, setBudget] = useState(100)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Campaign name required')
      return
    }
    if (budget < 1) {
      setError('Budget must be at least $1')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/ads/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'demo-workspace',
          userId: 'demo-user',
          adAccountId: 'demo-account',
          name,
          platform,
          objective,
          budgetUsd: budget,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      })
      const data = await response.json()
      if (data.success) {
        router.push('/app/ads')
      } else {
        setError(data.error || 'Failed to create')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/app/ads"
        className="inline-flex items-center gap-2 text-amber hover:text-amber/90 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to ads
      </Link>

      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">New Campaign</h1>
        <p className="text-text-dim text-sm">Create a campaign across any connected platform</p>
      </div>

      {error && (
        <div className="bg-rose/10 border border-rose/30 rounded-xl p-3 text-rose text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-bg-2 border border-line rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer Sale 2026"
              required
              className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky capitalize"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Objective
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky capitalize"
              >
                {OBJECTIVES.map((o) => (
                  <option key={o} value={o}>
                    {o.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Daily budget (USD)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg focus:outline-none focus:border-sky"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber text-bg rounded-xl font-semibold hover:bg-amber/90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Campaign
        </button>
      </form>
    </div>
  )
}
