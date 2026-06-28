import Link from 'next/link'
import { latestModels, popularModels } from '@/lib/api'
import { Download, HardDrive, ArrowRight, Shield, Zap, Globe } from 'lucide-react'
import type { Model } from '@/lib/types'

async function getData() {
  try {
    const [latest, popular] = await Promise.all([latestModels(8), popularModels(8)])
    return { latest: latest || [], popular: popular || [] }
  } catch {
    return { latest: [], popular: [] }
  }
}

function fmtBytes(b: number) {
  if (!b) return null
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = b, i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${u[i]}`
}

function ModelRow({ model, rank }: { model: Model; rank?: number }) {
  const rel = model.latest_release
  return (
    <a
      href={`/models/${model.slug}`}
      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group"
      style={{ textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--hb-surface2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {rank !== undefined && (
        <span className="text-xs font-mono w-5 text-right shrink-0" style={{ color: 'var(--hb-border2)' }}>
          {rank + 1}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--hb-text)' }}>{model.name}</p>
        <p className="text-xs truncate" style={{ color: 'var(--hb-muted)' }}>
          {model.uploader?.display_name || model.uploader?.username || 'anonymous'}
          {model.architecture && <> · {model.architecture}</>}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {rel?.total_size && (
          <span className="text-xs hidden sm:flex items-center gap-1" style={{ color: 'var(--hb-muted)' }}>
            <HardDrive size={11} />
            {fmtBytes(rel.total_size)}
          </span>
        )}
        <span className="text-xs flex items-center gap-1 font-medium" style={{ color: '#22c55e' }}>
          <Download size={11} />
          {model.download_count.toLocaleString()}
        </span>
      </div>
    </a>
  )
}

export default async function HomePage() {
  const { latest, popular } = await getData()

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.15) 0%, transparent 60%)',
        }} />

        <div className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-medium" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Open · Decentralized · BitTorrent
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5" style={{ lineHeight: 1.1 }}>
            The open registry for
            <span className="block" style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              AI models
            </span>
          </h1>

          <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--hb-muted)' }}>
            Upload, share, and download AI models freely. Distributed via BitTorrent — no gatekeepers, no bandwidth limits, no lock-in.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/models" className="btn-primary px-6 py-2.5 text-sm">
              Browse models
              <ArrowRight size={15} />
            </Link>
            <Link href="/upload" className="btn-secondary px-6 py-2.5 text-sm">
              Upload a model
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section className="border-y" style={{ borderColor: 'var(--hb-border)', background: 'var(--hb-surface)' }}>
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Globe,  title: 'Decentralized',    body: 'Models distributed via BitTorrent. Community peers share the bandwidth — no single point of failure.' },
            { icon: Shield, title: 'Verified hashes',  body: 'Every release ships SHA-256, SHA-512, and BLAKE3 checksums so you can verify every byte.' },
            { icon: Zap,    title: 'Open API',         body: 'REST API with JWT and API key auth. Automate uploads and downloads from scripts or CI pipelines.' },
          ].map(f => (
            <div key={f.title} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <f.icon size={15} style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <p className="font-medium text-sm mb-1" style={{ color: 'var(--hb-text)' }}>{f.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--hb-muted)' }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Model lists ── */}
      <section className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recently added */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--hb-border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--hb-text)' }}>Recently added</h2>
            <Link href="/models?sort=recent" className="text-xs font-medium transition-colors hover:text-white" style={{ color: 'var(--hb-muted)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div className="py-1">
            {latest.length === 0
              ? <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--hb-muted)' }}>No models yet.</p>
              : latest.map((m: Model) => <ModelRow key={m.id} model={m} />)
            }
          </div>
        </div>

        {/* Most downloaded */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--hb-border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--hb-text)' }}>Most downloaded</h2>
            <Link href="/models?sort=popular" className="text-xs font-medium transition-colors hover:text-white" style={{ color: 'var(--hb-muted)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div className="py-1">
            {popular.length === 0
              ? <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--hb-muted)' }}>No models yet.</p>
              : popular.map((m: Model, i: number) => <ModelRow key={m.id} model={m} rank={i} />)
            }
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t" style={{ borderColor: 'var(--hb-border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold mb-3">Share your model with the world</h2>
          <p className="text-sm mb-7" style={{ color: 'var(--hb-muted)' }}>
            Uploading is free and open. Create an account, add your model metadata, and attach a .torrent file.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/auth/register" className="btn-primary px-6 py-2.5 text-sm">Create account</Link>
            <Link href="/models" className="btn-secondary px-6 py-2.5 text-sm">Explore models</Link>
          </div>

          {/* Donation — small and unobtrusive */}
          <div className="mt-10 flex justify-center">
            <a
              href="https://ko-fi.com/Q2L8227VO8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs transition-opacity hover:opacity-100"
              style={{ color: 'var(--hb-border2)', opacity: 0.55, textDecoration: 'none' }}
            >
              ☕ If this is useful, buy me a coffee
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
