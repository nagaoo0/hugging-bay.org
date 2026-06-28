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
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 6,
      userSelect: 'none',
    }}>

      {/* Speech bubble */}
      <div style={{
        background: '#ffffe1',
        border: '2px solid #000',
        boxShadow: '3px 3px 0 #000',
        padding: '10px 12px',
        maxWidth: 230,
        fontSize: '11px',
        fontFamily: 'Tahoma, MS Sans Serif, sans-serif',
        lineHeight: 1.55,
        position: 'relative',
        color: '#000',
      }}>
        {/* Bubble tail */}
        <div style={{ position: 'absolute', bottom: -10, right: 32, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #000' }} />
        <div style={{ position: 'absolute', bottom: -6, right: 34, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #ffffe1' }} />

        {/* Title bar of the bubble */}
        <div style={{
          background: 'linear-gradient(to right, #0a246a, #1060d4)',
          color: 'white',
          fontSize: '10px',
          fontWeight: 'bold',
          padding: '2px 6px',
          margin: '-10px -12px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          letterSpacing: 0.5,
        }}>
          <span>📎 Clippy</span>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: '#c0c0c0',
              border: '1px solid',
              borderColor: '#fff #808080 #808080 #fff',
              width: 14,
              height: 12,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: 0,
              color: '#000',
            }}
          >✕</button>
        </div>

        {/* Tip text */}
        <p style={{ marginBottom: 8, whiteSpace: 'pre-line', minHeight: 34 }}>{TIPS[tipIdx]}</p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <button onClick={nextTip} className="win-btn" style={{ fontSize: '10px', padding: '2px 10px' }}>
            Next tip
          </button>
          <button onClick={() => setDismissed(true)} className="win-btn" style={{ fontSize: '10px', padding: '2px 10px' }}>
            Dismiss
          </button>
        </div>
      </div>

      {/* Clippy character — bouncing paperclip */}
      <button
        onClick={nextTip}
        title="📎 Clippy — click for tips"
        style={{
          background: 'none',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          cursor: 'pointer',
          padding: 0,
          marginRight: 10,
          fontSize: 56,
          lineHeight: 1,
          display: 'block',
          filter: 'drop-shadow(2px 2px 0 #000)',
          animation: shaking
            ? 'clippy-shake 0.5s ease'
            : 'clippy-bob 2.5s ease-in-out infinite',
        }}
      >
        📎
      </button>
    </div>
  )
}
