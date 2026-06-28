'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getToken, getStoredUser, clearAuth } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'

function NavMenuItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-2 py-0.5 text-black no-underline text-[11px] font-[Tahoma,sans-serif] whitespace-nowrap hover:bg-[#000080] hover:text-white"
    >
      {children}
    </Link>
  )
}

export default function Header() {
  const router   = useRouter()
  const pathname = usePathname()
  const [user,   setUser]   = useState<{ username: string } | null>(null)
  const [token,  setToken]  = useState<string | null>(null)
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
    <header style={{ boxShadow: '0 3px 0 #000' }}>

      {/* ── Title bar: WinXP blue gradient ── */}
      <div style={{ background: 'linear-gradient(to right, #0a246a, #1060d4 80%, #4080c8)' }}>
        <div className="max-w-7xl mx-auto px-2 flex items-center h-9 gap-3">
          <Link
            href="/"
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.4rem',
              letterSpacing: '0.08em',
              color: '#f5e642',
              textDecoration: 'none',
              textShadow: '1px 1px 0 #000',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            ⚓ HUGGING-BAY
          </Link>

          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontFamily: 'Tahoma', letterSpacing: 1 }} className="hidden md:inline">
            — OPEN AI MODEL REGISTRY v1.0
          </span>

          {/* Fake WinXP window controls */}
          <div className="ml-auto flex items-center gap-0.5">
            <button className="win-ctrl" tabIndex={-1} aria-hidden>─</button>
            <button className="win-ctrl" tabIndex={-1} aria-hidden>□</button>
            <button className="win-ctrl win-close" tabIndex={-1} aria-hidden>✕</button>
          </div>
        </div>
      </div>

      {/* ── Menu bar: WinXP silver ── */}
      <div style={{ background: '#c0c0c0', borderBottom: '2px solid #808080' }}>
        <div className="max-w-7xl mx-auto px-2 flex items-center gap-1 flex-wrap" style={{ minHeight: 28 }}>

          <nav className="flex items-center">
            <NavMenuItem href="/models">📁 Browse</NavMenuItem>
            <NavMenuItem href="/models?sort=recent">🕐 Recent</NavMenuItem>
            <NavMenuItem href="/models?sort=popular">🔥 Popular</NavMenuItem>
            {token && <NavMenuItem href="/upload">📤 Upload</NavMenuItem>}
          </nav>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 18, background: '#808080', margin: '0 4px', flexShrink: 0 }} />

          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-1 flex-1 min-w-0 max-w-xs">
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search models..."
              className="win-input"
              style={{ height: 20, fontSize: '11px' }}
            />
            <button type="submit" className="win-btn" style={{ padding: '1px 8px', fontSize: '11px', height: 22 }}>
              🔍
            </button>
          </form>

          {/* Auth */}
          <div className="ml-auto flex items-center gap-1">
            {user ? (
              <>
                <NavMenuItem href="/profile">👤 {user.username}</NavMenuItem>
                <button
                  onClick={handleLogout}
                  className="win-btn"
                  style={{ padding: '2px 10px', fontSize: '11px', height: 22, color: '#c00000' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login"    className="win-btn" style={{ padding: '2px 10px', fontSize: '11px', height: 22 }}>Sign In</Link>
                <Link href="/auth/register" className="win-btn" style={{ padding: '2px 10px', fontSize: '11px', height: 22, fontWeight: 'bold' }}>Join</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── CS 1.6 HUD status strip ── */}
      <div style={{
        background: '#050f05',
        borderBottom: '1px solid #00c851',
        padding: '2px 12px',
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '10px',
        color: '#00c851',
        display: 'flex',
        gap: 20,
        alignItems: 'center',
      }}>
        <span style={{ color: '#4ade80' }}>● ONLINE</span>
        <span>BITTORRENT: ACTIVE</span>
        <span>PROTOCOL: DHT+TRACKERS</span>
        <span className="ml-auto" style={{ color: '#f5e642' }}>NO GATEKEEPERS // SHARE FREELY</span>
      </div>

    </header>
  )
}
