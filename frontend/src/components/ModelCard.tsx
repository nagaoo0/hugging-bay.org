import Link from 'next/link'
import type { Model } from '@/lib/types'

function fmtBytes(b: number) {
  if (!b) return '—'
  const u = ['B','KB','MB','GB','TB']
  let v = b, i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)}${u[i]}`
}
function fmtParams(n: number) {
  if (!n) return '—'
  if (n >= 1e9) return `${(n/1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`
  return `${n}`
}
function fmtDL(n: number) {
  if (n >= 1000) return `${(n/1000).toFixed(1)}K`
  return `${n}`
}

const VER_BADGES: Record<string, { bg: string; label: string }> = {
  verified_author:    { bg: '#00c851', label: 'VIP' },
  community_verified: { bg: '#1060d4', label: 'TRUSTED' },
  mirror:             { bg: '#8800cc', label: 'MIRROR' },
  archived:           { bg: '#808080', label: 'ARCHIVED' },
  unverified:         { bg: '#c07800', label: 'UNVERIFIED' },
}

export default function ModelCard({ model }: { model: Model }) {
  const rel = model.latest_release
  const ver = VER_BADGES[model.verification_status] || { bg: '#808080', label: 'UNKNOWN' }

  return (
    <Link href={`/models/${model.slug}`} className="model-card">

      {/* ── Yellow header with diagonal stripe + arch badge ── */}
      <div style={{
        height: 52,
        background: '#f5e642',
        borderBottom: '3px solid #0a0a0a',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 10px 6px',
      }}>
        {/* Diagonal stripe overlay */}
        <div className="stripe-pattern" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        {/* Architecture chip */}
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '0.85rem',
          letterSpacing: '0.1em',
          background: '#0a0a0a',
          color: '#f5e642',
          padding: '1px 8px',
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}>
          {model.architecture || 'MODEL'}
        </span>

        {/* Verification badge */}
        <span style={{
          position: 'absolute',
          top: 6,
          right: 8,
          background: ver.bg,
          color: '#fff',
          fontSize: '8px',
          fontWeight: 900,
          padding: '2px 6px',
          border: '2px solid #0a0a0a',
          boxShadow: '2px 2px 0 #0a0a0a',
          fontFamily: 'Tahoma, sans-serif',
          letterSpacing: '0.15em',
          zIndex: 2,
        }}>
          {ver.label}
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '10px 12px 0' }}>
        {/* Uploader handle */}
        <div style={{
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: '#a8a49a',
          textTransform: 'uppercase',
          marginBottom: 2,
          fontFamily: 'Tahoma, sans-serif',
        }}>
          {model.uploader?.username || 'anonymous'}
        </div>

        {/* Model name */}
        <h3 style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '1.45rem',
          lineHeight: 0.9,
          color: '#0a0a0a',
          letterSpacing: '-0.01em',
          marginBottom: 8,
          wordBreak: 'break-word',
        }}>
          {model.name}
        </h3>

        {/* Description — red left border like card-profile */}
        {model.description && (
          <p style={{
            fontSize: '10px',
            color: '#0a0a0a',
            borderLeft: '4px solid #e8180a',
            paddingLeft: 8,
            lineHeight: 1.5,
            marginBottom: 10,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: 'Tahoma, sans-serif',
          }}>
            {model.description}
          </p>
        )}
      </div>

      {/* ── Stats grid — CS 1.6 style numbers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '3px solid #0a0a0a' }}>
        {/* Downloads — green like TPB seeders */}
        <div style={{ padding: '8px 4px', borderRight: '2px solid #0a0a0a', textAlign: 'center' }}>
          <span style={{
            fontFamily: 'VT323, monospace',
            fontSize: '1.5rem',
            color: '#00c851',
            textShadow: '0 0 6px rgba(0,200,80,0.5)',
            display: 'block',
            lineHeight: 1,
          }}>
            {fmtDL(model.download_count)}
          </span>
          <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.12em', color: '#a8a49a', textTransform: 'uppercase', fontFamily: 'Tahoma' }}>
            SEEDS
          </span>
        </div>

        {/* Size */}
        <div style={{ padding: '8px 4px', borderRight: '2px solid #0a0a0a', textAlign: 'center' }}>
          <span style={{ fontFamily: 'VT323, monospace', fontSize: '1.5rem', color: '#0a0a0a', display: 'block', lineHeight: 1 }}>
            {rel ? fmtBytes(rel.total_size) : '—'}
          </span>
          <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.12em', color: '#a8a49a', textTransform: 'uppercase', fontFamily: 'Tahoma' }}>
            SIZE
          </span>
        </div>

        {/* Params */}
        <div style={{ padding: '8px 4px', textAlign: 'center' }}>
          <span style={{ fontFamily: 'VT323, monospace', fontSize: '1.5rem', color: '#0a0a0a', display: 'block', lineHeight: 1 }}>
            {rel ? fmtParams(rel.parameter_count) : '—'}
          </span>
          <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.12em', color: '#a8a49a', textTransform: 'uppercase', fontFamily: 'Tahoma' }}>
            PARAMS
          </span>
        </div>
      </div>

      {/* ── Footer: black bar with yellow hover ── */}
      <div style={{
        background: '#0a0a0a',
        color: '#f5e642',
        textAlign: 'center',
        padding: '8px',
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: '0.9rem',
        letterSpacing: '0.2em',
      }}>
        VIEW MODEL →
      </div>
    </Link>
  )
}
