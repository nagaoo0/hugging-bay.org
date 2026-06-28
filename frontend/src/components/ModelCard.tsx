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
  verified_author:    '#22c55e',
  community_verified: '#3b82f6',
  mirror:             '#a855f7',
  archived:           '#71717a',
  unverified:         '#f59e0b',
}

export default function ModelCard({ model }: { model: Model }) {
  const rel    = model.latest_release
  const dot    = STATUS_COLOR[model.verification_status] || '#71717a'

  return (
    <Link href={`/models/${model.slug}`} className="model-card">

      {/* Top bar — accent color strip */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />

      <div style={{ padding: '16px' }}>

        {/* Header row: arch chip + verification dot */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {model.architecture && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                {model.architecture}
              </span>
            )}
            {rel?.quantization && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--hb-surface2)', color: 'var(--hb-muted)', border: '1px solid var(--hb-border)' }}>
                {rel.quantization}
              </span>
            )}
          </div>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} title={model.verification_status} />
        </div>

        {/* Uploader */}
        <p className="text-xs mb-1" style={{ color: 'var(--hb-muted)' }}>
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
          <div className="flex flex-wrap gap-1 mb-4">
            {model.tags.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--hb-surface2)', color: 'var(--hb-muted)' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid var(--hb-border)' }}>
          <StatItem icon={<Download size={12} />} value={model.download_count.toLocaleString()} color="#22c55e" />
          {rel?.total_size && <StatItem icon={<HardDrive size={12} />} value={fmtBytes(rel.total_size)!} />}
          {rel?.parameter_count && <StatItem icon={<Cpu size={12} />} value={fmtParams(rel.parameter_count)!} />}
        </div>
      </div>
    </Link>
  )
}

function StatItem({ icon, value, color }: { icon: React.ReactNode; value: string; color?: string }) {
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: color || 'var(--hb-muted)' }}>
      {icon}
      {value}
    </span>
  )
}
