import Link from 'next/link'
import { Plus, Link2, TrendingUp, IndianRupee, Target, Eye } from 'lucide-react'

export default function AdsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Ads Manager</h1>
          <p className="text-text-dim text-sm">
            Manage campaigns across Meta, Google, LinkedIn & TikTok
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/ads/accounts"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-line rounded-xl font-medium text-sm hover:bg-bg-3"
          >
            <Link2 className="w-4 h-4" />
            <span className="hidden md:inline">Connect</span> Accounts
          </Link>
          <Link
            href="/app/ads/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm hover:bg-amber/90"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Spend', value: '$0', icon: IndianRupee, color: 'text-amber' },
          { label: 'Conversions', value: '0', icon: Target, color: 'text-emerald' },
          { label: 'ROAS', value: '0.0x', icon: TrendingUp, color: 'text-violet' },
          { label: 'Impressions', value: '0', icon: Eye, color: 'text-sky' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-bg-2 border border-line rounded-2xl p-4">
            <kpi.icon className={`w-5 h-5 mb-2 ${kpi.color}`} />
            <p className="text-xs text-text-dim mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-bg-2 border border-line rounded-2xl p-8 text-center">
        <Target className="w-12 h-12 text-text-dim mx-auto mb-3" />
        <h3 className="font-serif text-lg font-bold mb-1">No campaigns yet</h3>
        <p className="text-text-dim text-sm mb-4">
          Connect a platform first, then create your first campaign
        </p>
        <div className="flex flex-col md:flex-row gap-2 justify-center">
          <Link
            href="/app/ads/accounts"
            className="px-5 py-2.5 border border-line text-text rounded-xl font-medium text-sm hover:bg-bg-3"
          >
            Connect Account
          </Link>
          <Link
            href="/app/ads/campaigns/new"
            className="px-5 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm hover:bg-amber/90"
          >
            Create Campaign
          </Link>
        </div>
      </div>
    </div>
  )
}
