# WatShop Academy + Marketing Suite

**From learning to earning, all in one panel.**

A complete multi-tenant SaaS platform for digital marketing education, social media automation, unified ads management, and AI-powered content creation.

**Live at:** [academy.watshop.in](http://academy.watshop.in)

## Features

### 📚 Curated Academy
- 50+ marketing courses in Hindi & English
- Official courses from Google Skillshop, Meta Blueprint, YouTube Creator Academy
- Progressive learning paths for different skill levels
- Course progress tracking and completion badges

### 📱 Social Media Automation
- Compose and schedule posts via Ayrshare
- Multi-platform posting (Twitter, Instagram, LinkedIn, Facebook, TikTok)
- Content calendar and bulk scheduling
- AI-powered caption generation

### 📊 Unified Ads Dashboard
- Manage campaigns across Meta, Google, LinkedIn, TikTok
- Unified analytics and ROAS tracking
- Cross-platform reporting
- Budget optimization insights

### 🤖 Claude AI Assistant
- Generate social media copy
- Audit ad performance
- Summarize course lessons
- Practice feedback and grading
- Real-time chat interface

### 📈 Analytics
- Real-time insights across courses, posts, campaigns
- Unified dashboard for all metrics
- Exportable reports

### 🏢 Agency Mode
- White-label workspace customization
- Multi-client management
- Team collaboration with role-based access
- Dedicated client dashboards

## Tech Stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js API Routes, Node.js
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **Authentication:** Supabase Auth + OAuth (Meta, Google, LinkedIn, TikTok)
- **Payments:** Stripe (global), Razorpay (India)
- **Email:** Resend + React Email
- **AI:** Anthropic Claude API
- **External APIs:** Ayrshare, Facebook Business SDK, Google Ads API
- **Background Jobs:** Inngest
- **Analytics:** PostHog
- **Hosting:** Railway
- **Package Manager:** pnpm

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9.12.0+
- Supabase account
- API keys for third-party services (see `.env.example`)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd watshop-academy

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Update .env.local with your credentials

# Run migrations
pnpm run seed

# Start development server
pnpm dev
```

Server runs at http://localhost:3000

### Build & Test

```bash
# Type check
pnpm typecheck

# Run tests
pnpm test

# Build for production
pnpm build

# Check health endpoint
curl http://localhost:3000/api/health
```

## Project Structure

```
├── app/
│   ├── (public)          # Public pages: home, login, signup
│   ├── app/              # Protected app routes
│   │   ├── dashboard/    # Main dashboard
│   │   ├── learn/        # Course catalog
│   │   ├── publish/      # Social posting
│   │   ├── ads/          # Ad campaigns
│   │   ├── analytics/    # Analytics dashboard
│   │   ├── ai/           # AI assistant
│   │   ├── settings/     # Billing, team
│   │   └── admin/        # Admin panel
│   ├── api/              # API routes & webhooks
│   └── layout.tsx        # Root layout
├── components/           # Reusable React components
├── lib/                  # Utilities, helpers
├── supabase/             # Database migrations
├── scripts/              # Seed, healthcheck scripts
├── public/               # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── railway.json          # Railway deployment config
```

## Deployment

See [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md) for Railway deployment instructions.

### Quick Deploy

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

## Environment Variables

See `.env.example` for all required environment variables.

**Key variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `ANTHROPIC_API_KEY` - Claude AI API key
- `AYRSHARE_API_KEY` - Social posting API key

## Database

PostgreSQL via Supabase with Row-Level Security (RLS) enabled.

### Migrations

```bash
# Create migration
supabase migration new migration_name

# Apply migrations
supabase migration list
```

Tables:
- `users` - User accounts
- `workspaces` - Multi-tenant workspaces
- `courses` - Course catalog
- `course_progress` - Learning progress
- `social_accounts` - Connected social platforms
- `posts` - Scheduled posts
- `ad_accounts` - Connected ad accounts
- `ad_campaigns` - Ad campaigns
- `ai_conversations` - Chat history

## API Routes

### Public
- `GET /api/health` - Health check

### Protected
- `POST /api/ai/chat` - Claude AI chat endpoint
- `GET /api/oauth/*/callback` - OAuth callbacks
- `POST /api/webhooks/*` - Stripe, Razorpay webhooks

## Admin Panel

Access at `/app/admin/courses` (admin-only)

Features:
- Add/edit courses manually
- Import courses via CSV
- Toggle course flags (recommended, official, outdated)
- Health check broken videos
- Review queue for old ads courses

See [HOWTO_ADMIN.md](HOWTO_ADMIN.md) for detailed admin docs.

## Design System

Dark premium theme with custom CSS variables:

```css
--bg: #0a0a0f              /* Main background */
--bg-2: #11111a            /* Secondary background */
--bg-3: #16171f            /* Tertiary background */
--text: #e8e8ee            /* Primary text */
--text-dim: #94959f        /* Dimmed text */
--amber: #fbbf24           /* Primary accent */
--emerald: #34d399         /* Success/positive */
--rose: #fb7185            /* Danger/negative */
--violet: #a78bfa         /* AI/purple accent */
--sky: #38bdf8            /* Info/blue accent */
--gold: #f5c14a           /* Gold accent */
```

Fonts:
- Headings: Instrument Serif
- Body: Geist Sans
- Monospace: Geist Mono

## Mobile First

- Responsive at 360px minimum
- Bottom tab navigation under 880px
- Touch targets 44px minimum
- 16:9 iframe responsive video embeds

## Pricing

- **Free:** $0/month - Unlimited course access
- **Creator:** $19/month - Social posting + analytics
- **Pro:** $49/month - Multiple workspaces + advanced reports
- **Agency:** $149/month - White-label + client dashboards
- **Lifetime:** $299 one-time

India users see ₹ pricing via Razorpay.
Global users see $ pricing via Stripe.

## Support

For support and bug reports, contact us at [support email].

## License

Proprietary - All rights reserved
