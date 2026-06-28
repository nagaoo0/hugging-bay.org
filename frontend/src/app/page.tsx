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
      className="hover-row flex items-center gap-3 px-4 py-3"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {rank !== undefined && (
        <span className="text-xs font-mono w-5 text-right shrink-0 font-semibold" style={{ color: 'var(--hb-border2)' }}>
          {rank + 1}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--hb-text)' }}>{model.name}</p>
        <p className="text-xs truncate" style={{ color: 'var(--hb-muted)' }}>
          {model.uploader?.display_name || model.uploader?.username || 'anonymous'}
          {model.architecture && (
            <> · <span style={{ color: 'var(--hb-purple-light)', opacity: 0.8 }}>{model.architecture}</span></>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {rel?.total_size && (
          <span className="text-xs hidden sm:flex items-center gap-1" style={{ color: 'var(--hb-muted)' }}>
            <HardDrive size={11} />{fmtBytes(rel.total_size)}
          </span>
        )}
        <span className="text-xs flex items-center gap-1 font-medium" style={{ color: 'var(--hb-green)' }}>
          <Download size={11} />{model.download_count.toLocaleString()}
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
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.18) 0%, transparent 65%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(var(--hb-border) 1px, transparent 1px), linear-gradient(to right, var(--hb-border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.025,
        }} />

        <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--hb-purple-light)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--hb-purple-light)' }} />
            Open · Decentralized · BitTorrent
          </div>

          <h1 className="font-bold tracking-tight mb-6" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', lineHeight: 1.05 }}>
            <span style={{ color: 'var(--hb-text)' }}>The open registry</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 45%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              for AI models
            </span>
          </h1>

          <p className="text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--hb-muted)' }}>
            Upload, share, and download AI models freely. Distributed via BitTorrent — no gatekeepers, no bandwidth limits, no lock-in.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/models" className="btn-primary" style={{ padding: '12px 28px', fontSize: 15, borderRadius: 14 }}>
              Browse models <ArrowRight size={15} />
            </Link>
            <Link href="/upload" className="btn-secondary" style={{ padding: '12px 28px', fontSize: 15, borderRadius: 14 }}>
              Upload a model
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section style={{ borderTop: '1px solid var(--hb-border)', borderBottom: '1px solid var(--hb-border)', background: 'var(--hb-surface)' }}>
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: Globe,  title: 'Decentralized',   body: 'Models distributed via BitTorrent. Community peers share the bandwidth — no single point of failure.' },
            { icon: Shield, title: 'Verified hashes', body: 'Every release ships SHA-256, SHA-512, and BLAKE3 checksums so you can verify every byte.' },
            { icon: Zap,    title: 'Open API',        body: 'REST API with JWT and API key auth. Automate uploads and downloads from scripts or CI pipelines.' },
          ].map(f => (
            <div key={f.title} className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)' }}>
                <f.icon size={18} style={{ color: 'var(--hb-purple-light)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1.5" style={{ color: 'var(--hb-text)' }}>{f.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--hb-muted)' }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Model lists ── */}
      <section className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--hb-border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--hb-text)' }}>Recently added</h2>
            <Link href="/models?sort=recent" className="footer-link flex items-center gap-1 text-xs font-medium">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="px-1 py-2">
            {latest.length === 0
              ? <p className="px-4 py-8 text-sm text-center" style={{ color: 'var(--hb-muted)' }}>No models yet.</p>
              : latest.map((m: Model) => <ModelRow key={m.id} model={m} />)
            }
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--hb-border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--hb-text)' }}>Most downloaded</h2>
            <Link href="/models?sort=popular" className="footer-link flex items-center gap-1 text-xs font-medium">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="px-1 py-2">
            {popular.length === 0
              ? <p className="px-4 py-8 text-sm text-center" style={{ color: 'var(--hb-muted)' }}>No models yet.</p>
              : popular.map((m: Model, i: number) => <ModelRow key={m.id} model={m} rank={i} />)
            }
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ borderTop: '1px solid var(--hb-border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Globe size={26} style={{ color: 'var(--hb-purple-light)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Share your model with the world</h2>
          <p className="text-sm mb-8 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--hb-muted)' }}>
            Uploading is free and open. Create an account, add your model metadata, and attach a .torrent file.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/auth/register" className="btn-primary" style={{ padding: '12px 28px', fontSize: 15, borderRadius: 14 }}>Create account</Link>
            <Link href="/models" className="btn-secondary" style={{ padding: '12px 28px', fontSize: 15, borderRadius: 14 }}>Explore models</Link>
          </div>

          <div className="mt-10">
            <a
              href="https://ko-fi.com/Q2L8227VO8"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link text-xs inline-flex items-center gap-2"
              style={{ opacity: 0.5 }}
            >
              ☕ If this is useful, buy me a coffee
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
