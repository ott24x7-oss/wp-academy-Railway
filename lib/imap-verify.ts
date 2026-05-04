/**
 * Gmail IMAP Payment Verification
 * Polls Gmail inbox for payment confirmation emails matching unique amount
 *
 * Adapted from store.whatsapp-Bot project (paytm.js)
 *
 * Flow:
 * 1. After payment request created with unique amount (e.g. ₹149.37)
 * 2. Poll user's Gmail every 15s for payment emails containing that amount
 * 3. Match keywords: "paytm", "binance", "credited", "received", "deposit", "p2p"
 * 4. When matched → mark order as verified
 */

// @ts-ignore - imap doesn't have great types
import Imap from 'imap'

export interface ImapConfig {
  email: string
  password: string // Gmail App Password
  host?: string
  port?: number
}

export interface VerificationResult {
  verified: boolean
  matchedEmail?: {
    subject: string
    from: string
    date: Date
  }
  error?: string
}

const PAYMENT_KEYWORDS = [
  'paytm',
  'payment received',
  'binance',
  'p2p',
  'transfer',
  'credited',
  'received',
  'deposit',
  'deposit successful',
  'phonepe',
  'gpay',
  'google pay',
  'upi',
  'transaction successful',
]

/**
 * Check Gmail INBOX for emails containing the specified amount
 * Returns true if a matching payment confirmation email is found
 */
export function searchGmailForAmount(
  config: ImapConfig,
  amount: number
): Promise<VerificationResult> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: config.email,
      password: config.password,
      host: config.host || 'imap.gmail.com',
      port: config.port || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 10000,
    })

    let resolved = false
    const done = (result: VerificationResult) => {
      if (!resolved) {
        resolved = true
        resolve(result)
        try {
          imap.end()
        } catch {}
      }
    }

    setTimeout(() => done({ verified: false, error: 'IMAP timeout' }), 12000)

    imap.once('error', (err: Error) =>
      done({ verified: false, error: err.message })
    )

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err: Error | null) => {
        if (err) return done({ verified: false, error: err.message })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const amountStr = amount.toFixed(2)

        imap.search(
          [['SINCE', today], ['TEXT', amountStr]],
          (searchErr: Error | null, results: number[]) => {
            if (searchErr || !results || results.length === 0) {
              imap.search(
                [['SINCE', today], ['TEXT', String(amount)]],
                (e2: Error | null, r2: number[]) => {
                  if (e2 || !r2 || r2.length === 0)
                    return done({ verified: false })
                  checkEmails(imap, r2, amount, done)
                }
              )
              return
            }
            checkEmails(imap, results, amount, done)
          }
        )
      })
    })

    imap.connect()
  })
}

function checkEmails(
  imap: any,
  results: number[],
  amount: number,
  done: (result: VerificationResult) => void
) {
  const toCheck = results.slice(-5) // Last 5 matches
  let found = false

  const f = imap.fetch(toCheck, { bodies: '' })

  let messageMeta = { subject: '', from: '', date: new Date() }

  f.on('message', (msg: any) => {
    let body = ''

    msg.on('body', (stream: any) => {
      stream.on('data', (chunk: Buffer) => {
        body += chunk.toString('utf8')
      })
      stream.once('end', () => {
        if (found) return

        const bodyLower = body.toLowerCase()
        const isPayment = PAYMENT_KEYWORDS.some((kw) => bodyLower.includes(kw))
        if (!isPayment) return

        // Match amount in various formats
        const amountStr = amount.toFixed(2)
        const amountStr4 = amount.toFixed(4)
        const amountPlain = String(amount)
        const patterns = [
          amountStr,
          '>' + amountStr + '<',
          '>' + amountStr,
          '₹ ' + amountStr,
          '₹' + amountStr,
          'Rs.' + amountStr,
          'Rs. ' + amountStr,
          amountPlain,
          '>' + amountPlain + '<',
          amountStr4,
          'of ' + amountStr4,
          'of ' + amountStr,
          'of ' + amountPlain,
          '>' + amountStr4 + '<',
          '>' + amountStr4,
          '>' + amountPlain + ' ',
          ' ' + amountPlain + ' ',
          '>' + amountPlain,
        ]

        const matched = patterns.some((p) => body.includes(p))
        if (matched) {
          found = true
          // Try to extract subject and from
          const subjectMatch = body.match(/Subject:\s*(.+)/i)
          const fromMatch = body.match(/From:\s*(.+)/i)
          messageMeta = {
            subject: subjectMatch ? subjectMatch[1].trim() : 'Payment',
            from: fromMatch ? fromMatch[1].trim() : 'unknown',
            date: new Date(),
          }
        }
      })
    })
  })

  f.once('end', () => {
    if (found) {
      done({ verified: true, matchedEmail: messageMeta })
    } else {
      done({ verified: false })
    }
  })

  f.once('error', (err: Error) => {
    done({ verified: false, error: err.message })
  })
}

/**
 * Active payment pollers (orderId → interval ID)
 */
const activePollers = new Map<string, NodeJS.Timeout>()

/**
 * Start polling Gmail for payment confirmation
 *
 * @param orderId - Unique order ID
 * @param uniqueAmount - The unique amount to match in Gmail
 * @param config - IMAP credentials
 * @param onVerified - Callback when payment verified
 * @param onTimeout - Callback when timeout reached (default 5 minutes)
 */
export function startPaymentPolling({
  orderId,
  uniqueAmount,
  config,
  onVerified,
  onTimeout,
  intervalMs = 15000,
  maxChecks = 20,
}: {
  orderId: string
  uniqueAmount: number
  config: ImapConfig
  onVerified: (result: VerificationResult) => void | Promise<void>
  onTimeout?: () => void | Promise<void>
  intervalMs?: number
  maxChecks?: number
}) {
  if (activePollers.has(orderId)) {
    console.log(`[IMAP] Already polling for ${orderId}`)
    return
  }

  console.log(`[IMAP] Starting poll for ₹${uniqueAmount} (Order: ${orderId})`)

  let checkCount = 0

  const poller = setInterval(async () => {
    checkCount++

    if (checkCount > maxChecks) {
      console.log(`[IMAP] Timeout for ${orderId}`)
      stopPaymentPolling(orderId)
      if (onTimeout) await onTimeout()
      return
    }

    try {
      const result = await searchGmailForAmount(config, uniqueAmount)
      if (result.verified) {
        console.log(`[IMAP] ✅ Payment verified for ${orderId}`)
        stopPaymentPolling(orderId)
        await onVerified(result)
      }
    } catch (err) {
      console.error(`[IMAP] Error checking ${orderId}:`, err)
    }
  }, intervalMs)

  activePollers.set(orderId, poller)
}

/**
 * Stop polling for a specific order
 */
export function stopPaymentPolling(orderId: string): boolean {
  const poller = activePollers.get(orderId)
  if (poller) {
    clearInterval(poller)
    activePollers.delete(orderId)
    return true
  }
  return false
}

/**
 * Stop all active pollers (for shutdown)
 */
export function stopAllPolling(): number {
  let count = 0
  for (const [orderId, poller] of activePollers.entries()) {
    clearInterval(poller)
    activePollers.delete(orderId)
    count++
  }
  return count
}

/**
 * Get list of active polling order IDs
 */
export function getActivePollers(): string[] {
  return Array.from(activePollers.keys())
}
