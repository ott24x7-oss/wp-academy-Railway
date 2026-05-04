import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function PublishPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-2">Publish</h1>
          <p className="text-text-dim">Create and schedule posts across social media</p>
        </div>
        <Link
          href="/app/publish/compose"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Post
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-2 border border-line rounded-lg p-4">
            <div className="aspect-square bg-gradient-to-br from-sky/20 to-violet/20 rounded-lg mb-4"></div>
            <h3 className="font-semibold mb-2">Post Title {i + 1}</h3>
            <p className="text-sm text-text-dim mb-4 line-clamp-2">This is a sample post content that would appear on your social media...</p>
            <div className="flex items-center justify-between text-xs text-text-dim">
              <span>Scheduled for today</span>
              <span>2 platforms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
