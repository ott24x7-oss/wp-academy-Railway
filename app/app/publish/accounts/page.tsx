'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  MessageCircle,
  Plus,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Platform {
  id: string
  name: string
  icon: any
  color: string
  bg: string
  description: string
  oauthSlug?: string
  ayrshareOnly?: boolean
}

const platforms: Platform[] = [
  {
    id: 'meta',
    name: 'Facebook + Instagram',
    icon: Facebook,
    color: 'text-[#1877F2]',
    bg: 'bg-[#1877F2]/10',
    description: 'Pages, posts & Instagram via Meta',
    oauthSlug: 'meta',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'text-text',
    bg: 'bg-text/10',
    description: 'Post tweets & threads',
    ayrshareOnly: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-[#0A66C2]',
    bg: 'bg-[#0A66C2]/10',
    description: 'Profile & company posts',
    oauthSlug: 'linkedin',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music2,
    color: 'text-rose',
    bg: 'bg-rose/10',
    description: 'Video uploads & analytics',
    oauthSlug: 'tiktok',
  },
  {
    id: 'instagram',
    name: 'Instagram (Ayrshare)',
    icon: Instagram,
    color: 'text-[#E4405F]',
    bg: 'bg-[#E4405F]/10',
    description: 'Direct via Ayrshare hub',
    ayrshareOnly: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: MessageCircle,
    color: 'text-emerald',
    bg: 'bg-emerald/10',
    description: 'Broadcast & chat',
    ayrshareOnly: true,
  },
]

function AccountsContent() {
  const params = useSearchParams()
  const connected = params.get('connected')
  const error = params.get('error')

  const [connections, setConnections] = useState<Set<string>>(new Set())

  useEffect(() => {
    // In a real app: fetch from /api/social/accounts
    // For now: read from localStorage (demo)
    const saved = localStorage.getItem('connected_accounts')
    if (saved) {
      try {
        setConnections(new Set(JSON.parse(saved)))
      } catch {}
    }
    // Mark just-connected
    if (connected) {
      setConnections((prev) => {
        const next = new Set(prev)
        next.add(connected)
        localStorage.setItem('connected_accounts', JSON.stringify(Array.from(next)))
        return next
      })
    }
  }, [connected])

  function startConnect(platform: Platform) {
    if (platform.ayrshareOnly) {
      window.open('https://app.ayrshare.com/social-accounts', '_blank', 'noopener')
      return
    }
    if (platform.oauthSlug) {
      window.location.href = `/api/social/connect/${platform.oauthSlug}`
    }
  }

  function disconnect(id: string) {
    setConnections((prev) => {
      const next = new Set(prev)
      next.delete(id)
      localStorage.setItem('connected_accounts', JSON.stringify(Array.from(next)))
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Social Accounts</h1>
        <p className="text-text-dim text-sm">
          Connect your accounts to start scheduling and publishing posts
        </p>
      </div>

      {connected && (
        <div className="bg-emerald/10 border border-emerald/30 rounded-2xl p-3 text-emerald text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Connected to {connected}!
        </div>
      )}
      {error && (
        <div className="bg-rose/10 border border-rose/30 rounded-2xl p-3 text-rose text-sm">
          {error.replace(/_/g, ' ')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {platforms.map((p) => {
          const isConnected = connections.has(p.id)
          return (
            <div
              key={p.id}
              className="bg-bg-2 border border-line rounded-2xl p-4 flex items-center gap-3"
            >
              <div
                className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0`}
              >
                <p.icon className={`w-6 h-6 ${p.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{p.name}</p>
                <p className="text-xs text-text-dim truncate">{p.description}</p>
              </div>
              {isConnected ? (
                <button
                  onClick={() => disconnect(p.id)}
                  className="px-3 py-1.5 text-xs border border-line rounded-lg text-text-dim hover:text-rose hover:border-rose/30"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => startConnect(p)}
                  className="px-3 py-1.5 text-xs bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90"
                >
                  Connect
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-bg-2 border border-line rounded-2xl p-5">
        <h3 className="font-serif font-bold mb-2">How it works</h3>
        <ul className="text-sm text-text-dim space-y-2">
          <li>
            <strong className="text-text">Meta / Google / LinkedIn / TikTok:</strong> direct
            OAuth connection. Tokens stored encrypted (AES-256-GCM).
          </li>
          <li>
            <strong className="text-text">Twitter / Instagram / WhatsApp:</strong> via{' '}
            <a
              className="text-amber"
              href="https://app.ayrshare.com/social-accounts"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ayrshare hub
            </a>{' '}
            (one-click connect, automatic token refresh).
          </li>
          <li>
            All connections are workspace-scoped. Configure env vars to enable each provider.
          </li>
        </ul>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-amber" />
        </div>
      }
    >
      <AccountsContent />
    </Suspense>
  )
}
