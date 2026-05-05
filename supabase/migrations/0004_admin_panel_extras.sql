-- Admin panel extras: email templates, AI usage tracking, feature flags
-- All admin-managed; no per-user RLS (admin-only writes; service role reads)

create extension if not exists "uuid-ossp";

-- ─── Email templates ──────────────────────────────────────
create table if not exists email_templates (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,           -- 'welcome', 'order_verified', 'plan_expiring', 'password_reset'
  name text not null,
  subject text not null,
  html_body text not null,
  text_body text,
  variables jsonb default '[]'::jsonb,  -- ['{{name}}', '{{plan}}']
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Seed default templates
insert into email_templates (slug, name, subject, html_body, text_body, variables) values
  ('welcome', 'Welcome email', 'Welcome to {{site_name}}, {{name}}!',
   '<h2>Welcome {{name}}</h2><p>Thanks for joining {{site_name}}. Your free plan is active.</p><p><a href="{{dashboard_url}}">Open dashboard →</a></p>',
   'Welcome {{name}} — thanks for joining {{site_name}}. Your free plan is active. Open dashboard: {{dashboard_url}}',
   '["name","site_name","dashboard_url"]'::jsonb),
  ('order_verified', 'Payment verified', '✅ Payment received — {{plan}} plan active',
   '<h2>Payment confirmed</h2><p>Your {{plan}} plan is now active until {{expires_at}}.</p><p>Order: {{order_id}}</p>',
   'Payment confirmed. Your {{plan}} plan is active until {{expires_at}}. Order: {{order_id}}',
   '["plan","expires_at","order_id"]'::jsonb),
  ('plan_expiring', 'Plan expiring soon', 'Your {{plan}} plan expires in {{days_left}} days',
   '<h2>Renew your plan</h2><p>Hi {{name}}, your {{plan}} plan expires on {{expires_at}}.</p><p><a href="{{renew_url}}">Renew now →</a></p>',
   'Hi {{name}}, your {{plan}} plan expires on {{expires_at}}. Renew: {{renew_url}}',
   '["name","plan","expires_at","renew_url"]'::jsonb),
  ('password_reset', 'Password reset', 'Reset your password',
   '<h2>Reset your password</h2><p>Click the link to reset: <a href="{{reset_url}}">Reset password</a></p><p>If you did not request this, ignore this email.</p>',
   'Reset your password: {{reset_url}}',
   '["reset_url"]'::jsonb)
on conflict (slug) do nothing;

-- ─── AI usage log ─────────────────────────────────────────
create table if not exists ai_usage_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  workspace_id uuid references workspaces(id) on delete set null,
  endpoint text not null,                -- 'generate', 'chat', 'daily-bot'
  provider text not null,                -- 'gemini', 'openrouter', 'anthropic'
  model text not null,
  input_tokens int default 0,
  output_tokens int default 0,
  total_tokens int generated always as (coalesce(input_tokens,0) + coalesce(output_tokens,0)) stored,
  estimated_cost_cents int default 0,    -- rough USD cents
  success boolean not null default true,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_user on ai_usage_log(user_id);
create index if not exists idx_ai_usage_created on ai_usage_log(created_at desc);
create index if not exists idx_ai_usage_provider on ai_usage_log(provider);

-- ─── Feature flags ────────────────────────────────────────
create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default true,
  description text,
  category text default 'general',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into feature_flags (key, enabled, description, category) values
  ('signup_open', true, 'Allow new user signups', 'auth'),
  ('ai_generator', true, 'Enable AI Content Generator (/app/ai/generator)', 'ai'),
  ('ai_daily_bot', true, 'Enable Daily Bot (/app/ai/daily-bot)', 'ai'),
  ('ai_chat', true, 'Enable AI Chat (/app/ai)', 'ai'),
  ('social_direct', true, 'Use direct social platform APIs (free, paste-token)', 'social'),
  ('ayrshare_fallback', true, 'Fall back to Ayrshare for unconnected platforms', 'social'),
  ('payment_upi', true, 'Accept UPI payments', 'payment'),
  ('payment_binance', true, 'Accept Binance Pay', 'payment'),
  ('imap_verification', true, 'Auto-verify payments via Gmail IMAP', 'payment'),
  ('course_csv_upload', true, 'Allow bulk course import via CSV', 'admin'),
  ('email_send', true, 'Send transactional emails (master toggle)', 'email')
on conflict (key) do nothing;

-- ─── RLS ──────────────────────────────────────────────────
alter table email_templates enable row level security;
alter table ai_usage_log enable row level security;
alter table feature_flags enable row level security;

-- Admins manage email templates
drop policy if exists "Admins manage templates" on email_templates;
create policy "Admins manage templates" on email_templates
  for all using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );

-- Anyone authenticated can read active flags (so client can hide UI)
drop policy if exists "Anyone reads flags" on feature_flags;
create policy "Anyone reads flags" on feature_flags for select using (true);

drop policy if exists "Admins write flags" on feature_flags;
create policy "Admins write flags" on feature_flags
  for insert with check (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );

drop policy if exists "Admins update flags" on feature_flags;
create policy "Admins update flags" on feature_flags
  for update using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );

-- AI usage log: users see own; admins see all
drop policy if exists "Users see own AI usage" on ai_usage_log;
create policy "Users see own AI usage" on ai_usage_log for select using (
  auth.uid() = user_id or
  exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
);

drop policy if exists "Service inserts AI usage" on ai_usage_log;
create policy "Service inserts AI usage" on ai_usage_log for insert with check (true);
