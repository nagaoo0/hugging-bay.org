'use client'

import { useState } from 'react'
import { Magnet, Copy, Check } from 'lucide-react'

export default function MagnetButton({ magnetUri }: { magnetUri: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(magnetUri)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={magnetUri}
        className="btn-primary"
        style={{ background: '#7c3aed' }}
      >
        <Magnet size={15} />
        Open Magnet
      </a>
      <button
        onClick={copy}
        className="btn-secondary"
        title="Copy magnet link"
      >
        {copied ? <Check size={14} style={{ color: 'var(--hb-green)' }} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
