import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WatShop Academy',
  description: 'From learning to earning, all in one panel. Master digital marketing, ads, social media, and AI tools.',
  keywords: [
    'digital marketing',
    'online courses',
    'social media marketing',
    'Google Ads',
    'Meta Ads',
    'AI marketing',
    'content creation',
  ],
  creator: 'WatShop',
  openGraph: {
    title: 'WatShop Academy',
    description: 'From learning to earning, all in one panel.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WatShop Academy',
    description: 'From learning to earning, all in one panel.',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased bg-bg text-text">{children}</body>
    </html>
  )
}
