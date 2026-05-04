import Link from 'next/link'
import { Plus, Link2, Share2, Calendar, FileText, Sparkles } from 'lucide-react'

export default function PublishPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Publish</h1>
          <p className="text-text-dim text-sm">
            Schedule posts across all your social platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/publish/accounts"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-line rounded-xl font-medium text-sm hover:bg-bg-3"
          >
            <Link2 className="w-4 h-4" />
            <span className="hidden md:inline">Connect</span> Accounts
          </Link>
          <Link
            href="/app/publish/compose"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm hover:bg-amber/90"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link
          href="/app/publish/compose"
          className="bg-bg-2 border border-line rounded-2xl p-4 hover:border-amber/50 transition-colors group"
        >
          <div className="w-11 h-11 rounded-xl bg-amber/15 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-amber" />
          </div>
          <p className="font-semibold text-sm">AI Compose</p>
          <p className="text-xs text-text-dim mt-0.5">Generate with Claude</p>
        </Link>
        <Link
          href="/app/publish"
          className="bg-bg-2 border border-line rounded-2xl p-4 hover:border-amber/50 transition-colors group"
        >
          <div className="w-11 h-11 rounded-xl bg-sky/15 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-sky" />
          </div>
          <p className="font-semibold text-sm">Calendar</p>
          <p className="text-xs text-text-dim mt-0.5">Scheduled posts</p>
        </Link>
        <Link
          href="/app/publish/accounts"
          className="bg-bg-2 border border-line rounded-2xl p-4 hover:border-amber/50 transition-colors group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald/15 flex items-center justify-center mb-3">
            <Share2 className="w-5 h-5 text-emerald" />
          </div>
          <p className="font-semibold text-sm">Accounts</p>
          <p className="text-xs text-text-dim mt-0.5">Connect platforms</p>
        </Link>
      </div>

      {/* Empty state */}
      <div className="bg-bg-2 border border-line rounded-2xl p-8 text-center">
        <FileText className="w-12 h-12 text-text-dim mx-auto mb-3" />
        <h3 className="font-serif text-lg font-bold mb-1">No posts yet</h3>
        <p className="text-text-dim text-sm mb-4">
          Compose your first post or connect an account
        </p>
        <Link
          href="/app/publish/compose"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber text-bg rounded-xl font-semibold text-sm hover:bg-amber/90"
        >
          <Plus className="w-4 h-4" />
          Compose New Post
        </Link>
      </div>
    </div>
  )
}
