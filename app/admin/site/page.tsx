'use client'

import { AdminSettingsForm } from '@/components/AdminSettingsForm'

export default function AdminSitePage() {
  return (
    <AdminSettingsForm
      title="Site & Branding"
      description="Edit site-wide content shown on the public site and emails"
      fields={[
        { key: 'site_name', label: 'Site name', type: 'text', placeholder: 'WatShop Academy' },
        { key: 'site_tagline', label: 'Tagline', type: 'text', placeholder: 'From learning to earning' },
        { key: 'support_email', label: 'Support email', type: 'email', placeholder: 'support@watshop.in' },
      ]}
    />
  )
}
