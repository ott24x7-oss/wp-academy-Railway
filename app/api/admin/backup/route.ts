import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin, logAdminAction } from '@/lib/admin'
import { getSupabaseServerClient } from '@/lib/supabase'

const EXPORTABLE_TABLES = [
  'users',
  'workspaces',
  'courses',
  'orders',
  'posts',
  'social_accounts',
  'admin_settings',
  'pricing_plans',
  'payment_methods',
  'site_content',
  'feature_flags',
  'email_templates',
  'ai_daily_jobs',
] as const

// GET /api/admin/backup?tables=users,courses
// Returns JSON dump of selected tables (or all if no param)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const requested = searchParams.get('tables')?.split(',').filter(Boolean)
    const tables = requested?.length
      ? EXPORTABLE_TABLES.filter((t) => requested.includes(t))
      : EXPORTABLE_TABLES

    const supabase = getSupabaseServerClient()
    const dump: Record<string, any[]> = {}

    for (const t of tables) {
      const { data, error } = await supabase.from(t).select('*')
      if (error) {
        dump[t] = [{ __error: error.message }]
      } else {
        // Strip access_token from social_accounts and admin_settings (sensitive)
        if (t === 'social_accounts' || t === 'admin_settings') {
          dump[t] = (data || []).map((r: any) => {
            const out: any = { ...r }
            if (out.access_token) out.access_token = '***REDACTED***'
            if (out.value && (r as any).is_secret) out.value = '***REDACTED***'
            return out
          })
        } else {
          dump[t] = data || []
        }
      }
    }

    await logAdminAction(user.id, 'export_backup', undefined, undefined, {
      tables,
      rowCount: Object.values(dump).reduce((s, rows) => s + rows.length, 0),
    })

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    return new NextResponse(
      JSON.stringify({ exportedAt: new Date().toISOString(), tables: dump }, null, 2),
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="watshop-backup-${stamp}.json"`,
        },
      }
    )
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// HEAD-style endpoint: just return list of exportable tables + row counts
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = getSupabaseServerClient()
    const counts: Record<string, number> = {}

    await Promise.all(
      EXPORTABLE_TABLES.map(async (t) => {
        const { count } = await supabase.from(t).select('*', { count: 'exact', head: true })
        counts[t] = count || 0
      })
    )

    return NextResponse.json({ tables: counts })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
