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
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [keys, setKeys] = useState<APIKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = getToken()
    if (!t) { router.push('/auth/login?next=/profile'); return }
    setToken(t)
    Promise.all([getMe(t), listAPIKeys(t)]).then(([u, k]) => {
      setUser(u)
      setKeys(k || [])
      setLoading(false)
    }).catch(() => {
      router.push('/auth/login')
    })
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
    } catch {
      // ignore
    }
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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><p style={{ color: 'var(--hb-muted)' }}>Loading…</p></div>
  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#a855f7' }}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.display_name || user.username}</h1>
            <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>@{user.username}</p>
            <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>{user.email}</p>
          </div>
          {(user.is_admin || user.is_moderator) && (
            <span className="ml-auto badge" style={{ background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.3)' }}>
              {user.is_admin ? 'Admin' : 'Moderator'}
            </span>
          )}
        </div>
        {user.bio && <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>{user.bio}</p>}
      </div>

      {/* Newly created key display */}
      {createdKey && (
        <div className="card p-5 border" style={{ borderColor: 'var(--hb-green)', background: 'rgba(16,185,129,0.05)' }}>
          <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--hb-green)' }}>API Key Created</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--hb-muted)' }}>
            Save this key — it will not be shown again.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--hb-surface2)', border: '1px solid var(--hb-border)' }}>
            <code className="flex-1 text-xs font-mono break-all" style={{ color: 'var(--hb-green)' }}>{createdKey}</code>
            <button onClick={copyKey} className="shrink-0 p-1.5 rounded" style={{ color: 'var(--hb-muted)' }}>
              {copiedKey ? <Check size={14} style={{ color: 'var(--hb-green)' }} /> : <Copy size={14} />}
            </button>
          </div>
          <button onClick={() => setCreatedKey('')} className="mt-3 text-xs" style={{ color: 'var(--hb-muted)' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* API Keys */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Key size={16} style={{ color: 'var(--hb-purple)' }} />
          <h2 className="font-semibold">API Keys</h2>
        </div>

        <form onSubmit={handleCreateKey} className="flex gap-2 mb-5">
          <input
            className="input flex-1"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. CLI, Script)"
          />
          <button type="submit" className="btn-primary shrink-0">
            <Plus size={14} />
            New Key
          </button>
        </form>

        {keys.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--hb-muted)' }}>No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'var(--hb-surface2)', border: '1px solid var(--hb-border)' }}>
                <div>
                  <p className="text-sm font-medium">{k.name || 'Unnamed'}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--hb-muted)' }}>
                    hb_…{k.key_preview}
                    {k.last_used_at && ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <button onClick={() => handleDeleteKey(k.id)} className="p-1.5 rounded text-hb-muted hover:text-hb-red transition-colors">
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
