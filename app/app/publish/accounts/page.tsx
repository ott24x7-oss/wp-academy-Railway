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
  CheckCircle2,
  Loader2,
  KeyRound,
  Globe,
  Info,
  ExternalLink,
  Youtube,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Platform {
  id: string
  name: string
  icon: any
  color: string
  bg: string
  manualFormat: string
  manualHelp: string
  helpUrl: string
  oauthSlug?: string
}

const platforms: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook Page',
    icon: Facebook,
    color: 'text-[#1877F2]',
    bg: 'bg-[#1877F2]/10',
    manualFormat: 'PAGE_ID|PAGE_ACCESS_TOKEN',
    manualHelp:
      '1. Go to developers.facebook.com → My Apps → Create App (Business)\n2. Add "Pages" product\n3. Generate Page Access Token from Graph API Explorer\n4. Permissions needed: pages_manage_posts, pages_read_engagement\n5. Get Page ID from your page\'s "About" tab',
    helpUrl: 'https://developers.facebook.com/tools/explorer/',
    oauthSlug: 'meta',
  },
  {
    id: 'instagram',
    name: 'Instagram Business',
    icon: Instagram,
    color: 'text-[#E4405F]',
    bg: 'bg-[#E4405F]/10',
    manualFormat: 'IG_ACCOUNT_ID|PAGE_ACCESS_TOKEN',
    manualHelp:
      '1. Convert IG account to Business (free, in IG settings)\n2. Link IG to a Facebook Page\n3. Get Instagram Account ID from Graph API Explorer (using your Page Access Token)\n4. Use the same Page Token for Instagram',
    helpUrl: 'https://developers.facebook.com/docs/instagram-api/getting-started',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: MessageCircle,
    color: 'text-emerald',
    bg: 'bg-emerald/10',
    manualFormat: 'PHONE_NUMBER_ID|ACCESS_TOKEN',
    manualHelp:
      '1. Go to developers.facebook.com → WhatsApp\n2. Get a test phone number (free) or add your own\n3. Copy Phone Number ID and System User Access Token\n4. Permissions: whatsapp_business_messaging',
    helpUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'text-text',
    bg: 'bg-text/10',
    manualFormat: 'API_KEY|API_SECRET|ACCESS_TOKEN|ACCESS_SECRET',
    manualHelp:
      '1. Apply for X Developer account at developer.twitter.com\n2. Create a Project + App\n3. Generate Consumer Keys (API Key + Secret)\n4. Generate Access Token + Secret with read+write permissions\n5. Free tier: 1,500 posts/month',
    helpUrl: 'https://developer.twitter.com/',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-[#0A66C2]',
    bg: 'bg-[#0A66C2]/10',
    manualFormat: 'ACCESS_TOKEN',
    manualHelp:
      '1. Go to linkedin.com/developers\n2. Create an App\n3. Request "Share on LinkedIn" + "Sign In with LinkedIn" scopes\n4. Generate token via OAuth (60-day token)\n5. For company posts, also request w_organization_social',
    helpUrl: 'https://www.linkedin.com/developers/',
    oauthSlug: 'linkedin',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music2,
    color: 'text-rose',
    bg: 'bg-rose/10',
    manualFormat: 'ACCESS_TOKEN',
    manualHelp:
      '1. Go to developers.tiktok.com\n2. Register and create an App (Business)\n3. Add "Content Posting API" capability\n4. Get access token via OAuth flow (24-hour token, refresh enabled)',
    helpUrl: 'https://developers.tiktok.com/',
    oauthSlug: 'tiktok',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'text-rose',
    bg: 'bg-rose/10',
    manualFormat: 'API_KEY|CHANNEL_ID',
    manualHelp:
      '1. Go to console.cloud.google.com\n2. Enable YouTube Data API v3\n3. Create API Key (Credentials → Create credentials)\n4. Get your Channel ID from youtube.com/account_advanced',
    helpUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
  },
]

