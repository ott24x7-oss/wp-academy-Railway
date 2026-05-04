'use client'

import { useState } from 'react'
import { Facebook, Search, Linkedin, Music2, CheckCircle2 } from 'lucide-react'

interface AdPlatform {
  id: 'meta' | 'google' | 'linkedin' | 'tiktok'
  name: string
  icon: any
  color: string
  bg: string
  description: string
  oauthSlug: string
  envVar: string
}

const platforms: AdPlatform[] = [
  {
    id: 'meta',
    name: 'Meta Ads',
    icon: Facebook,
    color: 'text-[#1877F2]',
    bg: 'bg-[#1877F2]/10',
    description: 'Facebook + Instagram campaigns via Graph API v22+',
    oauthSlug: 'meta',
    envVar: 'META_APP_ID',
  },
  {
    id: 'google',
    name: 'Google Ads',
    icon: Search,
    color: 'text-emerald',
    bg: 'bg-emerald/10',
    description: 'Search, Display, YouTube & Shopping campaigns',
    oauthSlug: 'google',
    envVar: 'GOOGLE_ADS_CLIENT_ID',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Ads',
    icon: Linkedin,
    color: 'text-[#0A66C2]',
    bg: 'bg-[#0A66C2]/10',
    description: 'B2B sponsored content & lead gen',
    oauthSlug: 'linkedin',
    envVar: 'LINKEDIN_CLIENT_ID',
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    icon: Music2,
    color: 'text-rose',
    bg: 'bg-rose/10',
    description: 'In-feed videos, Spark ads & TopView',
    oauthSlug: 'tiktok',
    envVar: 'TIKTOK_CLIENT_KEY',
  },
]

export default function AdAccountsPage() {
  const [connections, setConnections] = useState<Set<string>>(new Set())

  function startConnect(p: AdPlatform) {
    window.location.href = `/api/social/connect/${p.oauthSlug}`
  }

  function disconnect(id: string) {
    setConnections((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Ad Accounts</h1>
        <p className="text-text-dim text-sm">
          Connect your ad platforms to manage campaigns from one dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {platforms.map((p) => {
          const isConnected = connections.has(p.id)
          return (
            <div key={p.id} className="bg-bg-2 border border-line rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <p.icon className={`w-6 h-6 ${p.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base">{p.name}</p>
                  <p className="text-xs text-text-dim mt-0.5 leading-snug">{p.description}</p>
                </div>
              </div>

              {isConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Connected
                  </div>
                  <button
                    onClick={() => disconnect(p.id)}
                    className="px-3 py-1.5 text-xs border border-line rounded-lg text-text-dim hover:text-rose hover:border-rose/30"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startConnect(p)}
                  className="w-full px-4 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm hover:bg-amber/90"
                >
                  Connect {p.name}
                </button>
              )}
              <p className="text-[10px] text-text-dim mt-2">
                Requires <code className="text-amber">{p.envVar}</code> env var
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
