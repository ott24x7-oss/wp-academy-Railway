'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Plus, Trash2, Star } from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

interface Plan {
  id: string
  slug: string
  name: string
  price_inr: number
  price_usd: number
  duration_days: number
  ai_credits: number
  features: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase.from('pricing_plans').select('*').order('sort_order')
      setPlans((data as Plan[]) || [])
    } finally {
      setLoading(false)
    }
  }

  function update(id: string, field: keyof Plan, value: any) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  async function save(plan: Plan) {
    if (!isSupabaseConfigured()) return
    setSavingId(plan.id)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('pricing_plans')
        .update({
          name: plan.name,
          price_inr: plan.price_inr,
          price_usd: plan.price_usd,
          duration_days: plan.duration_days,
          ai_credits: plan.ai_credits,
          features: plan.features,
          is_active: plan.is_active,
          is_featured: plan.is_featured,
        })
        .eq('id', plan.id)
      if (error) alert(error.message)
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Pricing Plans</h1>
        <p className="text-text-dim text-sm">
          Edit prices, features, and feature flags for each plan
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-bg-2 border border-line rounded-2xl p-8 text-center">
          <p className="text-text-dim mb-3">No plans yet (run migration 0002)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-bg-2 border rounded-2xl p-5 space-y-3 ${
                plan.is_featured ? 'border-amber/40' : 'border-line'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-dim">{plan.slug}</span>
                  {plan.is_featured && <Star className="w-3.5 h-3.5 text-amber" />}
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={plan.is_active}
                    onChange={(e) => update(plan.id, 'is_active', e.target.checked)}
                  />
                  Active
                </label>
              </div>

              <input
                type="text"
                value={plan.name}
                onChange={(e) => update(plan.id, 'name', e.target.value)}
                className="w-full text-lg font-semibold bg-bg border border-line rounded-lg px-3 py-2"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-text-dim mb-1">Price ₹</label>
                  <input
                    type="number"
                    value={plan.price_inr}
                    onChange={(e) => update(plan.id, 'price_inr', parseFloat(e.target.value) || 0)}
                    className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1">Price $</label>
                  <input
                    type="number"
                    value={plan.price_usd}
                    onChange={(e) => update(plan.id, 'price_usd', parseFloat(e.target.value) || 0)}
                    className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={plan.duration_days}
                    onChange={(e) => update(plan.id, 'duration_days', parseInt(e.target.value) || 30)}
                    className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1">AI credits</label>
                  <input
                    type="number"
                    value={plan.ai_credits}
                    onChange={(e) => update(plan.id, 'ai_credits', parseInt(e.target.value) || 0)}
                    className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-dim mb-1">Features (one per line)</label>
                <textarea
                  value={plan.features.join('\n')}
                  onChange={(e) =>
                    update(
                      plan.id,
                      'features',
                      e.target.value.split('\n').filter((s) => s.trim())
                    )
                  }
                  rows={5}
                  className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={plan.is_featured}
                    onChange={(e) => update(plan.id, 'is_featured', e.target.checked)}
                  />
                  Featured
                </label>
                <button
                  onClick={() => save(plan)}
                  disabled={savingId === plan.id}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber text-bg rounded-lg text-xs font-semibold hover:bg-amber/90 disabled:opacity-50"
                >
                  {savingId === plan.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
