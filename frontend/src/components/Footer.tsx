import Link from 'next/link'
import { Anchor } from 'lucide-react'
import Clippy from './Clippy'

export default function Footer() {
  return (
    <footer className="border-t mt-auto" style={{ borderColor: 'var(--hb-border)', background: 'var(--hb-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <Anchor size={16} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--hb-text)' }}>Hugging-Bay</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--hb-muted)' }}>Open, decentralized AI model registry</p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { href: '/models',         label: 'Browse' },
              { href: '/upload',         label: 'Upload' },
              { href: '/auth/login',     label: 'Sign in' },
              { href: '/auth/register',  label: 'Sign up' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-xs transition-colors hover:text-white" style={{ color: 'var(--hb-muted)', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2" style={{ borderColor: 'var(--hb-border)' }}>
          <p className="text-xs" style={{ color: 'var(--hb-muted)' }}>
            No copyrights. All models freely redistributable. Not affiliated with Hugging Face.
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--hb-border2)' }}>
            BitTorrent · DHT · Decentralized
          </p>
        </div>
      </div>
      <Clippy />
    </footer>
  )
}
