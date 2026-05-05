/**
 * DB-first config helper.
 *
 * Reads from `admin_settings` table first; falls back to environment variables.
 * This allows admins to override env vars via the UI without redeploy.
 *
 * Admin settings table key naming convention: same as env var name.
 *   GEMINI_API_KEY, OPENROUTER_API_KEY, ANTHROPIC_API_KEY, AYRSHARE_API_KEY,
 *   ENCRYPTION_KEY, SMTP_HOST, SMTP_USER, ...
 */

import { getSupabaseServerClient } from './supabase'

// In-memory cache (60s TTL) to avoid hitting DB on every request
const cache = new Map<string, { value: string | null; ts: number }>()
const TTL_MS = 60_000

export async function getConfig(key: string): Promise<string | null> {
  // 1. Check cache
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.value
  }

  // 2. Read from DB
  let dbValue: string | null = null
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (data?.value && String(data.value).trim()) {
      dbValue = String(data.value).trim()
    }
  } catch {
    // ignore — supabase may not be configured
  }

  // 3. Fall back to env
  const value = dbValue ?? process.env[key] ?? null
  cache.set(key, { value, ts: Date.now() })
  return value
}

export async function getConfigBatch(keys: string[]): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {}
  await Promise.all(
    keys.map(async (k) => {
      out[k] = await getConfig(k)
    })
  )
  return out
}

export function clearConfigCache(key?: string) {
  if (key) cache.delete(key)
  else cache.clear()
}

/**
 * Returns whether a config key has any value (DB or env), without exposing the value itself.
 */
export async function isConfigured(key: string): Promise<boolean> {
  const v = await getConfig(key)
  return !!(v && v.length > 0)
}

/**
 * Mask sensitive value for display (show last 4 chars).
 */
export function maskSecret(value: string | null | undefined): string {
  if (!value) return ''
  if (value.length <= 8) return '•'.repeat(value.length)
  return '•'.repeat(value.length - 4) + value.slice(-4)
}

/**
 * Determine source of a config value for the admin UI.
 */
export async function getConfigSource(key: string): Promise<'db' | 'env' | 'none'> {
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (data?.value && String(data.value).trim()) return 'db'
  } catch {}
  if (process.env[key]) return 'env'
  return 'none'
}
