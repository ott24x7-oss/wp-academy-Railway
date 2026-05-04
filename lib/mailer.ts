/**
 * Email Service — PHPMailer endpoint + Nodemailer (Gmail SMTP) fallback
 *
 * Adapted from store.whatsapp-Bot project (mailer.js)
 *
 * Settings (from env vars):
 *   SMTP_EMAIL       — Gmail address
 *   SMTP_PASSWORD    — Gmail App Password (not regular password)
 *   SMTP_FROM_NAME   — From name (e.g. "WatShop Academy")
 *   PHP_MAILER_URL   — Optional override for PHP mailer endpoint
 *   EMAIL_ENABLED    — '1' to enable, '0' to disable
 */

import https from 'https'
import http from 'http'
import nodemailer from 'nodemailer'

// Default platform-wide PHP mailer endpoint
const DEFAULT_PHP_MAILER = 'https://ott24x7.com/mailer/send.php'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  fromOverride?: { email: string; password: string; name: string }
}

function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED !== '0'
}

function getEmailConfig(override?: EmailOptions['fromOverride']) {
  if (override) return override
  return {
    email: process.env.SMTP_EMAIL || '',
    password: process.env.SMTP_PASSWORD || '',
    name: process.env.SMTP_FROM_NAME || 'WatShop Academy',
  }
}

/**
 * Send email via external PHP mailer endpoint
 * (lightweight, deployment-friendly approach using a PHP mailer script)
 */
function sendViaPhpMailer(url: string, payload: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'WatShop/1.0',
      },
      timeout: 20000,
    }

    const mod = parsed.protocol === 'https:' ? https : http
    const req = mod.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data))
          } catch {
            resolve({ success: true })
          }
        } else {
          reject(new Error(`PHP Mailer: ${res.statusCode} ${data.substring(0, 200)}`))
        }
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('PHP Mailer timeout'))
    })
    req.write(payload)
    req.end()
  })
}

/**
 * Send email via direct Nodemailer + Gmail SMTP
 */
async function sendViaSmtp(
  email: string,
  password: string,
  fromName: string,
  to: string,
  subject: string,
  html: string
): Promise<any> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: email, pass: password },
    connectionTimeout: 15000,
    socketTimeout: 20000,
    tls: { rejectUnauthorized: false },
  } as any)

  return Promise.race([
    transporter.sendMail({
      from: `"${fromName}" <${email}>`,
      to,
      subject,
      html,
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP timeout (15s)')), 15000)
    ),
  ])
}

/**
 * Send email — tries PHP mailer first, falls back to SMTP
 */
export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  if (!isEmailEnabled()) return false

  const config = getEmailConfig(opts.fromOverride)
  if (!config.email || !config.password) {
    console.error('[mailer] SMTP not configured')
    return false
  }

  const payload = JSON.stringify({
    smtp_email: config.email,
    smtp_password: config.password,
    from_name: config.name,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })

  const phpUrl = process.env.PHP_MAILER_URL || DEFAULT_PHP_MAILER

  try {
    await sendViaPhpMailer(phpUrl, payload)
    console.log(`[mailer] Email sent to ${opts.to} (PHP)`)
    return true
  } catch (e) {
    const err = e as Error
    console.warn(`[mailer] PHP mailer failed: ${err.message}, trying SMTP`)

    try {
      await sendViaSmtp(
        config.email,
        config.password,
        config.name,
        opts.to,
        opts.subject,
        opts.html
      )
      console.log(`[mailer] Email sent to ${opts.to} (SMTP)`)
      return true
    } catch (smtpErr) {
      const sErr = smtpErr as Error
      console.error(`[mailer] Email send failed: ${sErr.message}`)
      return false
    }
  }
}

