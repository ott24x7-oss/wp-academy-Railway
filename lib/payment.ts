/**
 * Payment Integration: UPI + Binance + Gmail IMAP Verification
 * Adapted from store.whatsapp-Bot project
 *
 * Flow:
 * 1. User selects plan → generate unique amount (e.g. ₹149.37)
 * 2. Show UPI link/QR or Binance address with exact amount
 * 3. Start IMAP polling for payment confirmation email
 * 4. When matching email arrives → auto-verify → activate plan
 */

import https from 'https'

export type PaymentMethod = 'upi' | 'binance' | 'usdt' | 'btc' | 'ltc'
export type Currency = 'INR' | 'USDT' | 'BTC' | 'LTC'

export interface PaymentRequest {
  orderId: string
  baseAmount: number
  currency: Currency
  customerEmail?: string
  customerPhone?: string
  description?: string
}

export interface PaymentResponse {
  orderId: string
  uniqueAmount: number
  paymentLink: string
  qrCode?: string
  address?: string
  currency: Currency
  expiresAt: string
}

// ─── Currency Conversion (cached 10 min) ────────────
let _rateCache: { data: { inrPerUsd: number; ltcPerUsd: number; btcPerUsd: number } | null; ts: number } = {
  data: null,
  ts: 0,
}

function httpsGetJson(url: string): Promise<any> {
  return new Promise((resolve) => {
    const parsed = new URL(url)
    const req = https.get(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        timeout: 10000,
        headers: { 'User-Agent': 'WatShop/1.0', Accept: 'application/json' },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch {
            resolve(null)
          }
        })
      }
    )
    req.on('error', () => resolve(null))
    req.on('timeout', () => {
      req.destroy()
      resolve(null)
    })
  })
}

export async function fetchExchangeRates(): Promise<{
  inrPerUsd: number
  ltcPerUsd: number
  btcPerUsd: number
}> {
  if (_rateCache.data && Date.now() - _rateCache.ts < 600000) return _rateCache.data

  let inrPerUsd = 85
  let ltcPerUsd = 0
  let btcPerUsd = 0

  const [usdData, cryptoData] = await Promise.all([
    httpsGetJson('https://open.er-api.com/v6/latest/USD'),
    httpsGetJson(
      'https://api.coingecko.com/api/v3/simple/price?ids=litecoin,bitcoin&vs_currencies=usd'
    ),
  ])

  if (usdData?.rates?.INR) inrPerUsd = usdData.rates.INR
  if (cryptoData?.litecoin?.usd) ltcPerUsd = cryptoData.litecoin.usd
  if (cryptoData?.bitcoin?.usd) btcPerUsd = cryptoData.bitcoin.usd

  const result = { inrPerUsd, ltcPerUsd, btcPerUsd }
  _rateCache = { data: result, ts: Date.now() }
  return result
}

export async function convertInrTo(
  amountInr: number,
  targetCurrency: Currency
): Promise<{ amount: number; symbol: string; currency: Currency }> {
  const rates = await fetchExchangeRates()
  const usdAmount = amountInr / rates.inrPerUsd

  switch (targetCurrency) {
    case 'USDT':
      return { amount: +usdAmount.toFixed(2), symbol: '$', currency: 'USDT' }
    case 'LTC':
      return rates.ltcPerUsd > 0
        ? { amount: +(usdAmount / rates.ltcPerUsd).toFixed(6), symbol: '', currency: 'LTC' }
        : { amount: +usdAmount.toFixed(2), symbol: '$', currency: 'USDT' }
    case 'BTC':
      return rates.btcPerUsd > 0
        ? { amount: +(usdAmount / rates.btcPerUsd).toFixed(8), symbol: '', currency: 'BTC' }
        : { amount: +usdAmount.toFixed(2), symbol: '$', currency: 'USDT' }
    default:
      return { amount: amountInr, symbol: '₹', currency: 'INR' }
  }
}

