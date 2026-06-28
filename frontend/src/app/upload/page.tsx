'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createModel, createRelease } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { Upload, Plus, X } from 'lucide-react'
import Link from 'next/link'

export default function UploadPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setToken(getToken())
    setMounted(true)
  }, [])

  const [step, setStep] = useState<'model' | 'release'>('model')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdSlug, setCreatedSlug] = useState('')

  // Model fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [architecture, setArchitecture] = useState('')
  const [framework, setFramework] = useState('')
  const [license, setLicense] = useState('')
  const [language, setLanguage] = useState('en')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Release fields
  const [version, setVersion] = useState('1.0')
  const [releaseDesc, setReleaseDesc] = useState('')
  const [quantization, setQuantization] = useState('')
  const [paramCount, setParamCount] = useState('')
  const [sha256, setSha256] = useState('')
  const [sha512, setSha512] = useState('')
  const [blake3, setBlake3] = useState('')
  const [torrentFile, setTorrentFile] = useState<File | null>(null)

  if (!mounted) return null

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-xl font-bold mb-3">Sign in to upload</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--hb-muted)' }}>You need an account to upload models.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/login?next=/upload" className="btn-primary">Sign in</Link>
          <Link href="/auth/register" className="btn-secondary">Create account</Link>
        </div>
      </div>
    )
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  async function submitModel(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const model = await createModel(token!, { name, description, architecture, framework, license, language, tags })
      setCreatedSlug(model.slug)
      setStep('release')
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function submitRelease(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const metadata = {
        version, description: releaseDesc,
        sha256, sha512, blake3,
        parameter_count: paramCount ? parseInt(paramCount) : 0,
        quantization,
        file_manifest: [],
      }
      const fd = new FormData()
      fd.append('metadata', JSON.stringify(metadata))
      if (torrentFile) fd.append('torrent', torrentFile)

      await createRelease(token!, createdSlug, fd)
      router.push(`/models/${createdSlug}`)
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Progress steps */}
      <div className="flex items-center gap-3 mb-8">
        {(['model', 'release'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-12 h-px" style={{ background: 'var(--hb-border)' }} />}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step === s ? 'var(--hb-purple)' : s === 'release' && step === 'release' ? 'var(--hb-green)' : 'var(--hb-surface2)',
                  color: step === s ? 'white' : 'var(--hb-muted)',
                  border: '1px solid ' + (step === s ? 'var(--hb-purple)' : 'var(--hb-border)'),
                }}
              >
                {i + 1}
              </div>
              <span className="text-sm" style={{ color: step === s ? 'var(--hb-text)' : 'var(--hb-muted)' }}>
                {s === 'model' ? 'Model Info' : 'Add Release'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--hb-red)', border: '1px solid rgba(239,68,68,0.3)' }}>
          {error}
        </div>
      )}

      {step === 'model' && (
        <form onSubmit={submitModel} className="card p-6 space-y-5">
          <h1 className="text-xl font-bold">Upload a Model</h1>

          <Field label="Model Name *">
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Llama 3 70B" required />
          </Field>

          <Field label="Description">
            <textarea className="input min-h-[80px] resize-y" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the model, its capabilities, training data…" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Architecture">
              <input className="input" value={architecture} onChange={e => setArchitecture(e.target.value)} placeholder="llama, mistral, bert…" />
            </Field>
            <Field label="Format / Framework">
              <input className="input" value={framework} onChange={e => setFramework(e.target.value)} placeholder="gguf, safetensors…" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="License">
              <input className="input" value={license} onChange={e => setLicense(e.target.value)} placeholder="Apache-2.0, MIT…" />
            </Field>
            <Field label="Language">
              <input className="input" value={language} onChange={e => setLanguage(e.target.value)} placeholder="en, multilingual…" />
            </Field>
          </div>

          <Field label="Tags">
            <div className="flex gap-2 flex-wrap mb-2">
              {tags.map(t => (
                <span key={t} className="badge flex items-center gap-1"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.3)' }}>
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add tag…"
              />
              <button type="button" onClick={addTag} className="btn-secondary px-3">
                <Plus size={14} />
              </button>
            </div>
          </Field>

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Creating…' : 'Continue to Release →'}
          </button>
        </form>
      )}

      {step === 'release' && (
        <form onSubmit={submitRelease} className="card p-6 space-y-5">
          <h1 className="text-xl font-bold">Add First Release</h1>
          <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>
            Model created! Now add a release with your torrent file.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Version *">
              <input className="input" value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0, v2-Q4_K_M…" required />
            </Field>
            <Field label="Quantization">
              <input className="input" value={quantization} onChange={e => setQuantization(e.target.value)} placeholder="Q4_K_M, fp16…" />
            </Field>
          </div>

          <Field label="Parameters (e.g. 7000000000 for 7B)">
            <input className="input" type="number" value={paramCount} onChange={e => setParamCount(e.target.value)} placeholder="7000000000" />
          </Field>

          <Field label="Release Notes">
            <textarea className="input min-h-[60px] resize-y" value={releaseDesc} onChange={e => setReleaseDesc(e.target.value)} placeholder="What changed in this version?" />
          </Field>

          <Field label="Torrent File (.torrent)">
            <label className="flex flex-col items-center justify-center p-6 rounded-lg cursor-pointer border-dashed border-2 transition-colors"
              style={{ borderColor: torrentFile ? 'var(--hb-green)' : 'var(--hb-border)', background: 'var(--hb-surface2)' }}>
              <Upload size={24} className="mb-2" style={{ color: torrentFile ? 'var(--hb-green)' : 'var(--hb-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--hb-muted)' }}>
                {torrentFile ? torrentFile.name : 'Click to upload .torrent file'}
              </span>
              <input type="file" accept=".torrent" className="hidden" onChange={e => setTorrentFile(e.target.files?.[0] || null)} />
            </label>
          </Field>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--hb-muted)' }}>
              Verification Hashes (optional but recommended)
            </p>
            <Field label="SHA-256">
              <input className="input font-mono text-xs" value={sha256} onChange={e => setSha256(e.target.value)} placeholder="64 hex chars" />
            </Field>
            <Field label="SHA-512">
              <input className="input font-mono text-xs" value={sha512} onChange={e => setSha512(e.target.value)} placeholder="128 hex chars" />
            </Field>
            <Field label="BLAKE3">
              <input className="input font-mono text-xs" value={blake3} onChange={e => setBlake3(e.target.value)} placeholder="64 hex chars" />
            </Field>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('model')} className="btn-secondary flex-1 justify-center">
              ← Back
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? 'Publishing…' : '🚀 Publish Release'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
