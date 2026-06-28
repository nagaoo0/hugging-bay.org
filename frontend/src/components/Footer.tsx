export default function Footer() {
  return (
    <footer
      className="mt-auto py-8 text-center text-xs"
      style={{ borderTop: '1px solid var(--hb-border)', color: 'var(--hb-muted)' }}
    >
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          <span className="font-semibold" style={{ color: 'var(--hb-text)' }}>⚓ Hugging-Bay</span>
          {' '}— Open, decentralized AI model registry
        </span>
        <div className="flex gap-4">
          <a href="/api/latest" className="hover:text-hb-text transition-colors">API</a>
          <a href="https://github.com/hugging-bay" target="_blank" rel="noopener noreferrer" className="hover:text-hb-text transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  )
}
