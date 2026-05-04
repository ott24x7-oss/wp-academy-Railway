import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Course, CourseProgress, Order, User } from './db.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Browser client (uses anon key, respects RLS)
let browserClient: SupabaseClient | null = null
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

// Server client (uses service role key, bypasses RLS — NEVER expose to client)
let serverClient: SupabaseClient | null = null
export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    serverClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return serverClient
}

// Backward-compat alias for browser usage
export const supabase = (): SupabaseClient => getSupabaseBrowserClient()

// ─── Course Categories ─────────────────────
export const COURSE_CATEGORIES = [
  'digital-marketing-basics',
  'google-ads',
  'meta-ads',
  'seo',
  'social-media-marketing',
  'youtube-marketing',
  'video-editing',
  'design-canva',
  'ai-marketing',
  'whatsapp-marketing',
  'agency-sales',
  'analytics-reporting',
  'content-creation',
  'freelancing-client-hunting',
] as const

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'digital-marketing-basics': 'Digital Marketing Basics',
    'google-ads': 'Google Ads',
    'meta-ads': 'Meta Ads',
    seo: 'SEO',
    'social-media-marketing': 'Social Media Marketing',
    'youtube-marketing': 'YouTube Marketing',
    'video-editing': 'Video Editing',
    'design-canva': 'Design & Canva',
    'ai-marketing': 'AI & Marketing',
    'whatsapp-marketing': 'WhatsApp Marketing',
    'agency-sales': 'Agency Sales',
    'analytics-reporting': 'Analytics & Reporting',
    'content-creation': 'Content Creation',
    'freelancing-client-hunting': 'Freelancing & Client Hunting',
  }
  return labels[category] || category
}

// ─── Course Queries ───────────────────────────
export async function getCourses(options?: {
  category?: string
  recommended?: boolean
  limit?: number
  offset?: number
}): Promise<Course[]> {
  const client = getSupabaseBrowserClient()
  let query = client.from('courses').select('*').eq('active', true)

  if (options?.category) query = query.eq('category', options.category)
  if (options?.recommended) query = query.eq('is_recommended', true)
  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset)
    query = query.range(options.offset, (options.offset || 0) + (options.limit || 10) - 1)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as Course[]
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const client = getSupabaseBrowserClient()
  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  if (error) throw error
  return data as Course | null
}

// ─── Order Queries ─────────────────────────────
export async function createOrder(order: Partial<Order>): Promise<Order> {
  const client = getSupabaseServerClient()
  const { data, error } = await client.from('orders').insert([order]).select().single()
  if (error) throw error
  return data as Order
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const client = getSupabaseServerClient()
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()
  if (error) throw error
  return data as Order | null
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['payment_status'],
  txnId?: string,
  verificationMethod?: Order['verification_method']
): Promise<Order> {
  const client = getSupabaseServerClient()
  const updates: any = {
    payment_status: status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'verified') {
    updates.verified_at = new Date().toISOString()
    if (verificationMethod) updates.verification_method = verificationMethod
  }
  if (txnId) updates.txn_id = txnId

  const { data, error } = await client
    .from('orders')
    .update(updates)
    .eq('order_id', orderId)
    .select()
    .single()
  if (error) throw error
  return data as Order
}

// ─── User Queries ─────────────────────────────
export async function activatePlan(
  userId: string,
  plan: User['plan'],
  durationDays = 30
): Promise<User> {
  const client = getSupabaseServerClient()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + durationDays)

  const credits = {
    free: 100,
    creator: 500,
    pro: 2000,
    agency: 5000,
    lifetime: 500,
  }[plan]

  const { data, error } = await client
    .from('users')
    .update({
      plan,
      plan_expires_at: plan === 'lifetime' ? null : expiresAt.toISOString(),
      ai_credits_remaining: credits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data as User
}

// ─── Course Progress ─────────────────────────────
export async function getUserCourseProgress(
  userId: string,
  courseId: string
): Promise<CourseProgress | null> {
  const client = getSupabaseBrowserClient()
  const { data, error } = await client
    .from('course_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) throw error
  return data as CourseProgress | null
}

export async function updateCourseProgress(
  userId: string,
  courseId: string,
  progressPercentage: number
): Promise<CourseProgress> {
  const client = getSupabaseBrowserClient()
  const { data, error } = await client
    .from('course_progress')
    .upsert({
      user_id: userId,
      course_id: courseId,
      progress_percentage: progressPercentage,
      last_accessed_at: new Date().toISOString(),
      ...(progressPercentage >= 100 ? { completed_at: new Date().toISOString() } : {}),
    })
    .select()
    .single()
  if (error) throw error
  return data as CourseProgress
}

// ─── Admin / Health Check ─────────────────────
export async function getCoursesNeedingReview(): Promise<Course[]> {
  const client = getSupabaseServerClient()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('active', true)
    .lt('last_reviewed_at', sixMonthsAgo.toISOString())
    .order('last_reviewed_at', { ascending: true })
  if (error) throw error
  return (data || []) as Course[]
}

export async function getBrokenCourses(): Promise<Course[]> {
  const client = getSupabaseServerClient()
  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('active', true)
    .eq('health_status', 'broken')
  if (error) throw error
  return (data || []) as Course[]
}

export async function updateCourseHealth(
  courseId: string,
  status: Course['health_status']
): Promise<void> {
  const client = getSupabaseServerClient()
  const { error } = await client
    .from('courses')
    .update({ health_status: status, last_reviewed_at: new Date().toISOString() })
    .eq('id', courseId)
  if (error) throw error
}
