'use client'

import { useEffect, useState } from 'react'
import { AdminSettingsForm } from '@/components/AdminSettingsForm'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'
import { CheckCircle2, Clock, X, IndianRupee } from 'lucide-react'

interface Order {
  id: string
  order_id: string
  user_id: string
  plan: string
  amount: number
  unique_amount: number
  currency: string
  payment_method: string
  payment_status: string
  created_at: string
}

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<'config' | 'orders'>('config')
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    if (tab === 'orders') loadOrders()
  }, [tab])

  async function loadOrders() {
    if (!isSupabaseConfigured()) return
    setLoadingOrders(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      setOrders((data as Order[]) || [])
    } finally {
      setLoadingOrders(false)
    }
  }

  async function verifyOrder(orderId: string) {
    const txn = prompt('Enter transaction ID for manual verification:')
    if (!txn) return
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, txnId: txn, manual: true }),
    })
    const data = await res.json()
    alert(data.message || data.error)
    loadOrders()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Payments</h1>
        <p className="text-text-dim text-sm">
          Configure UPI/Crypto methods and review subscription orders
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-bg-2 border border-line rounded-2xl p-1 inline-flex gap-1">
        <button
          onClick={() => setTab('config')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            tab === 'config' ? 'bg-amber text-bg' : 'text-text-dim'
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            tab === 'orders' ? 'bg-amber text-bg' : 'text-text-dim'
          }`}
        >
          Orders ({orders.length || 0})
        </button>
      </div>

      {tab === 'config' && (
        <div className="space-y-5">
          <AdminSettingsForm
            title="Payment receiving"
            description="Where customers send payments. Each method generates unique amount for IMAP auto-verify."
            fields={[
              { key: 'upi_id', label: 'UPI ID', type: 'text', placeholder: 'yourname@paytm' },
              {
                key: 'binance_address',
                label: 'Binance USDT (TRC20) address',
                type: 'text',
                placeholder: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
              },
              {
                key: 'btc_address',
                label: 'Bitcoin address',
                type: 'text',
                placeholder: 'bc1q...',
              },
              {
                key: 'ltc_address',
                label: 'Litecoin address',
                type: 'text',
                placeholder: 'ltc1q...',
              },
            ]}
          />

          <AdminSettingsForm
            title="IMAP auto-verification"
            description="Watches a Gmail inbox for payment confirmation emails matching the unique amount and auto-activates plan."
            fields={[
              {
                key: 'payment_imap_email',
                label: 'IMAP Gmail address',
                type: 'email',
                placeholder: 'payments@yourdomain.com',
                description: 'Gmail to watch for Paytm/Binance receipt emails',
              },
              {
                key: 'payment_imap_password',
                label: 'Gmail App Password',
                type: 'password',
                placeholder: 'xxxx xxxx xxxx xxxx',
                description: 'Different from your account password — generate at myaccount.google.com/apppasswords',
              },
            ]}
          />
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {loadingOrders ? (
            <p className="text-text-dim text-sm">Loading…</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-bg-2 border border-line rounded-2xl">
              <IndianRupee className="w-12 h-12 text-text-dim mx-auto mb-3" />
              <p className="text-text-dim">No orders yet</p>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-bg-2 border border-line rounded-2xl p-4 flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    o.payment_status === 'verified'
                      ? 'bg-emerald/15 text-emerald'
                      : o.payment_status === 'pending_verification'
                        ? 'bg-amber/15 text-amber'
                        : 'bg-rose/15 text-rose'
                  }`}
                >
                  {o.payment_status === 'verified' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : o.payment_status === 'pending_verification' ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{o.order_id}</p>
                  <p className="text-xs text-text-dim">
                    {o.plan} · {o.payment_method.toUpperCase()} · {o.currency}{' '}
                    {o.unique_amount} · {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                {o.payment_status === 'pending_verification' && (
                  <button
                    onClick={() => verifyOrder(o.order_id)}
                    className="px-3 py-1.5 text-xs bg-amber text-bg rounded-lg font-semibold"
                  >
                    Verify
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
