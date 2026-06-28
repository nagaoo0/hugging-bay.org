import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    template: '%s | Hugging-Bay',
    default: 'Hugging-Bay — Open AI Model Registry',
  },
  description: 'Open, decentralized registry and distribution platform for AI models via BitTorrent.',
  keywords: ['AI models', 'machine learning', 'open source', 'BitTorrent', 'decentralized'],
  openGraph: {
    type: 'website',
    title: 'Hugging-Bay',
    description: 'Open, decentralized AI model registry',
    siteName: 'Hugging-Bay',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: '#07070c' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
