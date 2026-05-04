import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { requireAdmin, getAllSettings } from '@/lib/admin'
import { sendEmail } from '@/lib/mailer'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { isAdmin } = await requireAdmin(user.id)
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { to } = (await request.json()) as { to: string }
    if (!to) return NextResponse.json({ error: 'to required' }, { status: 400 })

    const settings = await getAllSettings()
    const smtpEmail = settings.smtp_email?.value
    const smtpPassword = settings.smtp_password?.value
    const fromName = settings.smtp_from_name?.value || 'WatShop Academy'

    if (!smtpEmail || !smtpPassword) {
      return NextResponse.json(
        { error: 'Save SMTP email and password first' },
        { status: 400 }
      )
    }

    const success = await sendEmail({
      to,
      subject: '✅ WatShop Admin — Test email',
      html: `<p>This is a test from your Super Admin panel.</p><p>From: ${fromName} &lt;${smtpEmail}&gt;</p><p>Time: ${new Date().toISOString()}</p>`,
      fromOverride: { email: smtpEmail, password: smtpPassword, name: fromName },
    })

    if (success) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Send failed (check Gmail App Password & 2FA)' }, { status: 500 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
