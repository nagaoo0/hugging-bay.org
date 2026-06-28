'use client'

import { useState, useEffect } from 'react'

const TIPS = [
  "It looks like you're browsing AI models!\nWould you like some help with that?",
  "Did you know? All models here are distributed via BitTorrent — completely free!",
  "Ahoy! Try the search bar to find models by name, architecture, or license.",
  "It looks like you need an API key! Head to your Profile page to create one.",
  "Pro tip: Click the magnet link to load the torrent directly in your BitTorrent client!",
  "It looks like you want to share a model. Hit \"Upload\" in the nav to get started!",
  "FUN FACT: This site was inspired by The Pirate Bay. But for AI. Arr! ☠",
  "It looks like you're still here. Would you like me to stop pointing that out?",
]

export default function Clippy() {
  const [visible,   setVisible]   = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [tipIdx,    setTipIdx]    = useState(0)
  const [shaking,   setShaking]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 4500)
    return () => clearTimeout(t)
  }, [])

  function nextTip() {
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
    setTipIdx(i => (i + 1) % TIPS.length)
  }

  if (dismissed || !visible) return null

  return (
    <>
      <style>{`
        @keyframes clippy-bob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-5px) rotate(6deg); }
        }
        @keyframes clippy-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25%       { transform: translateX(-4px) rotate(-10deg); }
          75%       { transform: translateX(4px) rotate(10deg); }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        userSelect: 'none',
      }}>
        {/* Speech bubble */}
        <div style={{
          background: 'var(--hb-surface)',
          border: '1px solid var(--hb-border2)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          padding: '12px 14px',
          maxWidth: 240,
          fontSize: 12,
          fontFamily: 'inherit',
          lineHeight: 1.55,
          position: 'relative',
          color: 'var(--hb-text)',
        }}>
          {/* Bubble tail */}
          <div style={{ position: 'absolute', bottom: -7, right: 28, width: 12, height: 12, background: 'var(--hb-surface)', border: '1px solid var(--hb-border2)', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--hb-muted)' }}>📎 Clippy</span>
            <button
              onClick={() => setDismissed(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--hb-muted)', padding: '0 0 0 8px', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}
            >×</button>
          </div>

          {/* Tip */}
          <p style={{ marginBottom: 10, whiteSpace: 'pre-line', minHeight: 36, color: 'var(--hb-text)', fontSize: 12 }}>{TIPS[tipIdx]}</p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button onClick={nextTip} className="btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }}>
              Next tip
            </button>
            <button onClick={() => setDismissed(true)} className="btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }}>
              Dismiss
            </button>
          </div>
        </div>

        {/* Clippy character */}
        <button
          onClick={nextTip}
          title="📎 Clippy — click for tips"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginRight: 8,
            fontSize: 48,
            lineHeight: 1,
            display: 'block',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
            animation: shaking
              ? 'clippy-shake 0.5s ease'
              : 'clippy-bob 2.5s ease-in-out infinite',
          }}
        >
          📎
        </button>
      </div>
    </>
  )
}
