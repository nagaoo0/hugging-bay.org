'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Search, Upload, User, LogOut, Menu, X } from 'lucide-react'
import { getToken, getStoredUser, clearAuth } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  useEffect(() => {
    setUser(getStoredUser())
    setToken(getToken())
  }, [pathname])

  function handleLogout() {
    clearAuth()
    setUser(null)
    router.push('/')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQ.trim()) router.push(`/models?q=${encodeURIComponent(searchQ.trim())}`)
  }

  return (
    <header style={{ background: 'var(--hb-surface)', borderBottom: '1px solid var(--hb-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold gradient-text">⚓ Hugging-Bay</span>
          </Link>

          {/* Search bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--hb-muted)' }}
              />
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search models…"
                className="input pl-9 h-9"
              />
            </div>
          </form>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 ml-auto">
            <Link href="/models" className="px-3 py-1.5 rounded-md text-sm text-hb-muted hover:text-hb-text transition-colors">
              Models
            </Link>
            {token && (
              <Link href="/upload" className="btn-primary text-xs h-8 px-3">
                <Upload size={13} />
                Upload
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-1 ml-1">
                <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-hb-muted hover:text-hb-text transition-colors">
                  <User size={14} />
                  {user.username}
                </Link>
                <button onClick={handleLogout} className="p-1.5 text-hb-muted hover:text-hb-red transition-colors rounded-md">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/auth/login" className="btn-secondary text-xs h-8 px-3">Sign in</Link>
                <Link href="/auth/register" className="btn-primary text-xs h-8 px-3">Join</Link>
              </div>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden ml-auto p-2 text-hb-muted"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--hb-muted)' }} />
                <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search models…" className="input pl-9" />
              </div>
            </form>
            <Link href="/models" className="block px-2 py-1.5 text-sm text-hb-muted">Models</Link>
            {user ? (
              <>
                <Link href="/profile" className="block px-2 py-1.5 text-sm text-hb-muted">Profile</Link>
                <Link href="/upload" className="block px-2 py-1.5 text-sm text-hb-muted">Upload</Link>
                <button onClick={handleLogout} className="block px-2 py-1.5 text-sm text-hb-red">Sign out</button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login" className="btn-secondary text-sm flex-1 justify-center">Sign in</Link>
                <Link href="/auth/register" className="btn-primary text-sm flex-1 justify-center">Join</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
