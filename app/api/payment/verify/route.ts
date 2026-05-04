import { NextResponse, type NextRequest } from 'next/server'
import { searchGmailForAmount } from '@/lib/imap-verify'
import { getOrderById, updateOrderStatus, activatePlan } from '@/lib/supabase'
import { sendPlanActivated } from '@/lib/mailer'

interface VerifyRequest {
  orderId: string
  txnId?: string
  manual?: boolean
}

const PLAN_DURATIONS: Record<string, number> = {
  creator: 30,
  pro: 30,
  agency: 30,
  lifetime: 36500,
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json()
    const { orderId, txnId, manual } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Fetch order
    let order
    try {
      order = await getOrderById(orderId)
    } catch (e) {
      return NextResponse.json({ error: 'Order lookup failed' }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status === 'verified') {
      return NextResponse.json({ verified: true, order, message: 'Already verified' })
    }

    // Manual verification path (admin enters TXN ID)
    if (manual && txnId) {
      await updateOrderStatus(orderId, 'verified', txnId, 'manual')
      const days = PLAN_DURATIONS[order.plan] || 30
      await activatePlan(order.user_id, order.plan as any, days)

      return NextResponse.json({
        verified: true,
        method: 'manual',
        message: 'Order manually verified',
      })
    }

    // IMAP verification path
    const imapEmail = process.env.PAYMENT_IMAP_EMAIL
    const imapPassword = process.env.PAYMENT_IMAP_PASSWORD

    if (!imapEmail || !imapPassword) {
      return NextResponse.json(
        { error: 'IMAP not configured. Use manual verification.' },
        { status: 503 }
      )
    }

    const result = await searchGmailForAmount(
      { email: imapEmail, password: imapPassword },
      order.unique_amount
    )

    if (result.verified) {
      await updateOrderStatus(orderId, 'verified', undefined, 'imap')
      const days = PLAN_DURATIONS[order.plan] || 30
      await activatePlan(order.user_id, order.plan as any, days)

      return NextResponse.json({
        verified: true,
        method: 'imap',
        message: 'Payment verified via Gmail',
        matchedEmail: result.matchedEmail,
      })
    }

    return NextResponse.json({
      verified: false,
      message: 'Payment not yet found in inbox. Try again in 30 seconds.',
    })
  } catch (error) {
    const err = error as Error
    console.error('[payment] Verify error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET endpoint to check status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  if (!orderId) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 })
  }

  try {
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json({
      orderId: order.order_id,
      status: order.payment_status,
      verified: order.payment_status === 'verified',
      uniqueAmount: order.unique_amount,
      currency: order.currency,
      expiresAt: order.expires_at,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
