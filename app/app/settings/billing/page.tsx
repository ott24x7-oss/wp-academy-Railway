'use client'

import { useState } from 'react'
import { Check, CreditCard, Smartphone, Bitcoin, X, Loader2, Copy } from 'lucide-react'

const PLANS = [
  {
    id: 'creator',
    name: 'Creator',
    priceINR: 1499,
    priceUSDT: 19,
    period: 'month',
    features: ['Social posting', 'Analytics', '500 AI credits', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceINR: 3999,
    priceUSDT: 49,
    period: 'month',
    featured: true,
    features: ['Everything in Creator', 'Ad campaigns', 'Multi-workspace', '2000 AI credits', 'Priority support'],
  },
  {
    id: 'agency',
    name: 'Agency',
    priceINR: 11999,
    priceUSDT: 149,
    period: 'month',
    features: ['Everything in Pro', 'White-label', 'Client dashboards', '5000 AI credits', '24/7 support'],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    priceINR: 24999,
    priceUSDT: 299,
    period: 'one-time',
    features: ['All Pro features forever', 'All updates included', 'Lifetime support'],
  },
]

type PaymentMethod = 'upi' | 'binance' | 'btc' | 'ltc'

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyResult, setVerifyResult] = useState<string | null>(null)

  async function startPayment() {
    if (!selectedPlan) return
    setLoading(true)
    setVerifyResult(null)
    try {
      const baseAmount = paymentMethod === 'upi' ? selectedPlan.priceINR : selectedPlan.priceINR
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user-id', // TODO: from auth
          userEmail: 'demo@watshop.in',
          userName: 'Demo User',
          plan: selectedPlan.id,
          baseAmount,
          paymentMethod,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setPaymentData(data)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (e) {
      alert('Payment creation failed')
    } finally {
      setLoading(false)
    }
  }

  async function verifyPayment() {
    if (!paymentData?.orderId) return
    setVerifyLoading(true)
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: paymentData.orderId }),
      })
      const data = await response.json()
      if (data.verified) {
        setVerifyResult(`✅ Payment verified via ${data.method}! Plan activated.`)
      } else {
        setVerifyResult('⏳ Not yet found. Try again in 30s.')
      }
    } catch (e) {
      setVerifyResult('Verification request failed')
    } finally {
      setVerifyLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-2">Billing & Plans</h1>
      <p className="text-text-dim mb-8">Choose a plan and pay securely with UPI or Crypto</p>

      {/* Current Plan */}
      <div className="bg-bg-2 border border-line rounded-lg p-6 mb-8">
        <h2 className="font-serif text-xl font-bold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">Free</p>
            <p className="text-text-dim text-sm">Upgrade for full access</p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <h2 className="font-serif text-2xl font-bold mb-6">Choose Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className={`text-left p-6 rounded-lg border transition-all ${
              selectedPlan?.id === plan.id
                ? 'border-amber bg-bg-3'
                : plan.featured
                  ? 'border-amber/50 bg-bg-2 hover:bg-bg-3'
                  : 'border-line bg-bg-2 hover:bg-bg-3'
            }`}
          >
            {plan.featured && (
              <div className="text-xs bg-amber text-bg px-2 py-1 rounded inline-block mb-2">
                POPULAR
              </div>
            )}
            <h3 className="font-serif text-xl font-bold mb-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">₹{plan.priceINR}</span>
              <span className="text-text-dim text-sm">/{plan.period}</span>
              <p className="text-xs text-text-dim mt-1">or ${plan.priceUSDT} USDT</p>
            </div>
            <ul className="space-y-2 text-sm">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald flex-shrink-0 mt-0.5" />
                  <span className="text-text-dim">{f}</span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Payment Method Selection */}
      {selectedPlan && !paymentData && (
        <div className="bg-bg-2 border border-line rounded-lg p-6 mb-8">
          <h3 className="font-serif text-xl font-bold mb-4">Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'upi'
                  ? 'border-amber bg-amber/10'
                  : 'border-line bg-bg hover:border-line-2'
              }`}
            >
              <Smartphone className="w-6 h-6 mb-2 mx-auto text-emerald" />
              <p className="font-semibold text-sm">UPI</p>
              <p className="text-xs text-text-dim">India</p>
            </button>
            <button
              onClick={() => setPaymentMethod('binance')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'binance'
                  ? 'border-amber bg-amber/10'
                  : 'border-line bg-bg hover:border-line-2'
              }`}
            >
              <CreditCard className="w-6 h-6 mb-2 mx-auto text-amber" />
              <p className="font-semibold text-sm">Binance USDT</p>
              <p className="text-xs text-text-dim">Crypto</p>
            </button>
            <button
              onClick={() => setPaymentMethod('btc')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'btc'
                  ? 'border-amber bg-amber/10'
                  : 'border-line bg-bg hover:border-line-2'
              }`}
            >
              <Bitcoin className="w-6 h-6 mb-2 mx-auto text-amber" />
              <p className="font-semibold text-sm">Bitcoin</p>
              <p className="text-xs text-text-dim">BTC</p>
            </button>
            <button
              onClick={() => setPaymentMethod('ltc')}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === 'ltc'
                  ? 'border-amber bg-amber/10'
                  : 'border-line bg-bg hover:border-line-2'
              }`}
            >
              <Bitcoin className="w-6 h-6 mb-2 mx-auto text-violet" />
              <p className="font-semibold text-sm">Litecoin</p>
              <p className="text-xs text-text-dim">LTC</p>
            </button>
          </div>

          <button
            onClick={startPayment}
            disabled={loading}
            className="w-full px-6 py-3 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Pay ₹{selectedPlan.priceINR} for {selectedPlan.name}
          </button>
        </div>
      )}

      {/* Payment Instructions */}
      {paymentData && (
        <div className="bg-bg-2 border border-amber/30 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-xl font-bold">Complete Your Payment</h3>
              <p className="text-text-dim text-sm">Order: {paymentData.orderId}</p>
            </div>
            <button
              onClick={() => {
                setPaymentData(null)
                setSelectedPlan(null)
              }}
              className="p-2 hover:bg-bg-3 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-amber/10 border border-amber/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-text-dim mb-2">Pay this exact amount:</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-amber">
                {paymentData.currency === 'INR' ? '₹' : '$'}
                {paymentData.uniqueAmount}
                <span className="text-sm text-text-dim ml-2">{paymentData.currency}</span>
              </p>
              <button
                onClick={() => copyToClipboard(String(paymentData.uniqueAmount))}
                className="px-3 py-1 bg-amber text-bg rounded text-xs font-semibold hover:bg-amber/90"
              >
                <Copy className="w-3 h-3 inline mr-1" />
                Copy
              </button>
            </div>
            <p className="text-xs text-text-dim mt-2">
              ⚠️ Send EXACT amount including paise/decimals for auto-verification
            </p>
          </div>

          {paymentData.qrCode && (
            <div className="text-center mb-6">
              <p className="text-sm text-text-dim mb-3">Scan with any UPI app:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={paymentData.qrCode}
                alt="UPI QR Code"
                className="mx-auto bg-white p-2 rounded-lg"
              />
              <a
                href={paymentData.paymentLink}
                className="inline-block mt-3 px-4 py-2 bg-bg border border-line rounded-lg text-sm hover:bg-bg-3"
              >
                Open in UPI App
              </a>
            </div>
          )}

          {paymentData.address && (
            <div className="mb-6">
              <p className="text-sm text-text-dim mb-2">Send to address:</p>
              <div className="flex items-center gap-2 bg-bg p-3 rounded-lg border border-line">
                <code className="text-xs text-amber flex-1 break-all">{paymentData.address}</code>
                <button
                  onClick={() => copyToClipboard(paymentData.address)}
                  className="p-2 hover:bg-bg-3 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {paymentData.pollingEnabled && (
            <div className="bg-emerald/10 border border-emerald/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-emerald">
                ✅ Auto-verification enabled. We're watching for your payment email.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={verifyPayment}
              disabled={verifyLoading}
              className="flex-1 px-6 py-3 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {verifyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              I've Paid — Verify Now
            </button>
          </div>

          {verifyResult && (
            <div className="mt-4 p-4 bg-bg rounded-lg border border-line text-sm">
              {verifyResult}
            </div>
          )}

          <p className="text-xs text-text-dim mt-4 text-center">
            Expires: {new Date(paymentData.expiresAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}
