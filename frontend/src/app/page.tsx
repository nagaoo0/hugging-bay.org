import Link from 'next/link'
import { latestModels, popularModels } from '@/lib/api'
import ModelCard from '@/components/ModelCard'
import { Search, Shield, Globe, Download } from 'lucide-react'
import type { Model } from '@/lib/types'

async function getData() {
  try {
    const [latest, popular] = await Promise.all([
      latestModels(8),
      popularModels(8),
    ])
    return { latest: latest || [], popular: popular || [] }
  } catch {
    return { latest: [], popular: [] }
  }
}

export default async function HomePage() {
  const { latest, popular } = await getData()

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.18) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.3)' }}>
            <span>⚓</span> Decentralized · Verified · Open
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5">
            <span className="gradient-text">Open AI Model Registry</span>
          </h1>
          <p className="text-lg mb-8" style={{ color: 'var(--hb-muted)' }}>
            Discover, share, and preserve freely redistributable AI models via BitTorrent.
            No single point of failure. No gatekeepers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/models" className="btn-primary text-base px-6 py-2.5">
              <Search size={16} />
              Browse Models
            </Link>
            <Link href="/upload" className="btn-secondary text-base px-6 py-2.5">
              Upload a Model
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {[
            {
              icon: <Download size={22} style={{ color: '#7c3aed' }} />,
              title: 'BitTorrent Distribution',
              desc: 'Models are distributed via BitTorrent. No bandwidth limits, no CDN costs — community peers share the load.',
            },
            {
              icon: <Shield size={22} style={{ color: '#10b981' }} />,
              title: 'Cryptographic Verification',
              desc: 'Every release has SHA-256, SHA-512, BLAKE3, and torrent info hashes. Verify what you download.',
            },
            {
              icon: <Globe size={22} style={{ color: '#3b82f6' }} />,
              title: 'Federation & Mirrors',
              desc: 'Servers synchronize metadata. If one goes down, others continue serving. Truly resilient.',
            },
          ].map(f => (
            <div key={f.title} className="card p-6">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Latest models */}
        {latest.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Recently Added</h2>
              <Link href="/models" className="text-sm" style={{ color: 'var(--hb-purple)' }}>View all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {latest.map((m: Model) => <ModelCard key={m.id} model={m} />)}
            </div>
          </section>
        )}

        {/* Popular models */}
        {popular.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Most Downloaded</h2>
              <Link href="/models?sort=popular" className="text-sm" style={{ color: 'var(--hb-purple)' }}>View all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popular.map((m: Model) => <ModelCard key={m.id} model={m} />)}
            </div>
          </section>
        )}

        {latest.length === 0 && popular.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl mb-4">⚓</p>
            <p className="font-semibold mb-2">No models yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--hb-muted)' }}>Be the first to upload an open AI model.</p>
            <Link href="/upload" className="btn-primary">Upload a Model</Link>
          </div>
        )}
      </section>
    </div>
  )
}
