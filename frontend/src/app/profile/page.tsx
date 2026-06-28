'use client'

import { useEffect, useState } from 'react'
import { getMe, listAPIKeys, createAPIKey, deleteAPIKey } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Key, Plus, Trash2, Copy, Check } from 'lucide-react'
import type { User, APIKey } from '@/lib/types'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [token,      setToken]      = useState<string | null>(null)
  const [user,       setUser]       = useState<User | null>(null)
  const [keys,       setKeys]       = useState<APIKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState('')
  const [copiedKey,  setCopiedKey]  = useState(false)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const t = getToken()
    if (!t) { router.push('/auth/login?next=/profile'); return }
    setToken(t)
    Promise.all([getMe(t), listAPIKeys(t)]).then(([u, k]) => {
      setUser(u)
      setKeys(k || [])
      setLoading(false)
    }).catch(() => router.push('/auth/login'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    try {
      const result = await createAPIKey(token, newKeyName || 'My API Key')
      setCreatedKey((result as { key: string }).key)
      setNewKeyName('')
      const updatedKeys = await listAPIKeys(token)
      setKeys(updatedKeys || [])
    } catch { /* ignore */ }
  }

  async function handleDeleteKey(id: string) {
    if (!token || !confirm('Delete this API key?')) return
    await deleteAPIKey(token, id)
    setKeys(keys.filter(k => k.id !== id))
  }

  async function copyKey() {
    await navigator.clipboard.writeText(createdKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p style={{ color: 'var(--hb-muted)' }}>Loading…</p>
    </div>
  )
  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--hb-purple-light)' }}>
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{user.display_name || user.username}</h1>
              {(user.is_admin || user.is_moderator) && (
                <span className="badge" style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--hb-purple-light)', border: '1px solid rgba(124,58,237,0.25)' }}>
                  {user.is_admin ? 'Admin' : 'Moderator'}
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--hb-muted)' }}>@{user.username} · {user.email}</p>
          </div>
        </div>
        {user.bio && <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--hb-muted)' }}>{user.bio}</p>}
      </div>

      {/* Newly created key */}
      {createdKey && (
        <div className="card p-5" style={{ borderColor: 'var(--hb-green)', background: 'rgba(16,217,160,0.04)' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--hb-green)' }}>API Key Created</h3>
            <button onClick={() => setCreatedKey('')} className="text-xs" style={{ color: 'var(--hb-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Dismiss</button>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--hb-muted)' }}>Save this key — it will not be shown again.</p>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--hb-surface2)', border: '1px solid var(--hb-border)' }}>
            <code className="flex-1 text-xs font-mono break-all" style={{ color: 'var(--hb-green)' }}>{createdKey}</code>
            <button onClick={copyKey} className="shrink-0 p-1.5 rounded-lg transition-colors" style={{ color: copiedKey ? 'var(--hb-green)' : 'var(--hb-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {copiedKey ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* API Keys */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Key size={15} style={{ color: 'var(--hb-purple-light)' }} />
          </div>
          <h2 className="font-semibold">API Keys</h2>
        </div>

        <form onSubmit={handleCreateKey} className="flex gap-2 mb-5">
          <input
            className="input flex-1"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. CLI, Script)"
          />
          <button type="submit" className="btn-primary shrink-0 gap-1.5" style={{ padding: '10px 16px' }}>
            <Plus size={14} /> New Key
          </button>
        </form>

        {keys.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: 'var(--hb-surface2)', border: '1px solid var(--hb-border)' }}>
                <div>
                  <p className="text-sm font-medium">{k.name || 'Unnamed'}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--hb-muted)' }}>
                    hb_…{k.key_preview}
                    {k.last_used_at && ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteKey(k.id)}
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: 'var(--hb-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--hb-red)'; e.currentTarget.style.background = 'rgba(240,72,72,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--hb-muted)'; e.currentTarget.style.background = 'none' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link href="/upload" className="btn-secondary flex-1 justify-center">Upload Model</Link>
        <Link href="/models" className="btn-secondary flex-1 justify-center">Browse Models</Link>
      </div>
    </div>
  )
}
