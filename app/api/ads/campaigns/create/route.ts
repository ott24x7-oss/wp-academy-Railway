import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'

interface CreateCampaignRequest {
  workspaceId: string
  userId: string
  adAccountId: string
  platform: 'meta' | 'google' | 'linkedin' | 'tiktok'
  name: string
  budgetUsd: number
  startDate?: string
  endDate?: string
  objective?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCampaignRequest = await request.json()
    const { workspaceId, userId, adAccountId, platform, name, budgetUsd } = body

    if (!workspaceId || !userId || !adAccountId || !platform || !name || !budgetUsd) {
      return NextResponse.json(
        { error: 'workspaceId, userId, adAccountId, platform, name, budgetUsd required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    // Save campaign locally first
    const { data: localCampaign, error: dbError } = await supabase
      .from('ad_campaigns')
      .insert([
        {
          workspace_id: workspaceId,
          user_id: userId,
          ad_account_id: adAccountId,
          name,
          platform,
          status: 'active',
          budget_usd: budgetUsd,
          spent_usd: 0,
          started_at: body.startDate || new Date().toISOString(),
          ended_at: body.endDate || null,
        },
      ])
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // TODO: When platform tokens are stored, create actual campaign on each platform:
    // - Meta: facebook-business SDK → AdAccount.create_campaign()
    // - Google: google-ads-api → CampaignService.mutate
    // - LinkedIn: REST API
    // - TikTok: REST API

    return NextResponse.json({
      success: true,
      campaign: localCampaign,
      note: 'Campaign saved locally. Connect platform OAuth to sync to live ad platform.',
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*, ad_accounts(account_name, platform)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ campaigns: data || [] })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
