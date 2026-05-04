import { getSupabaseServerClient } from './supabase'

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || 'ensofter@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function requireAdmin(userId: string): Promise<{
  isAdmin: boolean
  user?: { id: string; email: string; role: string; name?: string }
  error?: string
}> {
  if (!userId) return { isAdmin: false, error: 'Not authenticated' }

  try {
    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, name')
      .eq('id', userId)
      .maybeSingle()

    if (error || !user) return { isAdmin: false, error: 'User not found' }

    const isAdmin = user.role === 'admin' || isSuperAdminEmail(user.email)
    return { isAdmin, user }
  } catch (e) {
    return { isAdmin: false, error: (e as Error).message }
  }
}

/**
 * Promote a user to admin (called when super admin email signs up).
 */
export async function ensureSuperAdmin(userId: string, email: string): Promise<void> {
  if (!isSuperAdminEmail(email)) return
  const supabase = getSupabaseServerClient()
  await supabase.from('users').update({ role: 'admin' }).eq('id', userId)
}

/**
 * Get all admin settings as a key-value object.
 */
export async function getAllSettings(): Promise<Record<string, { value: string; category: string; is_secret: boolean }>> {
  const supabase = getSupabaseServerClient()
  const { data } = await supabase.from('admin_settings').select('*')
  const result: Record<string, any> = {}
  for (const row of data || []) {
    result[row.key] = { value: row.value, category: row.category, is_secret: row.is_secret }
  }
  return result
}

export async function updateSetting(key: string, value: string, updatedBy?: string): Promise<void> {
  const supabase = getSupabaseServerClient()
  await supabase
    .from('admin_settings')
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: updatedBy })
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: any
): Promise<void> {
  const supabase = getSupabaseServerClient()
  await supabase.from('admin_activity').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  })
}
