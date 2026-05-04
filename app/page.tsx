import Link from 'next/link'
import { ArrowRight, Play, Zap, Users, TrendingUp, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-line bg-bg/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-amber/50 flex items-center justify-center">
                <span className="text-bg font-bold text-sm">W</span>
              </div>
              <span className="font-serif text-xl font-bold text-text">WatShop</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-text hover:text-amber transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 bg-amber text-bg rounded-lg font-semibold text-sm hover:bg-amber/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-amber via-text to-sky bg-clip-text text-transparent leading-tight">
            From learning to earning
          </h1>
          <p className="text-xl text-text-dim mb-8 max-w-2xl mx-auto">
            Master digital marketing, social media, and AI tools. Launch campaigns. Build your agency. All in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 px-8 py-4 border border-line text-text rounded-lg font-semibold hover:bg-bg-2 transition-colors"
            >
              <Play className="w-5 h-5" />
              View Plans
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-line">
            <div>
              <div className="text-3xl font-bold text-amber">50+</div>
              <p className="text-sm text-text-dim">Courses</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald">10,000+</div>
              <p className="text-sm text-text-dim">Students</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-sky">5</div>
              <p className="text-sm text-text-dim">Ad Platforms</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-rose">24/7</div>
              <p className="text-sm text-text-dim">AI Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 border-t border-line">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-4xl font-bold text-center mb-16">Everything you need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Play,
                title: 'Learn',
                description: 'Curated courses in Hindi & English from Google, Meta, YouTube, and HubSpot.',
                color: 'text-sky',
              },
              {
                icon: Zap,
                title: 'Post & Automate',
                description: 'Schedule content across social platforms with AI-powered copy generation.',
                color: 'text-amber',
              },
              {
                icon: TrendingUp,
                title: 'Manage Ads',
                description: 'Run campaigns on Meta, Google, LinkedIn, and TikTok from one dashboard.',
                color: 'text-emerald',
              },
              {
                icon: Users,
                title: 'Build Agency',
                description: 'White-label workspace and manage clients with dedicated analytics.',
                color: 'text-rose',
              },
              {
                icon: Sparkles,
                title: 'AI Assistant',
                description: 'Claude-powered copy, audits, lesson summaries, and practice feedback.',
                color: 'text-violet',
              },
              {
                icon: TrendingUp,
                title: 'Unified Analytics',
                description: 'Real-time insights across courses, posts, and ad campaigns.',
                color: 'text-gold',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-lg border border-line bg-bg-2 hover:bg-bg-3 transition-colors">
                <feature.icon className={`w-8 h-8 mb-4 ${feature.color}`} />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-text-dim text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-20 border-t border-line">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-4xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-text-dim mb-16">No hidden fees. Cancel anytime.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Free', price: '$0', features: ['Unlimited learn access', 'No ads limit', 'Community support'] },
              { name: 'Creator', price: '$19', features: ['Social posting', 'Ad campaigns', 'Analytics', 'Email support'] },
              {
                name: 'Pro',
                price: '$49',
                features: ['Everything in Creator', 'Multi-workspace', 'Advanced reports', 'Priority support'],
              },
              {
                name: 'Agency',
                price: '$149',
                features: ['White-label', 'Client dashboards', 'Custom integrations', '24/7 support'],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-6 rounded-lg border transition-colors ${
                  i === 2
                    ? 'border-amber bg-bg-3 relative overflow-hidden'
                    : 'border-line bg-bg-2 hover:bg-bg-3'
                }`}
              >
                {i === 2 && <div className="absolute -top-1 -right-1 bg-amber text-bg text-xs px-3 py-1 rounded">POPULAR</div>}
                <h3 className="font-serif text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                  i === 2
                    ? 'bg-amber text-bg hover:bg-amber/90'
                    : 'border border-line text-text hover:bg-bg-3'
                }`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 border-t border-line text-center">
        <h2 className="font-serif text-4xl font-bold mb-4">Ready to start earning?</h2>
        <p className="text-text-dim mb-8 max-w-xl mx-auto">
          Join 10,000+ students who've built successful marketing careers.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 transition-colors"
        >
          Create Free Account
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-line px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-text-dim">
                <li><a href="#" className="hover:text-text transition">Features</a></li>
                <li><a href="#" className="hover:text-text transition">Pricing</a></li>
                <li><a href="#" className="hover:text-text transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-text-dim">
                <li><a href="#" className="hover:text-text transition">About</a></li>
                <li><a href="#" className="hover:text-text transition">Blog</a></li>
                <li><a href="#" className="hover:text-text transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-text-dim">
                <li><a href="#" className="hover:text-text transition">Privacy</a></li>
                <li><a href="#" className="hover:text-text transition">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-text-dim">
                <li><a href="#" className="hover:text-text transition">Twitter</a></li>
                <li><a href="#" className="hover:text-text transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-text transition">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-line pt-8 text-center text-sm text-text-dim">
            <p>&copy; 2024 WatShop Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
