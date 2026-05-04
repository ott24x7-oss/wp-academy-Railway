-- WatShop Academy: Initial Database Schema
-- Designed for Supabase (PostgreSQL) with Row-Level Security

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ──────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agency_owner')),
  country_code TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'both')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'creator', 'pro', 'agency', 'lifetime')),
  plan_expires_at TIMESTAMPTZ,
  ai_credits_remaining INTEGER DEFAULT 100,
  password_hash TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Workspaces ──────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_agency BOOLEAN DEFAULT FALSE,
  branding_color TEXT DEFAULT '#fbbf24',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ─── Courses ──────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'both')),
  youtube_url TEXT,
  youtube_video_id TEXT,
  youtube_playlist_id TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  lesson_count INTEGER,
  quality_score INTEGER DEFAULT 70 CHECK (quality_score >= 0 AND quality_score <= 100),
  is_official BOOLEAN DEFAULT FALSE,
  is_recommended BOOLEAN DEFAULT FALSE,
  has_certificate BOOLEAN DEFAULT FALSE,
  is_outdated BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('ok', 'broken', 'private', 'embed_disabled', 'unknown')),
  last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS course_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_path_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  UNIQUE(learning_path_id, course_id)
);

CREATE TABLE IF NOT EXISTS practice_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  feedback TEXT,
  score INTEGER,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_type TEXT DEFAULT 'completion' CHECK (certificate_type IN ('completion', 'badge', 'official')),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  certificate_url TEXT,
  UNIQUE(user_id, course_id)
);

-- ─── Orders (Payments) ──────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  unique_amount NUMERIC(10, 4) NOT NULL,
  currency TEXT DEFAULT 'INR' CHECK (currency IN ('INR', 'USDT', 'BTC', 'LTC')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'binance', 'btc', 'ltc')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'pending_verification', 'verified', 'cancelled', 'failed')),
  verification_method TEXT CHECK (verification_method IN ('imap', 'manual', 'webhook')),
  txn_id TEXT,
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Social Accounts & Posts ──────────────────────
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'whatsapp')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, platform, account_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  platforms TEXT[] NOT NULL,
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  ayrshare_post_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Ad Accounts & Campaigns ──────────────────────
CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'linkedin', 'tiktok')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, platform, account_id)
);

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  external_campaign_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  budget_usd NUMERIC(10, 2),
  spent_usd NUMERIC(10, 2) DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spent_usd NUMERIC(10, 2) DEFAULT 0,
  cpc NUMERIC(10, 4),
  ctr NUMERIC(5, 2),
  UNIQUE(campaign_id, date)
);

-- ─── AI ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_credit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL,
  operation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_unique_amount ON orders(unique_amount) WHERE payment_status = 'pending_verification';
CREATE INDEX IF NOT EXISTS idx_posts_workspace ON posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_workspace ON ad_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);

-- ─── Row Level Security ──────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Public read for courses & learning paths
CREATE POLICY "Courses are public" ON courses FOR SELECT USING (active = true);
CREATE POLICY "Learning paths are public" ON learning_paths FOR SELECT USING (true);

-- Users can read/update only their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Course progress is private to user
CREATE POLICY "Users can view own progress" ON course_progress FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage own progress" ON course_progress FOR ALL USING (auth.uid()::text = user_id::text);

-- Notes are private
CREATE POLICY "Users can manage own notes" ON course_notes FOR ALL USING (auth.uid()::text = user_id::text);

-- Orders are private to user
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid()::text = user_id::text);

-- Social/Ad accounts scoped to workspace
CREATE POLICY "Workspace members can view social accounts" ON social_accounts FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()::uuid));
