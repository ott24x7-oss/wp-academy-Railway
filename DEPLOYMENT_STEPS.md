# WatShop Academy — Complete Railway Deployment Steps

**This is the actual record of every step performed to deploy the project.**

## ✅ What Was Done

### 1. GitHub — Repository Setup
- **Repo:** https://github.com/ott24x7-oss/wp-academy-Railway
- Created via `gh repo create wp-academy-Railway --public --source=. --push`
- All Phase 1–5 + Auth + IMAP/UPI payment code committed
- 5 commits total (including auth wiring & dependency fix)

### 2. Supabase — Database Setup
- **Project URL:** `https://fpmoovapfrcjdsduygff.supabase.co`
- **Region:** AWS ap-south-1 (Mumbai)
- **Anon Key:** `eyJhbGci…7hSiyCmW9oqL0pBIbg-ti3N-S-tg82nR7aklrukw0-M`
- **Service Role Key:** `eyJhbGci…9TLIA53C9Qivup29kNk-4kkJIWVit69iqcLHKWgUidc`
- **Migration executed:** `supabase/migrations/0001_init.sql` (18 tables + RLS policies)
- **Site URL:** `https://wp-academy-railway-production.up.railway.app`
- **Redirect URL:** `https://wp-academy-railway-production.up.railway.app/api/auth/callback`

### 3. Railway — Project Deployment
- **Project name:** `peaceful-unity` (auto-generated)
- **Service:** `wp-academy-Railway` (from GitHub repo)
- **Region:** us-west2
- **Public domain:** `wp-academy-railway-production.up.railway.app`
- **Container port:** 8080 (Railway default)
- **Builder:** NIXPACKS (auto-detect)

---

## 📋 Step-by-Step Replay

### Step 1: Sign in to Railway
1. Open https://railway.com/login
2. Click **"Continue with GitHub"** (uses same `ott24x7-oss` account)
3. You're auto-logged in via OAuth

### Step 2: Create Project from GitHub
1. Open https://railway.com/new
2. Click **"GitHub Repository"**
3. Search **`wp-academy`** in the search box
4. Click **`ott24x7-oss/wp-academy-Railway`**
5. Railway shows "Deploying repository... will be live soon!"
6. Project named `peaceful-unity` (you can rename in Settings)

### Step 3: Add Environment Variables
1. Click on the `wp-academy-Railway` service card
2. Go to **Variables** tab
3. Click **"Raw Editor"** (top right of Variables panel)
4. Paste this entire block:

```
NEXT_PUBLIC_SUPABASE_URL=https://fpmoovapfrcjdsduygff.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbW9vdmFwZnJjamRzZHV5Z2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDY5NjMsImV4cCI6MjA5MzM4Mjk2M30.7hSiyCmW9oqL0pBIbg-ti3N-S-tg82nR7aklrukw0-M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbW9vdmFwZnJjamRzZHV5Z2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgwNjk2MywiZXhwIjoyMDkzMzgyOTYzfQ.9TLIA53C9Qivup29kNk-4kkJIWVit69iqcLHKWgUidc
NODE_ENV=production
EMAIL_ENABLED=1
SMTP_FROM_NAME=WatShop Academy
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

5. Click **"Update Variables"**
6. Click the **"Deploy"** button (top of canvas) to apply

### Step 4: Generate Public Domain
1. Click **Settings** tab on the service
2. Scroll right sidebar → click **"Networking"**
3. Click **"+ Generate Domain"**
4. **Important:** Set port to **8080** (Railway default container port)
5. Click **"Generate Domain"**
6. Copy the URL: `wp-academy-railway-production.up.railway.app`

> ⚠️ **Critical port fix:** If you initially set 3000, click the pencil-edit icon on the domain and change it to **8080** — Next.js uses Railway's PORT env var which defaults to 8080.

### Step 5: Add NEXT_PUBLIC_BASE_URL
1. Go back to **Variables** tab
2. Click **"Raw Editor"**
3. Append on a new line:
   ```
   NEXT_PUBLIC_BASE_URL=https://wp-academy-railway-production.up.railway.app
   ```
4. Click **"Update Variables"** → **"Deploy"**

### Step 6: Configure Supabase Auth Redirects
1. Open https://supabase.com/dashboard/project/fpmoovapfrcjdsduygff/auth/url-configuration
2. **Site URL:** Replace `http://localhost:3000` with `https://wp-academy-railway-production.up.railway.app` → **Save changes**
3. Under **Redirect URLs** click **"Add URL"** and add:
   ```
   https://wp-academy-railway-production.up.railway.app/api/auth/callback
   ```
