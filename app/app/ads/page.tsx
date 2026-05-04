import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function AdsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-2">Ads Manager</h1>
          <p className="text-text-dim">Create and manage campaigns across all platforms</p>
        </div>
        <Link
          href="/app/ads/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { label: 'Total Spent', value: '$2,450', change: '+12%' },
          { label: 'Conversions', value: '324', change: '+18%' },
          { label: 'ROAS', value: '3.2x', change: '+5%' },
          { label: 'Impressions', value: '156K', change: '-2%' },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-2 border border-line rounded-lg p-6">
            <p className="text-text-dim text-sm mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold">{stat.value}</p>
              <span className="text-sm text-emerald">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-bg-2 border border-line rounded-lg p-6">
        <h2 className="font-serif text-xl font-bold mb-4">Active Campaigns</h2>
        <div className="space-y-4">
          {[
            { name: 'Summer Sale Campaign', platform: 'Meta', status: 'Active', spent: '$1,200' },
            { name: 'Lead Generation', platform: 'Google', status: 'Active', spent: '$800' },
            { name: 'Awareness Campaign', platform: 'LinkedIn', status: 'Paused', spent: '$450' },
          ].map((campaign, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-line rounded-lg">
              <div>
                <p className="font-semibold text-sm">{campaign.name}</p>
                <p className="text-xs text-text-dim">{campaign.platform}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-xs rounded-full mr-4 bg-emerald/20 text-emerald">
                  {campaign.status}
                </span>
                <p className="text-sm font-semibold">{campaign.spent}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
