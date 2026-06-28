import Link from 'next/link'
import type { Model } from '@/lib/types'
import VerificationBadge from './VerificationBadge'
import { Download, FileCode2 } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let val = bytes
  let i = 0
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(1)} ${units[i]}`
}

function formatParams(n: number): string {
  if (!n) return ''
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return `${n}`
}

export default function ModelCard({ model }: { model: Model }) {
  const rel = model.latest_release

  return (
    <Link href={`/models/${model.slug}`} className="card block p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-hb-text truncate">{model.name}</h3>
          {model.uploader && (
            <p className="text-xs text-hb-muted mt-0.5">
              by {model.uploader.display_name || model.uploader.username}
            </p>
          )}
        </div>
        <VerificationBadge status={model.verification_status} />
      </div>

      {model.description && (
        <p className="text-sm text-hb-muted line-clamp-2 mb-3">{model.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {model.architecture && (
          <span className="badge" style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.3)' }}>
            {model.architecture}
          </span>
        )}
        {rel?.quantization && (
          <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
            {rel.quantization}
          </span>
        )}
        {model.license && (
          <span className="badge" style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' }}>
            {model.license}
          </span>
        )}
        {model.tags?.slice(0, 2).map(tag => (
          <span key={tag} className="badge" style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }}>
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-hb-muted border-t border-hb-border pt-3 mt-3">
        {rel && rel.total_size > 0 && (
          <span className="flex items-center gap-1">
            <FileCode2 size={12} />
            {formatBytes(rel.total_size)}
          </span>
        )}
        {rel && rel.parameter_count > 0 && (
          <span>{formatParams(rel.parameter_count)} params</span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Download size={12} />
          {model.download_count.toLocaleString()}
        </span>
      </div>
    </Link>
  )
}
