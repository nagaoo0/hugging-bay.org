import { listModels, search as searchAPI } from '@/lib/api'
import ModelCard from '@/components/ModelCard'
import Link from 'next/link'
import type { Model } from '@/lib/types'

const ARCHITECTURES = ['llama', 'mistral', 'falcon', 'bloom', 'gpt2', 'bert', 'stable-diffusion', 'whisper']
const LICENSES = ['Apache-2.0', 'MIT', 'GPL-3.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'LLAMA', 'Llama-2']
const FRAMEWORKS = ['gguf', 'safetensors', 'pytorch', 'onnx', 'jax', 'flax']

interface PageProps {
  searchParams: {
    page?: string
    q?: string
    architecture?: string
    license?: string
    framework?: string
  }
}

export const metadata = { title: 'Models' }

export default async function ModelsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1', 10)
  const { q, architecture, license, framework } = searchParams

  let models: Model[] = []
  let total = 0

  try {
    if (q) {
      const sr = await searchAPI(q, page, 20)
      models = (sr.hits as Model[]) || []
      total = Number(sr.total_hits) || 0
    } else {
      const result = await listModels({ page, limit: 20, architecture, license, framework })
      models = result.data || []
      total = result.total
    }
  } catch {
    // show empty state
  }
  const totalPages = Math.ceil(total / 20)

  function filterHref(key: string, value: string) {
    const current = searchParams as Record<string, string>
    const next: Record<string, string> = { ...current, [key]: value, page: '1' }
    if (current[key] === value) delete next[key]
    return '/models?' + new URLSearchParams(next).toString()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            {q ? <>Results for &ldquo;{q}&rdquo;</> : 'AI Models'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>
            {total.toLocaleString()} model{total !== 1 ? 's' : ''}{q ? ' found' : ' in the registry'}
          </p>
        </div>
        <Link href="/upload" className="btn-primary hidden sm:inline-flex">Upload Model</Link>
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <FilterGroup
            title="Architecture"
            options={ARCHITECTURES}
            selected={architecture}
            getHref={v => filterHref('architecture', v)}
          />
          <FilterGroup
            title="License"
            options={LICENSES}
            selected={license}
            getHref={v => filterHref('license', v)}
          />
          <FilterGroup
            title="Format"
            options={FRAMEWORKS}
            selected={framework}
            getHref={v => filterHref('framework', v)}
          />
        </aside>

        {/* Models grid */}
        <div className="flex-1 min-w-0">
          {models.length === 0 ? (
            <div className="text-center py-20 card">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-semibold mb-2">No models found</p>
              <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>Try different filters or be the first to upload.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {models.map((m: Model) => <ModelCard key={m.id} model={m} />)}
              </div>
              {totalPages > 1 && (
                <Pagination current={page} total={totalPages} searchParams={searchParams as Record<string, string>} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterGroup({
  title, options, selected, getHref,
}: {
  title: string
  options: string[]
  selected?: string
  getHref: (v: string) => string
}) {
  return (
    <div className="mb-6">
      <p className="label mb-2">{title}</p>
      <div className="space-y-0.5">
        {options.map(opt => (
          <Link
            key={opt}
            href={getHref(opt)}
            className="block px-3 py-1.5 rounded-md text-sm transition-colors"
            style={{
              color: selected === opt ? 'var(--hb-purple-light)' : 'var(--hb-muted)',
              background: selected === opt ? 'rgba(124,58,237,0.12)' : 'transparent',
            }}
          >
            {opt}
          </Link>
        ))}
      </div>
    </div>
  )
}

function Pagination({ current, total, searchParams }: { current: number; total: number; searchParams: Record<string, string> }) {
  function href(p: number) {
    return '/models?' + new URLSearchParams({ ...searchParams, page: String(p) }).toString()
  }
  return (
    <div className="flex items-center gap-2 justify-center">
      {current > 1 && <Link href={href(current - 1)} className="btn-secondary text-sm">← Prev</Link>}
      <span className="text-sm" style={{ color: 'var(--hb-muted)' }}>
        Page {current} of {total}
      </span>
      {current < total && <Link href={href(current + 1)} className="btn-secondary text-sm">Next →</Link>}
    </div>
  )
}