4. Click **"Save URLs"**

### Step 7: Verify
- Health endpoint: https://wp-academy-railway-production.up.railway.app/api/health
  → returns `{"status":"ok","timestamp":"..."}`
- Landing page: https://wp-academy-railway-production.up.railway.app
- Sign up: https://wp-academy-railway-production.up.railway.app/signup
- Login: https://wp-academy-railway-production.up.railway.app/login

---

## 🔧 Optional Add-Ons

Add these env vars in Railway when ready:

| Feature | Variable | Where to get |
|---------|----------|--------------|
| UPI payments | `UPI_ID=name@paytm` | Your UPI ID |
| Binance USDT | `BINANCE_USDT_ADDRESS=Txxx` | Binance wallet (TRC20) |
| BTC | `BTC_ADDRESS=bc1q...` | Bitcoin wallet |
| LTC | `LTC_ADDRESS=ltc1q...` | Litecoin wallet |
| Auto-verify payments | `PAYMENT_IMAP_EMAIL`, `PAYMENT_IMAP_PASSWORD` | Gmail App Password (2FA enabled) |
| Send emails | `SMTP_EMAIL`, `SMTP_PASSWORD` | Gmail App Password |
| Claude AI | `ANTHROPIC_API_KEY=sk-ant-...` | https://console.anthropic.com |
| Social posting | `AYRSHARE_API_KEY`, `AYRSHARE_DOMAIN` | https://ayrshare.com |
| Meta Ads OAuth | `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` | https://developers.facebook.com |
| Google Ads OAuth | `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_REDIRECT_URI` | https://console.cloud.google.com |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | https://www.linkedin.com/developers |
| TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | https://developers.tiktok.com |
| YouTube data | `YOUTUBE_DATA_API_KEY` | https://console.cloud.google.com |

> Gmail App Passwords: https://myaccount.google.com/apppasswords (requires 2FA)

---

## 🌐 Custom Domain (academy.watshop.in)

Once Railway works:
1. Railway → **Settings** → **Networking** → **+ Custom Domain**
2. Enter `academy.watshop.in`
3. Railway shows a CNAME target like `xxx.up.railway.app`
4. In your DNS provider (where `watshop.in` is managed):
   - Type: **CNAME**
   - Name: **academy**
   - Value: `xxx.up.railway.app` (from Railway)
5. Wait 2–10 minutes for DNS propagation. SSL is auto-issued.
6. Update env vars:
   - `NEXT_PUBLIC_BASE_URL=https://academy.watshop.in`
7. Update Supabase Site URL + Redirect URLs to use `academy.watshop.in`

---

## 🐛 Troubleshooting

### 502 "Application failed to respond"
- **Cause:** Port mismatch — Next.js binds to PORT env (8080 on Railway), but domain forwards to a different port
- **Fix:** Settings → Networking → click pencil on domain → set port to **8080**

### Page loads but no styles (plain HTML)
- **Cause:** PostCSS / autoprefixer in `devDependencies` get skipped in Railway production install
- **Fix (already applied):** Move `postcss` and `autoprefixer` to `dependencies` in `package.json`, push to GitHub

### Login doesn't redirect
- **Cause:** Supabase Site URL still set to `localhost:3000`
- **Fix:** Update Site URL in Supabase → URL Configuration to your Railway domain

### "Supabase not configured" error in console
- **Cause:** Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars
- **Fix:** Add both to Railway variables, redeploy

### Build fails with "ERR_INVALID_ARG_TYPE"
- **Cause:** `next.config.ts` syntax incompatible with Node version
- **Fix:** Already configured for Node 20

---

## 📊 Summary

```
Repo:           ott24x7-oss/wp-academy-Railway (5 commits)
Database:       Supabase (Mumbai) — 18 tables, RLS enabled
Hosting:        Railway (us-west2)
Domain:         wp-academy-railway-production.up.railway.app
Health:         /api/health → {"status":"ok"}
Auth:           Email/password + Magic link via Supabase
Payments:       UPI / Binance USDT / BTC / LTC (no Stripe/Razorpay)
Email:          PHPMailer + Nodemailer Gmail SMTP fallback
AI:             Claude API integration ready
Social:         Ayrshare integration ready
```

**Status:** 🟢 Live & ready for credentials
