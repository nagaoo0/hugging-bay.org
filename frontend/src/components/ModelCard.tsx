import Link from 'next/link'
import { Download, HardDrive, Cpu } from 'lucide-react'
import type { Model } from '@/lib/types'

function fmtBytes(b: number) {
  if (!b) return null
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = b, i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${u[i]}`
}
function fmtParams(n: number) {
  if (!n) return null
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return `${n}`
}

const STATUS_COLOR: Record<string, string> = {
  verified_author:    'var(--hb-green)',
  community_verified: 'var(--hb-blue)',
  mirror:             '#a855f7',
  archived:           '#52525b',
  unverified:         'var(--hb-amber)',
}

export default function ModelCard({ model }: { model: Model }) {
  const rel = model.latest_release
  const dot = STATUS_COLOR[model.verification_status] || '#52525b'

  return (
    <Link href={`/models/${model.slug}`} className="model-card">
      <div style={{ padding: '20px' }}>

        {/* Header: arch + verification */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {model.architecture && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--hb-purple-light)', border: '1px solid rgba(139,92,246,0.2)' }}>
                {model.architecture}
              </span>
            )}
            {rel?.quantization && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--hb-surface2)', color: 'var(--hb-muted)', border: '1px solid var(--hb-border)' }}>
                {rel.quantization}
              </span>
            )}
          </div>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} title={model.verification_status} />
        </div>

        {/* Uploader */}
        <p className="text-xs mb-1.5" style={{ color: 'var(--hb-muted)' }}>
          {model.uploader?.display_name || model.uploader?.username || 'anonymous'}
        </p>

        {/* Name */}
        <h3 className="font-semibold text-base leading-snug mb-2" style={{ color: 'var(--hb-text)', wordBreak: 'break-word' }}>
          {model.name}
        </h3>

        {/* Description */}
        {model.description && (
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--hb-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {model.description}
          </p>
        )}

        {/* Tags */}
        {model.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {model.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--hb-surface2)', color: 'var(--hb-muted)', border: '1px solid var(--hb-border)' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid var(--hb-border)' }}>
          <Stat icon={<Download size={12} />} value={model.download_count.toLocaleString()} color="var(--hb-green)" />
          {rel?.total_size && <Stat icon={<HardDrive size={12} />} value={fmtBytes(rel.total_size)!} />}
          {rel?.parameter_count && <Stat icon={<Cpu size={12} />} value={fmtParams(rel.parameter_count)!} />}
        </div>
      </div>
    </Link>
  )
}

function Stat({ icon, value, color }: { icon: React.ReactNode; value: string; color?: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: color || 'var(--hb-muted)' }}>
      {icon}{value}
    </span>
  )
}