// ─── Email Templates ─────────────────────────────────
const brandColor = '#fbbf24'

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:520px;margin:20px auto;background:#11111a;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06)">
<div style="background:#0a0a0f;padding:24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06)">
<h1 style="margin:0;color:#e8e8ee;font-size:22px;font-weight:600">WatShop <span style="color:${brandColor}">Academy</span></h1>
</div>
<div style="padding:32px 24px;color:#e8e8ee">
<h2 style="margin:0 0 16px;color:#e8e8ee;font-size:20px;font-weight:600">${title}</h2>
${body}
</div>
<div style="padding:16px 24px;background:#16171f;text-align:center;font-size:11px;color:#94959f;border-top:1px solid rgba(255,255,255,0.06)">
WatShop Academy &copy; ${new Date().getFullYear()} &middot; From learning to earning
</div>
</div>
</body>
</html>`
}

const cta = (text: string, link: string) =>
  `<a href="${link}" style="display:inline-block;padding:12px 28px;background:${brandColor};color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:700;margin-top:12px">${text}</a>`

// ─── Pre-built Email Templates ───────────────────────

export async function sendTestEmail(to?: string): Promise<{ success: boolean; error?: string }> {
  const config = getEmailConfig()
  if (!config.email) return { success: false, error: 'SMTP email not configured' }
  if (!config.password) return { success: false, error: 'App password not configured' }

  const recipient = to || config.email
  const html = wrap(
    'Email Test Successful!',
    `<p style="color:#94959f;line-height:1.6">Your email configuration is working correctly.</p>
    <div style="background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);border-radius:8px;padding:16px;text-align:center;margin:16px 0">
      <p style="margin:0;color:#34d399;font-weight:700;font-size:16px">✅ Email Working</p>
    </div>
    <div style="background:#16171f;border-radius:8px;padding:12px;margin:12px 0;font-size:13px;color:#94959f">
      <p style="margin:4px 0"><strong>From:</strong> ${config.name} &lt;${config.email}&gt;</p>
      <p style="margin:4px 0"><strong>Time:</strong> ${new Date().toISOString()}</p>
    </div>`
  )

  const success = await sendEmail({
    to: recipient,
    subject: '✅ WatShop Academy — Email Test',
    html,
  })

  return success ? { success: true } : { success: false, error: 'Send failed' }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Welcome to WatShop Academy!',
    html: wrap(
      `Welcome, ${name}!`,
      `<p style="color:#94959f;line-height:1.6">Thanks for signing up! Your account is ready.</p>
      <p style="color:#94959f;line-height:1.6">You can now:</p>
      <ul style="color:#94959f;line-height:1.8">
        <li>Access curated marketing courses (Hindi & English)</li>
        <li>Schedule social media posts across 5 platforms</li>
        <li>Manage ad campaigns from one dashboard</li>
        <li>Get AI-powered marketing assistance</li>
      </ul>
      ${cta('Go to Dashboard', '/app/dashboard')}`
    ),
  })
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetCode: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Reset Your Password — WatShop Academy',
    html: wrap(
      'Password Reset',
      `<p style="color:#94959f;line-height:1.6">Hi ${name}, you requested a password reset.</p>
      <p style="color:#94959f;line-height:1.6">Your reset code is:</p>
      <div style="background:#16171f;border:2px solid ${brandColor};border-radius:10px;padding:20px;text-align:center;margin:16px 0">
        <span style="font-size:32px;font-weight:800;letter-spacing:6px;font-family:monospace;color:#e8e8ee">${resetCode}</span>
      </div>
      <p style="color:#94959f;line-height:1.6">Enter this code on the reset page. Expires in 15 minutes.</p>
      <p style="color:#94959f;font-size:12px;margin-top:20px">If you didn't request this, ignore this email.</p>`
    ),
  })
}

export async function sendOrderConfirmation(
  email: string,
  name: string,
  orderId: string,
  planName: string,
  amount: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Order Confirmed — ${orderId}`,
    html: wrap(
      'Order Confirmed!',
      `<p style="color:#94959f;line-height:1.6">Hi ${name}, your order has been placed.</p>
      <div style="background:#16171f;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0;color:#94959f"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin:4px 0;color:#94959f"><strong>Plan:</strong> ${planName}</p>
        <p style="margin:4px 0;color:#94959f"><strong>Amount:</strong> ₹${amount}</p>
      </div>
      <p style="color:#94959f;line-height:1.6">We're verifying your payment. You'll get access shortly.</p>`
    ),
  })
}

export async function sendPlanActivated(
  email: string,
  name: string,
  planName: string,
  amount: string,
  orderId: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `${planName} Plan Activated — ${orderId}`,
    html: wrap(
      `${planName} Plan Activated!`,
      `<p style="color:#94959f;line-height:1.6">Hi ${name}, your <strong>${planName}</strong> plan is now active!</p>
      <div style="background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);border-radius:8px;padding:16px;margin:16px 0;text-align:center">
        <p style="margin:0;color:#34d399;font-weight:700;font-size:18px">🎉 ${planName} Plan Active</p>
      </div>
      <div style="background:#16171f;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0;color:#94959f"><strong>Plan:</strong> ${planName}</p>
        <p style="margin:4px 0;color:#94959f"><strong>Amount:</strong> ${amount}</p>
        <p style="margin:4px 0;color:#94959f"><strong>Order ID:</strong> ${orderId}</p>
      </div>
      ${cta('Go to Dashboard', '/app/dashboard')}`
    ),
  })
}

export async function sendPlanExpiringEmail(
  email: string,
  name: string,
  planName: string,
  expiryDate: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Your Plan Expires Soon',
    html: wrap(
      'Plan Expiring Soon',
      `<p style="color:#94959f;line-height:1.6">Hi ${name}, your <strong>${planName}</strong> plan expires on <strong>${expiryDate}</strong>.</p>
      <p style="color:#94959f;line-height:1.6">Renew now to keep all features active.</p>
      ${cta('Renew Plan', '/app/settings/billing')}
      <p style="color:#94959f;font-size:12px;margin-top:20px">If you've already renewed, please ignore this email.</p>`
    ),
  })
}

export async function sendCertificateEmail(
  email: string,
  name: string,
  courseName: string,
  certificateUrl: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Congratulations! You've completed ${courseName}`,
    html: wrap(
      `Course Completed!`,
      `<p style="color:#94959f;line-height:1.6">Hi ${name}, congratulations on completing <strong>${courseName}</strong>!</p>
      <div style="background:rgba(245,193,74,0.1);border:1px solid rgba(245,193,74,0.3);border-radius:8px;padding:16px;margin:16px 0;text-align:center">
        <p style="margin:0;color:#f5c14a;font-weight:700;font-size:18px">🏆 Certificate Earned</p>
      </div>
      <p style="color:#94959f;line-height:1.6">Your certificate is ready to download.</p>
      ${cta('Download Certificate', certificateUrl)}`
    ),
  })
}
