import { getModel, listReleases, listComments } from '@/lib/api'
import VerificationBadge from '@/components/VerificationBadge'
import MagnetButton from '@/components/MagnetButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Download, Calendar, Tag, FileCode2, Hash } from 'lucide-react'
import type { Release, ManifestFile } from '@/lib/types'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  try {
    const model = await getModel(params.slug)
    return { title: model.name, description: model.description }
  } catch {
    return { title: 'Model Not Found' }
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = bytes, i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function ModelPage({ params }: Props) {
  let model, releases, commentsResp
  try {
    [model, releases, commentsResp] = await Promise.all([
      getModel(params.slug),
      listReleases(params.slug),
      listComments(params.slug),
    ])
  } catch {
    notFound()
  }

  const latestRelease = releases?.find((r: Release) => r.is_latest) || releases?.[0]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 flex-wrap mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-3xl font-bold">{model!.name}</h1>
              <VerificationBadge status={model!.verification_status} />
            </div>
            {model!.uploader && (
              <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>
                Uploaded by <span style={{ color: 'var(--hb-text)' }}>{model!.uploader.display_name || model!.uploader.username}</span>
                {' · '}<time>{formatDate(model!.created_at)}</time>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--hb-muted)' }}>
              <Download size={14} />
              {model!.download_count.toLocaleString()} downloads
            </span>
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-2">
          {model!.architecture && (
            <span className="badge" style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.3)' }}>
              {model!.architecture}
            </span>
          )}
          {model!.framework && (
            <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
              <FileCode2 size={11} />{model!.framework}
            </span>
          )}
          {model!.license && (
            <span className="badge" style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' }}>
              {model!.license}
            </span>
          )}
          {model!.language && model!.language !== 'en' && (
            <span className="badge" style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }}>
              {model!.language}
            </span>
          )}
          {model!.tags?.map(tag => (
            <span key={tag} className="badge" style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }}>
              <Tag size={10} />{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: description + manifest + hashes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {model!.description && (
            <div className="card p-6">
              <h2 className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: 'var(--hb-muted)' }}>About</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{model!.description}</p>
            </div>
          )}

          {/* Latest release download */}
          {latestRelease && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">
                  Latest Release
                  <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7' }}>
                    v{latestRelease.version}
                  </span>
                </h2>
                {latestRelease.total_size > 0 && (
                  <span className="text-xs" style={{ color: 'var(--hb-muted)' }}>{formatBytes(latestRelease.total_size)}</span>
                )}
              </div>

              {latestRelease.description && (
                <p className="text-sm mb-4" style={{ color: 'var(--hb-muted)' }}>{latestRelease.description}</p>
              )}

              {latestRelease.magnet_uri && (
                <div className="mb-4">
                  <MagnetButton magnetUri={latestRelease.magnet_uri} />
                </div>
              )}

              {latestRelease.torrent_url && (
                <a
                  href={`/api/models/${params.slug}/releases/${latestRelease.version}/torrent`}
                  className="btn-secondary text-xs inline-flex"
                >
                  Download .torrent file
                </a>
              )}

              {/* Hashes */}
              {(latestRelease.info_hash || latestRelease.sha256) && (
                <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--hb-border)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--hb-muted)' }}>
                    <Hash size={11} className="inline mr-1" />Verification Hashes
                  </h3>
                  <div className="space-y-2">
                    {latestRelease.info_hash && (
                      <HashRow label="Torrent InfoHash" value={latestRelease.info_hash} />
                    )}
                    {latestRelease.sha256 && (
                      <HashRow label="SHA-256" value={latestRelease.sha256} />
                    )}
                    {latestRelease.sha512 && (
                      <HashRow label="SHA-512" value={latestRelease.sha512} />
                    )}
                    {latestRelease.blake3 && (
                      <HashRow label="BLAKE3" value={latestRelease.blake3} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File manifest */}
          {latestRelease?.file_manifest && latestRelease.file_manifest.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide" style={{ color: 'var(--hb-muted)' }}>Files</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--hb-border)' }}>
                      <th className="text-left pb-2 font-medium" style={{ color: 'var(--hb-muted)' }}>Path</th>
                      <th className="text-right pb-2 font-medium" style={{ color: 'var(--hb-muted)' }}>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestRelease.file_manifest.map((f: ManifestFile, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--hb-border)' }}>
                        <td className="py-2 font-mono text-xs">{f.path}</td>
                        <td className="py-2 text-right text-xs" style={{ color: 'var(--hb-muted)' }}>{formatBytes(f.size)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">
              Comments
              {commentsResp && <span className="ml-2 text-sm" style={{ color: 'var(--hb-muted)' }}>({commentsResp.total})</span>}
            </h2>
            {(!commentsResp?.data || commentsResp.data.length === 0) ? (
              <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {commentsResp.data.map((c: {id: string; user?: {username: string; display_name: string}; content: string; created_at: string}) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(124,58,237,0.2)', color: '#a855f7' }}>
                      {(c.user?.display_name || c.user?.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{c.user?.display_name || c.user?.username}</span>
                        <span className="text-xs" style={{ color: 'var(--hb-muted)' }}>{formatDate(c.created_at)}</span>
                      </div>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--hb-border)' }}>
              <Link href={`/auth/login?next=/models/${params.slug}`} className="text-sm" style={{ color: 'var(--hb-purple)' }}>
                Sign in to comment →
              </Link>
            </div>
          </div>
        </div>

        {/* Right column: info + versions */}
        <div className="space-y-4">
          {/* Model info */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--hb-muted)' }}>Info</h3>
            <dl className="space-y-2.5 text-sm">
              {model!.architecture && <InfoRow label="Architecture" value={model!.architecture} />}
              {model!.framework && <InfoRow label="Format" value={model!.framework} />}
              {model!.license && <InfoRow label="License" value={model!.license} />}
              {model!.language && <InfoRow label="Language" value={model!.language} />}
              {latestRelease?.quantization && <InfoRow label="Quantization" value={latestRelease.quantization} />}
              {latestRelease?.parameter_count! > 0 && (
                <InfoRow label="Parameters" value={formatParams(latestRelease!.parameter_count)} />
              )}
            </dl>
          </div>

          {/* Versions */}
          {releases && releases.length > 0 && (
            <div className="card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--hb-muted)' }}>Versions</h3>
              <div className="space-y-1.5">
                {releases.map((r: Release) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{
                      background: r.is_latest ? 'rgba(124,58,237,0.15)' : 'rgba(100,116,139,0.1)',
                      color: r.is_latest ? '#a855f7' : 'var(--hb-muted)',
                    }}>
                      v{r.version}
                    </span>
                    {r.is_latest && (
                      <span className="text-xs" style={{ color: 'var(--hb-green)' }}>latest</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API snippet */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--hb-muted)' }}>API</h3>
            <pre className="text-xs overflow-x-auto hash-value p-3 rounded" style={{ background: 'var(--hb-surface2)' }}>
              {`GET /api/models/${params.slug}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs mb-0.5" style={{ color: 'var(--hb-muted)' }}>{label}</dt>
      <dd className="hash-value truncate">{value}</dd>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt style={{ color: 'var(--hb-muted)' }}>{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  )
}

function formatParams(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return `${n}`
}