// ─── Generate Unique Amount (for IMAP matching) ────────────
export function generateUniqueAmount(
  baseAmount: number,
  gateway: 'upi' | 'binance' | 'crypto' = 'upi'
): number {
  const isCrypto = gateway === 'crypto'
  const minPaise = gateway === 'binance' ? 2 : gateway === 'crypto' ? 1 : 1
  const maxPaise = gateway === 'binance' ? 10 : gateway === 'crypto' ? 99 : 99
  const divisor = isCrypto ? 10000 : 100
  const precision = isCrypto ? 10000 : 100

  const paise = Math.floor(Math.random() * (maxPaise - minPaise + 1)) + minPaise
  const uniqueAmount = baseAmount + paise / divisor
  return Math.round(uniqueAmount * precision) / precision
}

// ─── Generate UPI Payment Link ───────────────
export function generateUpiLink(
  upiId: string,
  amount: number,
  orderId: string,
  payeeName = 'WatShop Academy'
): string {
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount}&tn=${orderId}&cu=INR`
}

// ─── Generate UPI QR Code URL (uses external QR service) ───
export function generateUpiQrCode(upiLink: string): string {
  const encoded = encodeURIComponent(upiLink)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`
}

// ─── Create UPI Payment Request ───────────────
export async function createUpiPayment(req: PaymentRequest): Promise<PaymentResponse> {
  const upiId = process.env.UPI_ID
  if (!upiId) throw new Error('UPI_ID not configured in environment')

  const uniqueAmount = generateUniqueAmount(req.baseAmount, 'upi')
  const upiLink = generateUpiLink(upiId, uniqueAmount, req.orderId, 'WatShop Academy')
  const qrCode = generateUpiQrCode(upiLink)

  // Expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  return {
    orderId: req.orderId,
    uniqueAmount,
    paymentLink: upiLink,
    qrCode,
    currency: 'INR',
    expiresAt,
  }
}

// ─── Create Binance USDT Payment Request ───────────────
export async function createBinancePayment(
  req: PaymentRequest
): Promise<PaymentResponse> {
  const binanceAddress = process.env.BINANCE_USDT_ADDRESS
  if (!binanceAddress) throw new Error('BINANCE_USDT_ADDRESS not configured')

  // Convert INR to USDT
  const converted = await convertInrTo(req.baseAmount, 'USDT')
  const uniqueAmount = generateUniqueAmount(converted.amount, 'binance')

  // Expires in 30 minutes for crypto
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  return {
    orderId: req.orderId,
    uniqueAmount,
    paymentLink: `binance://pay?address=${binanceAddress}&amount=${uniqueAmount}`,
    address: binanceAddress,
    currency: 'USDT',
    expiresAt,
  }
}

// ─── Create Crypto Payment (LTC/BTC) ───────────────
export async function createCryptoPayment(
  req: PaymentRequest,
  cryptoType: 'BTC' | 'LTC' = 'LTC'
): Promise<PaymentResponse> {
  const address =
    cryptoType === 'BTC' ? process.env.BTC_ADDRESS : process.env.LTC_ADDRESS
  if (!address) throw new Error(`${cryptoType}_ADDRESS not configured`)

  const converted = await convertInrTo(req.baseAmount, cryptoType)
  const uniqueAmount = generateUniqueAmount(converted.amount, 'crypto')

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  return {
    orderId: req.orderId,
    uniqueAmount,
    paymentLink: `${cryptoType.toLowerCase()}:${address}?amount=${uniqueAmount}`,
    address,
    currency: cryptoType,
    expiresAt,
  }
}

// ─── Unified Payment Gateway ───────────────
export async function createPayment(
  method: PaymentMethod,
  req: PaymentRequest
): Promise<PaymentResponse> {
  switch (method) {
    case 'upi':
      return createUpiPayment(req)
    case 'binance':
    case 'usdt':
      return createBinancePayment(req)
    case 'btc':
      return createCryptoPayment(req, 'BTC')
    case 'ltc':
      return createCryptoPayment(req, 'LTC')
    default:
      throw new Error(`Unsupported payment method: ${method}`)
  }
}
