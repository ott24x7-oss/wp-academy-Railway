// Database types for WatShop Academy

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: 'user' | 'admin' | 'agency_owner'
  country_code?: string
  preferred_language: string
  plan: 'free' | 'creator' | 'pro' | 'agency' | 'lifetime'
  plan_expires_at?: string
  ai_credits_remaining: number
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  is_agency: boolean
  branding_color: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description?: string
  category: string
  language: 'en' | 'hi' | 'both'
  youtube_url?: string
  youtube_video_id?: string
  youtube_playlist_id?: string
  thumbnail_url?: string
  duration_minutes?: number
  lesson_count?: number
  quality_score: number
  is_official: boolean
  is_recommended: boolean
  has_certificate: boolean
  is_outdated: boolean
  active: boolean
  health_status: 'ok' | 'broken' | 'private' | 'embed_disabled' | 'unknown'
  last_reviewed_at: string
  created_at: string
  updated_at: string
}

export interface CourseProgress {
  id: string
  user_id: string
  course_id: string
  progress_percentage: number
  lessons_completed: number
  started_at: string
  completed_at?: string
  last_accessed_at: string
}

export interface CourseNote {
  id: string
  user_id: string
  course_id: string
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface LearningPath {
  id: string
  title: string
  slug: string
  description?: string
  icon?: string
  created_at: string
}

export interface Order {
  id: string
  order_id: string
  user_id: string
  plan: string
  amount: number
  unique_amount: number
  currency: string
  payment_method: 'upi' | 'binance' | 'btc' | 'ltc'
  payment_status: 'pending' | 'pending_verification' | 'verified' | 'cancelled' | 'failed'
  verification_method?: 'imap' | 'manual' | 'webhook'
  txn_id?: string
  expires_at: string
  verified_at?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  workspace_id: string
  user_id: string
  content: string
  media_urls?: string[]
  platforms: string[]
  scheduled_at?: string
  posted_at?: string
  status: 'draft' | 'scheduled' | 'posted' | 'failed'
  ayrshare_post_id?: string
  created_at: string
  updated_at: string
}

export interface SocialAccount {
  id: string
  workspace_id: string
  user_id: string
  platform: 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'whatsapp'
  account_id: string
  account_name?: string
  access_token: string
  refresh_token?: string
  expires_at?: string
  connected_at: string
}

export interface AdAccount {
  id: string
  workspace_id: string
  user_id: string
  platform: 'meta' | 'google' | 'linkedin' | 'tiktok'
  account_id: string
  account_name?: string
  access_token: string
  refresh_token?: string
  expires_at?: string
  connected_at: string
}

export interface AdCampaign {
  id: string
  workspace_id: string
  user_id: string
  ad_account_id: string
  name: string
  platform: string
  external_campaign_id?: string
  status: 'active' | 'paused' | 'ended'
  budget_usd?: number
  spent_usd: number
  started_at?: string
  ended_at?: string
  created_at: string
}

export interface AiConversation {
  id: string
  user_id: string
  workspace_id: string
  title?: string
  created_at: string
  updated_at: string
}

export interface AiMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  tokens_used: number
  created_at: string
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  certificate_type: 'completion' | 'badge' | 'official'
  issued_at: string
  certificate_url?: string
}
