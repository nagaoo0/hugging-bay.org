import Link from 'next/link'
import { latestModels, popularModels } from '@/lib/api'
import type { Model } from '@/lib/types'

async function getData() {
  try {
    const [latest, popular] = await Promise.all([latestModels(10), popularModels(10)])
    return { latest: latest || [], popular: popular || [] }
  } catch {
    return { latest: [], popular: [] }
  }
}

function fmtBytes(b: number) {
  if (!b) return '—'
  const u = ['B','KB','MB','GB','TB']
  let v = b, i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${u[i]}`
}

function ModelListRow({ model, index }: { model: Model; index: number }) {
  const rel = model.latest_release
  return (
    <a href={`/models/${model.slug}`} className="model-list-row">
      <span style={{ fontSize: 14, flexShrink: 0 }}>📄</span>
      <span style={{ flex: 1, color: '#0000ee', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
        {model.name}
      </span>
      {model.architecture && (
        <span style={{ background: '#c0c0c0', border: '1px solid #808080', padding: '0 4px', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', flexShrink: 0, letterSpacing: '0.05em' }}>
          {model.architecture}
        </span>
      )}
      <span style={{ color: '#808080', fontSize: 10, minWidth: 42, textAlign: 'right', flexShrink: 0 }}>
        {rel ? fmtBytes(rel.total_size) : '—'}
      </span>
      <span style={{ fontFamily: 'VT323, monospace', fontSize: '1.1rem', color: '#00a020', minWidth: 40, textAlign: 'right', flexShrink: 0, textShadow: '0 0 4px rgba(0,160,32,0.4)' }}>
        {model.download_count.toLocaleString()}
      </span>
    </a>
  )
}

function WinWindow({ title, icon, count, viewAllHref, children }: {
  title: string; icon: string; count: number; viewAllHref: string; children: React.ReactNode
}) {
  return (
    <div className="win-window" style={{ padding: 0 }}>
      {/* Title bar */}
      <div className="win-titlebar">
        <span>{icon} {title}</span>
        <Link href={viewAllHref} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Tahoma', textDecoration: 'underline', marginLeft: 'auto', fontWeight: 'normal' }}>
          View all
        </Link>
        <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
          <span className="win-ctrl">─</span>
          <span className="win-ctrl">□</span>
          <span className="win-ctrl win-close">✕</span>
        </div>
      </div>
      {/* Column header */}
      <div style={{ background: '#c0c0c0', borderBottom: '1px solid #808080', padding: '2px 6px', display: 'flex', gap: 8, fontSize: 11, fontFamily: 'Tahoma', alignItems: 'center' }}>
        <span style={{ flex: 1, fontWeight: 'bold', color: '#000' }}>Name</span>
        <span style={{ color: '#808080', width: 42, textAlign: 'right', fontSize: 10 }}>Size</span>
        <span style={{ color: '#00a020', width: 40, textAlign: 'right', fontFamily: 'VT323, monospace', fontSize: 13 }}>Seeds</span>
      </div>
      {/* Rows */}
      <div style={{ background: 'white' }}>
        {children}
      </div>
      {/* Status bar */}
      <div style={{ background: '#c0c0c0', borderTop: '2px solid #808080', padding: '2px 6px', fontSize: 10, fontFamily: 'Tahoma', color: '#000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{count} object(s)</span>
        <span style={{ fontFamily: 'Share Tech Mono', color: '#00a020', fontSize: 9 }}>● LIVE</span>
      </div>
    </div>
  )
}

export default async function HomePage() {
  const { latest, popular } = await getData()

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>

      {/* ── CS 1.6 HUD banner ── */}
      <div style={{
        background: '#060f06',
        borderBottom: '2px solid #00c851',
        padding: '10px 20px',
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 11,
        color: '#00c851',
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'VT323, monospace', fontSize: '1.35rem', color: '#4ade80' }}>
          HUGGING-BAY // OPEN AI MODEL REGISTRY
        </span>
        <span>NET: ONLINE</span>
        <span>PROTO: BITTORRENT</span>
        <span>MODE: NO GATEKEEPERS</span>
        <Link href="/models" style={{ marginLeft: 'auto', color: '#f5e642', textDecoration: 'none', fontWeight: 'bold' }}>
          [ BROWSE ALL ] →
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">

        {/* ── Feature panels (WinXP windows) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🌊', title: 'BITTORRENT DIST',  body: 'Decentralized distribution via BitTorrent. No bandwidth limits, no CDN costs. Community peers share the load.' },
            { icon: '🔒', title: 'CRYPTO VERIFY',    body: 'SHA-256 / SHA-512 / BLAKE3 + torrent info_hash on every release. Verify every byte you download.' },
            { icon: '⚡', title: 'OPEN REGISTRY',    body: 'No approval. No gatekeepers. Upload freely redistributable AI models and share them with the world.' },
          ].map(f => (
            <div key={f.title} className="win-window" style={{ padding: 0 }}>
              <div className="win-titlebar">
                <span>{f.icon} {f.title}</span>
                <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
                  <span className="win-ctrl">─</span>
                  <span className="win-ctrl">□</span>
                  <span className="win-ctrl win-close">✕</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px', fontSize: 11, fontFamily: 'Tahoma, sans-serif', color: '#000', background: '#f5f5f0' }}>
                {f.body}
              </div>
            </div>
          ))}
        </div>

        {/* ── Two-column: Recent + Popular ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <WinWindow title="Recently Added" icon="📁" count={latest.length} viewAllHref="/models">
            {latest.length === 0
              ? <p style={{ padding: '20px', textAlign: 'center', color: '#808080', fontFamily: 'Tahoma', fontSize: 11 }}>No models yet</p>
              : latest.map((m: Model, i: number) => <ModelListRow key={m.id} model={m} index={i} />)
            }
          </WinWindow>

          <WinWindow title="Most Downloaded" icon="🔥" count={popular.length} viewAllHref="/models?sort=popular">
            {popular.length === 0
              ? <p style={{ padding: '20px', textAlign: 'center', color: '#808080', fontFamily: 'Tahoma', fontSize: 11 }}>No models yet</p>
              : popular.map((m: Model, i: number) => <ModelListRow key={m.id} model={m} index={i} />)
            }
          </WinWindow>
        </div>

        {/* ── CTA buttons ── */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', paddingTop: 4 }}>
          <Link href="/models"         className="win-btn" style={{ padding: '6px 28px', fontSize: 12, fontWeight: 'bold' }}>📁 Browse All Models</Link>
          <Link href="/upload"         className="win-btn" style={{ padding: '6px 28px', fontSize: 12 }}>📤 Upload a Model</Link>
          <Link href="/auth/register"  className="win-btn" style={{ padding: '6px 28px', fontSize: 12 }}>👤 Join the Crew</Link>
        </div>

        {/* ── TPB-style disclaimer ── */}
        <div style={{
          background: '#060f06',
          border: '1px solid #1a4d1a',
          padding: '8px 16px',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 10,
          color: '#1a4d1a',
          lineHeight: 1.7,
        }}>
          <span style={{ color: '#f5e642' }}>⚠ NOTICE: </span>
          Hugging-Bay hosts only freely redistributable AI models. All models are user-uploaded.
          We do not host model weights directly — only metadata and .torrent files.
          Not affiliated with Hugging Face.
          <span style={{ color: '#f5e642' }}> ARR!</span>
        </div>
      </div>
    </div>
  )
}
