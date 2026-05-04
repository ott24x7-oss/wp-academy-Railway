-- Daily AI bot: scheduled content generation jobs
-- Each user can create multiple "bots" that auto-generate content on a schedule

create extension if not exists "uuid-ossp";

create table if not exists ai_daily_jobs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  type text not null check (type in ('daily-quote', 'daily-question', 'social-post', 'custom')),
  topic text not null,
  tone text default 'professional',

  -- target platforms (subset of: facebook, instagram, twitter, linkedin, tiktok, whatsapp)
  platforms text[] not null default '{}',

  -- schedule
  schedule_time time not null default '09:00:00',  -- HH:MM in user's timezone
  timezone text not null default 'Asia/Kolkata',
  days_of_week int[] not null default '{0,1,2,3,4,5,6}',  -- 0=Sunday, 6=Saturday

  -- behavior
  mode text not null default 'draft' check (mode in ('auto', 'draft')),  -- auto = post immediately; draft = save & notify
  provider text default 'auto',  -- 'auto', 'gemini', 'openrouter', 'anthropic'

  active boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  total_runs int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_daily_jobs_user on ai_daily_jobs(user_id);
create index if not exists idx_ai_daily_jobs_next_run on ai_daily_jobs(next_run_at) where active = true;

-- Run history (for analytics + debugging)
create table if not exists ai_daily_job_runs (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references ai_daily_jobs(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'failed', 'partial')),
  generated_text text,
  post_results jsonb,  -- array of { platform, success, postId, error }
  error_message text
);

create index if not exists idx_ai_daily_job_runs_job on ai_daily_job_runs(job_id);

-- RLS
alter table ai_daily_jobs enable row level security;
alter table ai_daily_job_runs enable row level security;

drop policy if exists "Users manage own jobs" on ai_daily_jobs;
create policy "Users manage own jobs" on ai_daily_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users see own job runs" on ai_daily_job_runs;
create policy "Users see own job runs" on ai_daily_job_runs
  for select using (
    exists (
      select 1 from ai_daily_jobs j
      where j.id = ai_daily_job_runs.job_id and j.user_id = auth.uid()
    )
  );

-- Service role can insert run records (for cron)
drop policy if exists "Service inserts runs" on ai_daily_job_runs;
create policy "Service inserts runs" on ai_daily_job_runs
  for insert with check (true);

-- Updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ai_daily_jobs_updated_at on ai_daily_jobs;
create trigger ai_daily_jobs_updated_at
  before update on ai_daily_jobs
  for each row execute function set_updated_at();
