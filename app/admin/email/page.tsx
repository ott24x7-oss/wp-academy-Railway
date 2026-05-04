'use client'

import { AdminSettingsForm } from '@/components/AdminSettingsForm'

export default function AdminEmailPage() {
  return (
    <AdminSettingsForm
      title="Email / SMTP Setup"
      description="Configure Gmail SMTP or external PHPMailer endpoint for transactional emails (welcome, order confirmation, etc.)"
      fields={[
        {
          key: 'email_enabled',
          label: 'Enable email sending',
          type: 'toggle',
          description: 'Master switch for all outbound emails',
        },
        {
          key: 'smtp_email',
          label: 'Gmail address',
          type: 'email',
          placeholder: 'hello@yourdomain.com',
          description: 'Gmail account used to send emails',
        },
        {
          key: 'smtp_password',
          label: 'Gmail App Password',
          type: 'password',
          placeholder: 'xxxx xxxx xxxx xxxx',
          description: 'Generate at myaccount.google.com/apppasswords (requires 2FA)',
        },
        {
          key: 'smtp_from_name',
          label: 'From name',
          type: 'text',
          placeholder: 'WatShop Academy',
          description: 'Display name shown in sender field',
        },
        {
          key: 'php_mailer_url',
          label: 'PHP Mailer endpoint (optional)',
          type: 'text',
          placeholder: 'https://yourdomain.com/mailer/send.php',
          description: 'Optional external endpoint. Leave blank to use direct SMTP only.',
        },
      ]}
      testButton={{
        label: 'Send test email',
        onTest: async (values) => {
          const res = await fetch('/api/admin/email/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: values.smtp_email }),
          })
          const data = await res.json()
          return { ok: !!data.success, message: data.success ? `Sent to ${values.smtp_email}` : data.error }
        },
      }}
    />
  )
}
