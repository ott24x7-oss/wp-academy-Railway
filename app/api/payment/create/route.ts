import { NextResponse, type NextRequest } from 'next/server'
import { createPayment, type PaymentMethod } from '@/lib/payment'
import { createOrder } from '@/lib/supabase'
import { sendOrderConfirmation } from '@/lib/mailer'
import { startPaymentPolling } from '@/lib/imap-verify'
import { updateOrderStatus, activatePlan } from '@/lib/supabase'

interface CreatePaymentRequest {
  userId: string
  userEmail: string
  userName: string
  plan: 'creator' | 'pro' | 'agency' | 'lifetime'
  baseAmount: number
  paymentMethod: PaymentMethod
}

const PLAN_DURATIONS: Record<string, number> = {
  creator: 30,
  pro: 30,
  agency: 30,
  lifetime: 36500, // ~100 years
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json()
    const { userId, userEmail, userName, plan, baseAmount, paymentMethod } = body

    if (!userId || !userEmail || !plan || !baseAmount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create payment via UPI/Binance
    const payment = await createPayment(paymentMethod, {
      orderId,
      baseAmount,
      currency: paymentMethod === 'upi' ? 'INR' : 'USDT',
      customerEmail: userEmail,
      description: `WatShop ${plan} Plan`,
    })

    // Save order to database
    try {
      await createOrder({
        order_id: orderId,
        user_id: userId,
        plan,
        amount: baseAmount,
        unique_amount: payment.uniqueAmount,
        currency: payment.currency,
        payment_method: (paymentMethod === 'usdt' ? 'binance' : paymentMethod) as any,
        payment_status: 'pending_verification',
        expires_at: payment.expiresAt,
      })
    } catch (dbErr) {
      console.warn('[payment] DB not configured, continuing:', (dbErr as Error).message)
    }

    // Send order confirmation email
    sendOrderConfirmation(userEmail, userName || 'Customer', orderId, plan, payment.uniqueAmount).catch(
      (e) => console.warn('[payment] Email failed:', e.message)
    )

    // Start IMAP polling for payment verification (if configured)
    const imapEmail = process.env.PAYMENT_IMAP_EMAIL
    const imapPassword = process.env.PAYMENT_IMAP_PASSWORD

    if (imapEmail && imapPassword) {
      startPaymentPolling({
        orderId,
        uniqueAmount: payment.uniqueAmount,
        config: { email: imapEmail, password: imapPassword },
        onVerified: async (result) => {
          console.log(`[payment] Order ${orderId} verified via IMAP`)
          try {
            await updateOrderStatus(orderId, 'verified', undefined, 'imap')
            const days = PLAN_DURATIONS[plan] || 30
            await activatePlan(userId, plan as any, days)
          } catch (e) {
            console.error('[payment] Activation failed:', (e as Error).message)
          }
        },
        onTimeout: async () => {
          console.log(`[payment] Order ${orderId} timed out`)
          try {
            await updateOrderStatus(orderId, 'cancelled')
          } catch (e) {
            console.warn('[payment] Cancel update failed:', (e as Error).message)
          }
        },
      })
    }

    return NextResponse.json({
      success: true,
      orderId,
      uniqueAmount: payment.uniqueAmount,
      currency: payment.currency,
      paymentLink: payment.paymentLink,
      qrCode: payment.qrCode,
      address: payment.address,
      expiresAt: payment.expiresAt,
      pollingEnabled: !!(imapEmail && imapPassword),
    })
  } catch (error) {
    const err = error as Error
    console.error('[payment] Create error:', err.message)
    return NextResponse.json({ error: err.message || 'Payment creation failed' }, { status: 500 })
  }
}
