import { listModels, search as searchAPI } from '@/lib/api'
import Link from 'next/link'
import type { Model } from '@/lib/types'

const ARCHITECTURES = ['llama','mistral','falcon','bloom','gpt2','bert','stable-diffusion','whisper']
const LICENSES      = ['Apache-2.0','MIT','GPL-3.0','CC-BY-4.0','CC-BY-SA-4.0','LLAMA','Llama-2']
const FRAMEWORKS    = ['gguf','safetensors','pytorch','onnx','jax','flax']

interface PageProps {
  searchParams: { page?: string; q?: string; architecture?: string; license?: string; framework?: string }
}

export const metadata = { title: 'Browse Models' }

function fmtBytes(b: number) {
  if (!b) return '—'
  const u = ['B','KB','MB','GB','TB']
  let v = b, i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${u[i]}`
}
function fmtParams(n: number) {
  if (!n) return '—'
  if (n >= 1e9) return `${(n/1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`
  return `${n}`
}
function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1)  return '<1h'
  if (h < 24) return `${h}h`
  return `${Math.floor(h/24)}d`
}

const VER_BADGE: Record<string, { bg: string; label: string }> = {
  verified_author:    { bg: '#00a020', label: 'VIP' },
  community_verified: { bg: '#0050c8', label: 'T' },
  mirror:             { bg: '#800080', label: 'M' },
  archived:           { bg: '#808080', label: '~' },
  unverified:         { bg: '',        label: ''  },
}

export default async function ModelsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1', 10)
  const { q, architecture, license, framework } = searchParams

  let models: Model[] = []
  let total = 0
  try {
    if (q) {
      const sr = await searchAPI(q, page, 30)
      models = (sr.hits as Model[]) || []
      total  = Number(sr.total_hits) || 0
    } else {
      const r = await listModels({ page, limit: 30, architecture, license, framework })
      models = r.data  || []
      total  = r.total
    }
  } catch { /* empty state */ }

  const totalPages = Math.ceil(total / 30)

  function filterHref(key: string, val: string) {
    const sp = searchParams as Record<string,string>
    const next = { ...sp, [key]: val, page: '1' }
    if (sp[key] === val) delete next[key]
    return '/models?' + new URLSearchParams(next).toString()
  }

  function pageHref(p: number) {
    return '/models?' + new URLSearchParams({ ...(searchParams as Record<string,string>), page: String(p) }).toString()
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* ── WinXP Explorer window ── */}
        <div className="win-window" style={{ padding: 0 }}>

          {/* Title bar */}
          <div className="win-titlebar">
            <span>📁 {q ? `Search: "${q}"` : 'AI Models'} — Hugging-Bay Explorer</span>
            <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
              <span className="win-ctrl">─</span>
              <span className="win-ctrl">□</span>
              <span className="win-ctrl win-close">✕</span>
            </div>
          </div>

          {/* Menu bar */}
          <div style={{ background: '#c0c0c0', borderBottom: '1px solid #808080', padding: '2px 6px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 11, fontFamily: 'Tahoma' }}>
            {['File','Edit','View','Favorites','Tools','Help'].map(m => (
              <span key={m} style={{ cursor: 'default', padding: '1px 4px', color: '#000' }}
                className="hover:bg-[#000080] hover:text-white">{m}</span>
            ))}
            <Link href="/upload" className="win-btn" style={{ marginLeft: 'auto', padding: '1px 14px', fontSize: 11, height: 20 }}>
              📤 Upload Model
            </Link>
          </div>

          {/* Address bar */}
          <div style={{ background: '#c0c0c0', borderBottom: '1px solid #808080', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontFamily: 'Tahoma', color: '#000', flexShrink: 0 }}>Address:</span>
            <div style={{ flex: 1, background: 'white', border: '2px solid', borderColor: '#808080 #fff #fff #808080', padding: '1px 6px', fontSize: 11, fontFamily: 'Tahoma', color: '#000', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>🌐</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                hugging-bay/models{architecture ? `/arch:${architecture}` : ''}{license ? `/lic:${license}` : ''}{q ? `?q=${q}` : ''}
              </span>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'Share Tech Mono', color: '#00a020', flexShrink: 0 }}>
              {total.toLocaleString()} items
            </span>
          </div>

          {/* Body: sidebar + table */}
          <div style={{ display: 'flex', background: '#fff', minHeight: 420 }}>

            {/* ── Sidebar: WinXP Folders panel ── */}
            <div style={{ width: 168, background: '#f5f5f0', borderRight: '2px solid #808080', flexShrink: 0 }}>
              <div style={{ background: '#e0e0d8', borderBottom: '1px solid #808080', padding: '4px 8px', fontSize: 11, fontFamily: 'Tahoma', fontWeight: 'bold', color: '#000' }}>
                Folders
              </div>

              <FilterGroup title="Architecture" options={ARCHITECTURES} selected={architecture} getHref={v => filterHref('architecture', v)} />
              <FilterGroup title="License"      options={LICENSES}      selected={license}      getHref={v => filterHref('license', v)} />
              <FilterGroup title="Format"       options={FRAMEWORKS}    selected={framework}    getHref={v => filterHref('framework', v)} />
            </div>

            {/* ── Main table ── */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {models.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', fontFamily: 'Tahoma', fontSize: 12, color: '#808080' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                  <p style={{ fontWeight: 'bold', color: '#000', marginBottom: 4 }}>No models found</p>
                  <p>Try different filters or be the first to upload one.</p>
                </div>
              ) : (
                <table className="win-table">
                  <thead>
                    <tr>
                      <th style={{ width: '38%' }}>Name ▲</th>
                      <th>Arch</th>
                      <th>Format</th>
                      <th>Size</th>
                      <th>Params</th>
                      <th style={{ fontFamily: 'VT323, monospace', fontSize: 13, color: '#00a020', letterSpacing: 1 }}>↓ Seeds</th>
                      <th>Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m: Model) => {
                      const rel = m.latest_release
                      const vb  = VER_BADGE[m.verification_status] || { bg: '', label: '' }
                      return (
                        <tr key={m.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 14, flexShrink: 0 }}>📄</span>
                              <a href={`/models/${m.slug}`} style={{ color: '#0000ee', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.name}
                              </a>
                              {vb.label && (
                                <span style={{ background: vb.bg, color: '#fff', fontSize: '8px', fontWeight: 900, padding: '0 3px', border: `1px solid ${vb.bg}`, fontFamily: 'Tahoma', flexShrink: 0 }}>
                                  {vb.label}
                                </span>
                              )}
                            </div>
                            {m.uploader && (
                              <div style={{ color: '#808080', fontSize: 10, paddingLeft: 18, fontFamily: 'Tahoma' }}>
                                by {m.uploader.display_name || m.uploader.username}
                              </div>
                            )}
                          </td>
                          <td style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10 }}>{m.architecture || '—'}</td>
                          <td style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10 }}>{rel?.quantization || m.framework || '—'}</td>
                          <td style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#404040' }}>{rel ? fmtBytes(rel.total_size) : '—'}</td>
                          <td style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#404040' }}>{rel ? fmtParams(rel.parameter_count) : '—'}</td>
                          <td style={{ fontFamily: 'VT323, monospace', fontSize: '1.2rem', color: '#00a020', textShadow: '0 0 4px rgba(0,160,32,0.4)' }}>
                            {m.download_count.toLocaleString()}
                          </td>
                          <td style={{ color: '#808080', fontSize: 10, fontFamily: 'Tahoma', whiteSpace: 'nowrap' }}>
                            {timeAgo(m.created_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Status bar + pagination ── */}
          <div style={{ background: '#c0c0c0', borderTop: '2px solid #808080', padding: '3px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: 'Tahoma', flexWrap: 'wrap', gap: 4 }}>
            <span style={{ color: '#000' }}>{total.toLocaleString()} object(s)</span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {page > 1          && <Link href={pageHref(page-1)} className="win-btn" style={{ padding: '1px 12px', fontSize: 11 }}>← Back</Link>}
                <span style={{ color: '#000' }}>Page {page} of {totalPages}</span>
                {page < totalPages && <Link href={pageHref(page+1)} className="win-btn" style={{ padding: '1px 12px', fontSize: 11 }}>Next →</Link>}
              </div>
            )}
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#00a020' }}>
              ● {total.toLocaleString()} FILES INDEXED
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}

function FilterGroup({ title, options, selected, getHref }: {
  title: string; options: string[]; selected?: string; getHref: (v: string) => string
}) {
  return (
    <div style={{ borderBottom: '1px solid #c0c0c0' }}>
      <div style={{ padding: '3px 8px', fontSize: 10, fontWeight: 'bold', fontFamily: 'Tahoma', color: '#000', background: '#e8e8e0', borderBottom: '1px solid #c0c0c0', userSelect: 'none' }}>
        📁 {title}
      </div>
      {options.map(opt => (
        <Link
          key={opt}
          href={getHref(opt)}
          className={`win-filter-link${selected === opt ? ' active' : ''}`}
        >
          {selected === opt ? '▶ ' : ''}{opt}
        </Link>
      ))}
    </div>
  )
}
