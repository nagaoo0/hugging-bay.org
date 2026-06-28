'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getToken, getStoredUser, clearAuth } from '@/lib/auth'
import { Search, Upload, Anchor, LogOut, Menu, X } from 'lucide-react'

export default function Header() {
  const router   = useRouter()
  const pathname = usePathname()
  const [user,    setUser]    = useState<{ username: string } | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [open,    setOpen]    = useState(false)

  useEffect(() => {
    setUser(getStoredUser())
  }, [pathname])

  function handleLogout() {
    clearAuth()
    setUser(null)
    router.push('/')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQ.trim()
    if (q) router.push(`/models?q=${encodeURIComponent(q)}`)
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(7,7,12,0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--hb-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" style={{ textDecoration: 'none' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Anchor size={15} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--hb-text)' }}>Hugging-Bay</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-0.5 ml-2">
          <Link href="/models" className="nav-link">Browse</Link>
          <Link href="/models?sort=popular" className="nav-link">Popular</Link>
          <Link href="/models?sort=recent" className="nav-link">Recent</Link>
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs ml-auto relative">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--hb-muted)' }} />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search models…"
            className="input pl-9 py-2"
            style={{ fontSize: 13 }}
          />
        </form>

        {/* Auth area */}
        <div className="hidden md:flex items-center gap-2 ml-2">
          {user ? (
            <>
              <Link href="/upload" className="btn-secondary gap-1.5" style={{ padding: '6px 14px', fontSize: 12, borderRadius: 10 }}>
                <Upload size={12} /> Upload
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ color: 'var(--hb-text)', textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hb-surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--hb-purple-light)' }}>
                  {user.username[0].toUpperCase()}
                </div>
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl"
                style={{ color: 'var(--hb-muted)', cursor: 'pointer', border: 'none', background: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hb-surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary" style={{ padding: '6px 16px', fontSize: 12, borderRadius: 10 }}>Sign in</Link>
              <Link href="/auth/register" className="btn-primary" style={{ padding: '6px 16px', fontSize: 12, borderRadius: 10 }}>Sign up</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden ml-auto p-2 rounded-xl"
          style={{ border: 'none', background: 'var(--hb-surface2)', color: 'var(--hb-muted)', cursor: 'pointer' }}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-5 pt-3 space-y-3" style={{ borderTop: '1px solid var(--hb-border)', background: 'rgba(7,7,12,0.98)' }}>
          <form onSubmit={handleSearch} className="relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--hb-muted)' }} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search models…"
              className="input pl-9"
            />
          </form>
          <div className="flex flex-col gap-0.5">
            <Link href="/models" className="mobile-nav-link" onClick={() => setOpen(false)}>Browse Models</Link>
            <Link href="/models?sort=popular" className="mobile-nav-link" onClick={() => setOpen(false)}>Popular</Link>
            <Link href="/models?sort=recent" className="mobile-nav-link" onClick={() => setOpen(false)}>Recent</Link>
            {user ? (
              <>
                <Link href="/upload" className="mobile-nav-link" onClick={() => setOpen(false)}>Upload</Link>
                <Link href="/profile" className="mobile-nav-link" onClick={() => setOpen(false)}>Profile ({user.username})</Link>
                <button
                  onClick={handleLogout}
                  className="text-left px-4 py-2.5 rounded-xl text-sm font-medium"
                  style={{ color: 'var(--hb-red)', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link href="/auth/login" className="btn-secondary flex-1 justify-center" style={{ padding: '10px', fontSize: 13 }} onClick={() => setOpen(false)}>Sign in</Link>
                <Link href="/auth/register" className="btn-primary flex-1 justify-center" style={{ padding: '10px', fontSize: 13 }} onClick={() => setOpen(false)}>Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