function AccountsContent() {
  const params = useSearchParams()
  const connected = params.get('connected')
  const error = params.get('error')

  const [activePlatform, setActivePlatform] = useState<string | null>(null)
  const [credentials, setCredentials] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [connections, setConnections] = useState<Set<string>>(new Set())
  const [showAyrshareInfo, setShowAyrshareInfo] = useState(false)

  useEffect(() => {
    loadConnections()
  }, [])

  async function loadConnections() {
    try {
      const res = await fetch('/api/social/accounts')
      if (res.ok) {
        const data = await res.json()
        setConnections(new Set((data.accounts || []).map((a: any) => a.platform)))
      }
    } catch {}
  }

  async function submitCredentials() {
    if (!activePlatform || !credentials.trim()) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/social/manual-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: activePlatform, credentials }),
      })
      const data = await res.json()
      if (data.success) {
        setResult({ ok: true, message: data.message + (data.accountName ? ` (${data.accountName})` : '') })
        setConnections((prev) => new Set([...Array.from(prev), activePlatform]))
        setTimeout(() => {
          setActivePlatform(null)
          setCredentials('')
          setResult(null)
        }, 2500)
      } else {
        setResult({ ok: false, message: data.error || 'Connection failed' })
      }
    } catch (e) {
      setResult({ ok: false, message: (e as Error).message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Social Accounts</h1>
        <p className="text-text-dim text-sm">
          Connect via paste-token (recommended) or full OAuth flow
        </p>
      </div>

      {connected && (
        <div className="bg-emerald/10 border border-emerald/30 rounded-2xl p-3 text-emerald text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          OAuth callback received from {connected}
        </div>
      )}
      {error && (
        <div className="bg-rose/10 border border-rose/30 rounded-2xl p-3 text-rose text-sm">
          OAuth error: {error.replace(/_/g, ' ')}
        </div>
      )}

      {/* Why OAuth might fail + Ayrshare alternative */}
      <div className="bg-amber/10 border border-amber/30 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">Connect button not working?</p>
            <p className="text-xs text-text-dim mb-2">
              Full OAuth requires app review for most platforms (takes weeks).
              Use <strong className="text-text">paste-token</strong> below — it's the same method
              the Telegram bot uses, no app review needed.
            </p>
            <button
              onClick={() => setShowAyrshareInfo(!showAyrshareInfo)}
              className="text-xs text-amber hover:underline"
            >
              {showAyrshareInfo ? 'Hide' : 'Or use Ayrshare (1-click for all platforms)'} →
            </button>
            {showAyrshareInfo && (
              <div className="mt-3 p-3 bg-bg-2 rounded-lg text-xs space-y-2">
                <p>
                  <strong>Ayrshare</strong> is a free social media hub that handles OAuth for
                  every platform with just one paste:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-text-dim">
                  <li>
                    Sign up at{' '}
                    <a
                      href="https://app.ayrshare.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber"
                    >
                      app.ayrshare.com/signup
                    </a>{' '}
                    (free for 1 social profile)
                  </li>
                  <li>Connect your accounts there (one-click for each)</li>
                  <li>
                    Copy your API key from{' '}
                    <a
                      href="https://app.ayrshare.com/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber"
                    >
                      app.ayrshare.com/api
                    </a>
                  </li>
                  <li>
                    Paste it in{' '}
                    <a href="/admin/settings" className="text-amber">
                      Admin → Settings → Ayrshare API key
                    </a>
                  </li>
                </ol>
                <p className="text-emerald">✓ All posts then work via the AI Compose page automatically.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform cards with paste-token */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {platforms.map((p) => {
          const isConnected = connections.has(p.id)
          const isActive = activePlatform === p.id
          return (
            <div
              key={p.id}
              className={`bg-bg-2 border rounded-2xl p-4 ${
                isActive ? 'border-amber' : 'border-line'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-11 h-11 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <p.icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{p.name}</p>
                    {isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />}
                  </div>
                  <p className="text-xs text-text-dim font-mono mt-0.5 truncate">
                    {p.manualFormat}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePlatform(isActive ? null : p.id)
                    setResult(null)
                    setCredentials('')
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold ${
                    isActive
                      ? 'bg-bg-3 text-text-dim'
                      : 'bg-amber text-bg hover:bg-amber/90'
                  }`}
                >
                  {isActive ? 'Cancel' : isConnected ? 'Reconnect' : 'Connect'}
                </button>
              </div>

              {isActive && (
                <div className="space-y-3 pt-3 border-t border-line">
                  <div>
                    <label className="block text-xs text-text-dim mb-1.5">
                      Paste {p.manualFormat}
                    </label>
                    <textarea
                      value={credentials}
                      onChange={(e) => setCredentials(e.target.value)}
                      placeholder={p.manualFormat}
                      rows={2}
                      className="w-full px-3 py-2 bg-bg border border-line rounded-lg text-xs font-mono focus:outline-none focus:border-sky resize-y"
                    />
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer text-amber hover:underline">
                      How to get this →
                    </summary>
                    <pre className="mt-2 p-3 bg-bg rounded-lg text-text-dim whitespace-pre-wrap font-sans">
                      {p.manualHelp}
                    </pre>
                    <a
                      href={p.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-amber text-xs"
                    >
                      Open developer console
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </details>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={submitCredentials}
                      disabled={submitting || !credentials.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber text-bg rounded-lg text-sm font-semibold hover:bg-amber/90 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5" />
                      )}
                      {submitting ? 'Connecting...' : 'Connect'}
                    </button>
                    {p.oauthSlug && (
                      <a
                        href={`/api/social/connect/${p.oauthSlug}`}
                        className="text-xs text-text-dim hover:text-text"
                      >
                        or use OAuth flow →
                      </a>
                    )}
                  </div>

                  {result && (
                    <div
                      className={`text-xs p-2 rounded-lg ${
                        result.ok
                          ? 'bg-emerald/10 text-emerald border border-emerald/30'
                          : 'bg-rose/10 text-rose border border-rose/30'
                      }`}
                    >
                      {result.ok ? '✅ ' : '❌ '}
                      {result.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Help footer */}
      <div className="bg-bg-2 border border-line rounded-2xl p-5">
        <h3 className="font-serif font-bold mb-2 flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber" />
          Three ways to connect
        </h3>
        <ul className="text-sm text-text-dim space-y-2">
          <li>
            <strong className="text-text">1. Paste-token (recommended):</strong> Generate a
            token once on the platform's developer console, paste here. Same method as
            Telegram bots.
          </li>
          <li>
            <strong className="text-text">2. Ayrshare hub:</strong> One-click connect for all
            platforms. Free for 1 profile. Best for beginners.
          </li>
          <li>
            <strong className="text-text">3. Full OAuth:</strong> Direct integration. Requires
            app approval (Meta App Review, etc.) which takes weeks.
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
