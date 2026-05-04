'use client'

import { AdminSettingsForm } from '@/components/AdminSettingsForm'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminSettingsForm
        title="AI / Anthropic"
        description="Claude AI configuration for the in-app assistant"
        fields={[
          {
            key: 'anthropic_api_key',
            label: 'Anthropic API key',
            type: 'password',
            placeholder: 'sk-ant-...',
            description: 'Get from console.anthropic.com',
          },
          {
            key: 'anthropic_model',
            label: 'Model',
            type: 'text',
            placeholder: 'claude-haiku-4-5-20251001',
          },
        ]}
      />

      <AdminSettingsForm
        title="Social Posting / Ayrshare"
        description="One API key for posting to all social platforms"
        fields={[
          {
            key: 'ayrshare_api_key',
            label: 'Ayrshare API key',
            type: 'password',
            placeholder: 'AYR-XXXX',
            description: 'Get free at ayrshare.com',
          },
        ]}
      />
    </div>
  )
}
