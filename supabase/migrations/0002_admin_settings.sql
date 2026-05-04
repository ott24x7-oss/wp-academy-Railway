-- Admin Settings: key-value store for site-wide config
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  category TEXT,
  description TEXT,
  is_secret BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Pricing plans table (separate from hardcoded plans for admin editing)
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_inr NUMERIC(10, 2) NOT NULL,
  price_usd NUMERIC(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  ai_credits INTEGER NOT NULL DEFAULT 100,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment methods config
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method_type TEXT NOT NULL CHECK (method_type IN ('upi', 'binance', 'btc', 'ltc')),
  display_name TEXT NOT NULL,
  address_or_id TEXT NOT NULL,
  qr_image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site content (homepage hero, features, etc.)
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity(created_at);

-- Seed default plans
INSERT INTO pricing_plans (slug, name, price_inr, price_usd, duration_days, ai_credits, features, is_featured, sort_order) VALUES
  ('free', 'Free', 0, 0, 36500, 100, ARRAY['Unlimited course access', 'Community support', 'Course completion badges'], false, 1),
  ('creator', 'Creator', 1499, 19, 30, 500, ARRAY['All Free features', 'Social media scheduling', '3 connected accounts', 'Basic analytics', 'Email support'], false, 2),
  ('pro', 'Pro', 3999, 49, 30, 2000, ARRAY['All Creator features', 'Ad campaigns', 'Unlimited accounts', 'Advanced analytics', 'Priority support'], true, 3),
  ('agency', 'Agency', 11999, 149, 30, 5000, ARRAY['All Pro features', 'White-label workspace', 'Unlimited team', 'Client dashboards', '24/7 support'], false, 4),
  ('lifetime', 'Lifetime', 24999, 299, 36500, 500, ARRAY['All Pro features forever', 'All future updates', 'Priority support'], false, 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed default settings
INSERT INTO admin_settings (key, value, category, description, is_secret) VALUES
  ('site_name', 'WatShop Academy', 'general', 'Site name shown everywhere', false),
  ('site_tagline', 'From learning to earning', 'general', 'Site tagline', false),
  ('support_email', 'support@watshop.in', 'general', 'Support contact email', false),
  ('email_enabled', '1', 'email', 'Enable/disable transactional emails', false),
  ('smtp_email', '', 'email', 'Gmail address for SMTP', true),
  ('smtp_password', '', 'email', 'Gmail App Password', true),
  ('smtp_from_name', 'WatShop Academy', 'email', 'From name in emails', false),
  ('php_mailer_url', '', 'email', 'External PHP mailer endpoint (optional)', false),
  ('upi_id', '', 'payment', 'UPI ID for receiving payments', false),
  ('binance_address', '', 'payment', 'Binance USDT TRC20 address', false),
  ('btc_address', '', 'payment', 'Bitcoin address', false),
  ('ltc_address', '', 'payment', 'Litecoin address', false),
  ('payment_imap_email', '', 'payment', 'Gmail for auto-verifying payments via IMAP', true),
  ('payment_imap_password', '', 'payment', 'Gmail App Password for IMAP', true),
  ('anthropic_api_key', '', 'ai', 'Claude API key', true),
  ('anthropic_model', 'claude-haiku-4-5-20251001', 'ai', 'Claude model ID', false),
  ('ayrshare_api_key', '', 'social', 'Ayrshare API key for social posting', true)
ON CONFLICT (key) DO NOTHING;

-- RLS: Only admins can access
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pricing plans public read" ON pricing_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Payment methods public read active" ON payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Site content public read" ON site_content FOR SELECT USING (true);

-- Admin write policies (checked via auth.uid() role lookup)
CREATE POLICY "Admins manage settings" ON admin_settings FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Admins manage plans" ON pricing_plans FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Admins manage payment methods" ON payment_methods FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Admins manage site content" ON site_content FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Admins read activity" ON admin_activity FOR SELECT
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
