'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getToken, getStoredUser, clearAuth } from '@/lib/auth'
import { Search, Upload, Anchor, User, LogOut, Menu, X } from 'lucide-react'

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
    <header className="sticky top-0 z-50 border-b" style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--hb-border)' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group" style={{ textDecoration: 'none' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Anchor size={15} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--hb-text)' }}>Hugging-Bay</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <NavLink href="/models">Browse</NavLink>
          <NavLink href="/models?sort=popular">Popular</NavLink>
          <NavLink href="/models?sort=recent">Recent</NavLink>
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs ml-auto relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--hb-muted)' }} />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search models…"
            className="input pl-8 py-1.5 text-sm"
            style={{ background: 'var(--hb-surface2)', fontSize: 13 }}
          />
        </form>

        {/* Auth area */}
        <div className="hidden md:flex items-center gap-2 ml-2">
          {user ? (
            <>
              <Link href="/upload" className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                <Upload size={13} /> Upload
              </Link>
              <Link href="/profile" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[#27272a]" style={{ color: 'var(--hb-text)', textDecoration: 'none' }}>
                <User size={13} />
                {user.username}
              </Link>
              <button onClick={handleLogout} className="p-1.5 rounded-lg transition-colors hover:bg-[#27272a]" style={{ color: 'var(--hb-muted)', cursor: 'pointer', border: 'none', background: 'none' }}>
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary py-1.5 px-3 text-xs">Sign in</Link>
              <Link href="/auth/register" className="btn-primary py-1.5 px-3 text-xs">Sign up</Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden ml-auto p-1.5 rounded-lg"
          style={{ border: 'none', background: 'none', color: 'var(--hb-muted)', cursor: 'pointer' }}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: 'var(--hb-border)', background: 'var(--hb-bg)' }}>
          <form onSubmit={handleSearch} className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--hb-muted)' }} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search models…"
              className="input pl-8 text-sm"
            />
          </form>
          <div className="flex flex-col gap-1">
            <MobileNavLink href="/models" onClick={() => setOpen(false)}>Browse Models</MobileNavLink>
            <MobileNavLink href="/models?sort=popular" onClick={() => setOpen(false)}>Popular</MobileNavLink>
            <MobileNavLink href="/models?sort=recent" onClick={() => setOpen(false)}>Recent</MobileNavLink>
            {user ? (
              <>
                <MobileNavLink href="/upload" onClick={() => setOpen(false)}>Upload</MobileNavLink>
                <MobileNavLink href="/profile" onClick={() => setOpen(false)}>Profile ({user.username})</MobileNavLink>
                <button onClick={handleLogout} className="text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#18181b]" style={{ color: 'var(--hb-red)', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link href="/auth/login" className="btn-secondary flex-1 text-xs py-2" onClick={() => setOpen(false)}>Sign in</Link>
                <Link href="/auth/register" className="btn-primary flex-1 text-xs py-2" onClick={() => setOpen(false)}>Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-[#18181b]"
      style={{ color: 'var(--hb-muted)', textDecoration: 'none' }}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#18181b]"
      style={{ color: 'var(--hb-text)', textDecoration: 'none', display: 'block' }}
    >
      {children}
    </Link>
  )
}
