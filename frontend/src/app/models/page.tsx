import { listModels, search as searchAPI } from '@/lib/api'
import Link from 'next/link'
import { Download, HardDrive, Cpu, ChevronRight } from 'lucide-react'
import type { Model } from '@/lib/types'

const ARCHITECTURES = ['llama', 'mistral', 'falcon', 'bloom', 'gpt2', 'bert', 'stable-diffusion', 'whisper']
const LICENSES      = ['Apache-2.0', 'MIT', 'GPL-3.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'LLAMA', 'Llama-2']
const FRAMEWORKS    = ['gguf', 'safetensors', 'pytorch', 'onnx', 'jax', 'flax']

interface PageProps {
  searchParams: { page?: string; q?: string; architecture?: string; license?: string; framework?: string; sort?: string }
}

export const metadata = { title: 'Browse Models' }

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
function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000)
  if (h < 1)  return '<1h ago'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

const STATUS_DOT: Record<string, string> = {
  verified_author:    '#22c55e',
  community_verified: '#3b82f6',
  mirror:             '#a855f7',
  archived:           '#71717a',
  unverified:         '#f59e0b',
}

export default async function ModelsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1', 10)
  const { q, architecture, license, framework } = searchParams

  let models: Model[] = []
  let total = 0
  try {
    if (q) {
      const sr = await searchAPI(q, page, 20)
      models = (sr.hits as Model[]) || []
      total  = Number(sr.total_hits) || 0
    } else {
      const r = await listModels({ page, limit: 20, architecture, license, framework })
      models = r.data  || []
      total  = r.total
    }
  } catch { /* empty state */ }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  function filterHref(key: string, val: string) {
    const sp = searchParams as Record<string, string>
    const next: Record<string, string> = { ...sp, [key]: val, page: '1' }
    if (sp[key] === val) delete next[key]
    return '/models?' + new URLSearchParams(next).toString()
  }

  function pageHref(p: number) {
    return '/models?' + new URLSearchParams({ ...(searchParams as Record<string, string>), page: String(p) }).toString()
  }

  const hasFilters = !!(architecture || license || framework)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--hb-text)' }}>
          {q ? `Search: "${q}"` : 'Browse Models'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>
          {total.toLocaleString()} model{total !== 1 ? 's' : ''}
          {hasFilters ? ' matching filters' : ' in the registry'}
        </p>
      </div>

      <div className="flex gap-6">

        {/* ── Sidebar ── */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-20 space-y-1">

            <FilterSection title="Architecture" options={ARCHITECTURES} selected={architecture} getHref={v => filterHref('architecture', v)} />
            <div className="my-2" style={{ height: 1, background: 'var(--hb-border)' }} />
            <FilterSection title="License"      options={LICENSES}      selected={license}      getHref={v => filterHref('license', v)} />
            <div className="my-2" style={{ height: 1, background: 'var(--hb-border)' }} />
            <FilterSection title="Format"       options={FRAMEWORKS}    selected={framework}    getHref={v => filterHref('framework', v)} />

            {hasFilters && (
              <div className="pt-3">
                <Link href="/models" className="text-xs font-medium transition-colors hover:text-white" style={{ color: 'var(--hb-muted)', textDecoration: 'none' }}>
                  ✕ Clear all filters
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Active filters (mobile + desktop) */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {architecture && <FilterChip label={architecture} href={filterHref('architecture', architecture)} />}
              {license      && <FilterChip label={license}      href={filterHref('license', license)} />}
              {framework    && <FilterChip label={framework}    href={filterHref('framework', framework)} />}
            </div>
          )}

          {/* Model list */}
          {models.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="font-semibold mb-1" style={{ color: 'var(--hb-text)' }}>No models found</p>
              <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>Try different filters or be the first to upload one.</p>
              <Link href="/upload" className="btn-primary inline-flex mt-5 text-sm">Upload a model</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {models.map((m: Model) => {
                const rel = m.latest_release
                const dot = STATUS_DOT[m.verification_status] || '#71717a'
                return (
                  <Link
                    key={m.id}
                    href={`/models/${m.slug}`}
                    className="flex items-center gap-4 p-4 rounded-xl transition-colors group"
                    style={{ background: 'var(--hb-surface)', border: '1px solid var(--hb-border)', textDecoration: 'none', color: 'inherit', display: 'flex' }}
                  >
                    {/* Status dot */}
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: dot }} />

                    {/* Name + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm" style={{ color: 'var(--hb-text)' }}>{m.name}</span>
                        {m.architecture && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                            {m.architecture}
                          </span>
                        )}
                        {rel?.quantization && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--hb-surface2)', color: 'var(--hb-muted)', border: '1px solid var(--hb-border)' }}>
                            {rel.quantization}
                          </span>
                        )}
                        {m.license && (
                          <span className="text-xs px-1.5 py-0.5 rounded hidden sm:inline" style={{ background: 'var(--hb-surface2)', color: 'var(--hb-muted)', border: '1px solid var(--hb-border)' }}>
                            {m.license}
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--hb-muted)' }}>
                        {m.uploader?.display_name || m.uploader?.username || 'anonymous'}
                        {m.description && <span className="hidden sm:inline"> · {m.description.slice(0, 80)}{m.description.length > 80 ? '…' : ''}</span>}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-5 shrink-0">
                      {rel?.total_size && (
                        <span className="hidden md:flex items-center gap-1 text-xs" style={{ color: 'var(--hb-muted)' }}>
                          <HardDrive size={12} />{fmtBytes(rel.total_size)}
                        </span>
                      )}
                      {rel?.parameter_count && (
                        <span className="hidden md:flex items-center gap-1 text-xs" style={{ color: 'var(--hb-muted)' }}>
                          <Cpu size={12} />{fmtParams(rel.parameter_count)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#22c55e' }}>
                        <Download size={12} />{m.download_count.toLocaleString()}
                      </span>
                      <span className="hidden sm:block text-xs" style={{ color: 'var(--hb-border2)' }}>{timeAgo(m.created_at)}</span>
                      <ChevronRight size={14} style={{ color: 'var(--hb-border2)' }} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="btn-secondary py-1.5 px-4 text-sm">← Prev</Link>
              )}
              <span className="text-sm px-3" style={{ color: 'var(--hb-muted)' }}>
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={pageHref(page + 1)} className="btn-secondary py-1.5 px-4 text-sm">Next →</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterSection({ title, options, selected, getHref }: {
  title: string; options: string[]; selected?: string; getHref: (v: string) => string
}) {
  return (
    <div>
      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--hb-muted)' }}>{title}</p>
      {options.map(opt => (
        <Link
          key={opt}
          href={getHref(opt)}
          className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            textDecoration: 'none',
            background: selected === opt ? 'rgba(139,92,246,0.1)' : 'transparent',
            color: selected === opt ? '#a78bfa' : 'var(--hb-muted)',
            border: selected === opt ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
            marginBottom: 1,
          }}
        >
          <span>{opt}</span>
          {selected === opt && <span style={{ fontSize: 10 }}>✓</span>}
        </Link>
      ))}
    </div>
  )
}

function FilterChip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
      style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', textDecoration: 'none' }}
    >
      {label}
      <span style={{ fontSize: 10, opacity: 0.7 }}>✕</span>
    </Link>
  )
}
