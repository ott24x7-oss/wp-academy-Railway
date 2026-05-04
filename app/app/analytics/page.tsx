export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-2">Insights</h1>
      <p className="text-text-dim mb-8">Unified analytics across all your channels</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Views', value: '24.5K', trend: '↑ 12%' },
          { label: 'Clicks', value: '3,240', trend: '↑ 8%' },
          { label: 'Engagement', value: '4.2%', trend: '↑ 3%' },
          { label: 'Conversions', value: '324', trend: '↑ 18%' },
        ].map((metric, i) => (
          <div key={i} className="bg-bg-2 border border-line rounded-lg p-6">
            <p className="text-text-dim text-sm mb-2">{metric.label}</p>
            <p className="text-2xl font-bold mb-2">{metric.value}</p>
            <p className="text-xs text-emerald">{metric.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-2 border border-line rounded-lg p-6">
          <h2 className="font-serif font-bold mb-4">Performance Over Time</h2>
          <div className="w-full h-64 bg-gradient-to-br from-bg to-bg-3 rounded-lg flex items-center justify-center text-text-dim">
            Chart will display here
          </div>
        </div>

        <div className="bg-bg-2 border border-line rounded-lg p-6">
          <h2 className="font-serif font-bold mb-4">Top Platforms</h2>
          <div className="space-y-4">
            {['Meta', 'Google', 'LinkedIn', 'TikTok'].map((platform, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm">{platform}</span>
                <div className="flex-1 mx-3 h-2 bg-bg rounded-full">
                  <div
                    className="h-2 bg-amber rounded-full"
                    style={{ width: `${80 - i * 15}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-text-dim">{80 - i * 15}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
