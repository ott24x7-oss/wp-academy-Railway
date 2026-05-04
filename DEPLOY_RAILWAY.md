# Deployment Guide: Railway

This application is configured for deployment on Railway.app with automatic scaling, health checks, and Docker support.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub account with the repository
- All environment variables configured
- Supabase project set up with migrations applied

## Deployment Steps

### 1. Create Railway Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Navigate to project
cd /path/to/watshop-academy

# Create new Railway project
railway init
```

### 2. Configure Environment Variables

On Railway dashboard:

1. Go to **Variables** tab
2. Add all variables from `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your-secret
RESEND_API_KEY=re_...
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-7
AYRSHARE_API_KEY=your-key
AYRSHARE_DOMAIN=your-domain
META_APP_ID=your-id
META_APP_SECRET=your-secret
META_REDIRECT_URI=https://yourdomain.com/api/oauth/meta/callback
GOOGLE_ADS_CLIENT_ID=your-id
GOOGLE_ADS_CLIENT_SECRET=your-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-token
GOOGLE_ADS_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback
LINKEDIN_CLIENT_ID=your-id
LINKEDIN_CLIENT_SECRET=your-secret
TIKTOK_CLIENT_KEY=your-key
TIKTOK_CLIENT_SECRET=your-secret
INNGEST_EVENT_KEY=your-key
INNGEST_SIGNING_KEY=your-key
POSTHOG_KEY=your-key
ENCRYPTION_KEY=your-32-char-hex-key
YOUTUBE_DATA_API_KEY=your-key
NODE_ENV=production
```

### 3. Deploy via Railway CLI

```bash
# Deploy
railway up

# View logs
railway logs

# Check status
railway status
```

**Or via GitHub:**

1. Connect GitHub repository to Railway
2. Railway will auto-deploy on push to main branch
3. View deployment progress in Railway dashboard

### 4. Set Up Custom Domain

1. Railway Dashboard → Settings → Domain
2. Add custom domain: `academy.watshop.in`
3. Update DNS records with provided values
4. SSL certificate auto-issued

### 5. Configure Webhooks

Update webhook URLs in external services:

**Stripe:**
- Go to Developers → Webhooks
- Add endpoint: `https://academy.watshop.in/api/webhooks/stripe`
- Subscribe to events: `charge.succeeded`, `payment_intent.succeeded`

**Razorpay:**
- Settings → Webhooks
- Add: `https://academy.watshop.in/api/webhooks/razorpay`

**Ayrshare:**
- API settings
- Update callback: `https://academy.watshop.in/api/webhooks/ayrshare`

### 6. Database Setup

```bash
# Run migrations via Supabase CLI
supabase migration up

# Or seed initial data
railway run pnpm run seed
```

## Railway Configuration

The app uses `railway.json` for deployment config:

```json
{
  "build": {
    "builder": "NIXPACKS"  // Auto-detects Node.js + Next.js
  },
  "deploy": {
    "startCommand": "pnpm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Build Process

Railway uses **Nixpacks** (recommended) which:
- Auto-detects Node.js version from `.nvmrc` or `package.json`
- Installs dependencies with pnpm
- Runs `next build`
- Starts with `pnpm start`

If Nixpacks fails, Railway falls back to `Dockerfile`

### Port Configuration

The app respects the `PORT` environment variable:

```bash
# In next.config.ts and package.json start script
"start": "next start -p $PORT"
```

Railway sets `PORT=3000` by default.

## Health Check

Health endpoint at `GET /api/health` returns:

```json
{
  "status": "ok",
  "timestamp": "2024-05-04T12:00:00Z"
}
```

Railway checks this endpoint every 10 seconds. If it fails 3 times, the deployment restarts.

## Monitoring

### Logs

```bash
# Stream logs
railway logs

# View specific service
railway logs --service app

# View build logs
railway logs --service builder
```

### Metrics

Railway Dashboard shows:
- CPU usage
- Memory usage
- Network I/O
- Error rate
- Response time

### Error Tracking

Use PostHog (configured in app) to track client-side errors:
- Visit `posthog.com/project/{key}`
- View event timelines
- Set up alerts

## Scaling

### Vertical Scaling (CPU/Memory)

Railway Dashboard:
1. Settings → Resources
2. Adjust CPU & Memory
3. Changes auto-apply with rolling restart

### Horizontal Scaling

To run multiple instances:

```bash
railway scale --replicas 3
```

Railway load-balances across instances.

## Continuous Deployment

### GitHub Integration

1. Railway Dashboard → Settings → Repository
2. Connect GitHub account
3. Select repository branch to deploy
4. Enable auto-deploy on push

### Manual Deploy

```bash
# Deploy branch
railway up

# Deploy from CI/CD
railway deploy --branch main
```

## Database Backup

Supabase handles automatic backups:

1. Go to Supabase Dashboard
2. Settings → Database → Backups
3. Daily automatic backups enabled
4. Manual backups available

## SSL/TLS

Railway auto-provisions SSL certificates via Let's Encrypt for custom domains.

To force HTTPS in Next.js:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      { status: 301 }
    )
  }
}
```

## Troubleshooting

### Build Fails

```bash
# Check build logs
railway logs --service builder

# Clear cache
railway up --clear-cache

# Force rebuild
railway deploy
```

### App Crashes After Deploy

```bash
# Check app logs
railway logs

# Check health endpoint
curl https://academy.watshop.in/api/health

# Rollback to previous version
railway rollback
```

### Environment Variables Not Loading

```bash
# Verify variables are set
railway variables ls

# Restart app
railway down
railway up
```

### Database Connection Issues

```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Check connection string in Railway variables
railway variables ls | grep SUPABASE
```

## Performance Optimization

### Build Size

Current Next.js build size: ~2.5MB

Check with:
```bash
railway logs | grep "build size"
```

### Bundle Analysis

```bash
pnpm add -D @next/bundle-analyzer

# Analyze
ANALYZE=true pnpm build
```

### Database Queries

Monitor slow queries in Supabase:
- Dashboard → Logs → Query Performance
- Look for queries > 100ms

## Costs

**Estimated monthly cost (small app):**
- Railway compute: $5-15 (1 instance, 512MB RAM)
- Supabase database: $25 (PostgreSQL)
- Total: ~$30-40/month

Scales with usage:
- More instances = higher compute cost
- More connections = higher database cost
- More storage = higher storage cost

## Support

- Railway Docs: https://docs.railway.app
- Railway Community: https://community.railway.app
- Support: support@railway.app
