import Clippy from './Clippy'

export default function Footer() {
  return (
    <>
      <Clippy />

      <footer style={{ marginTop: 'auto' }}>
        {/* WinXP status bar style */}
        <div style={{
          background: '#c0c0c0',
          borderTop: '2px solid',
          borderColor: '#fff #808080 #808080 #fff',
          padding: '4px 10px',
        }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.1rem',
                color: '#0a246a',
                letterSpacing: '0.05em',
              }}>
                ⚓ HUGGING-BAY
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'Tahoma', color: '#808080' }}>
                Open, decentralized AI model registry
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: '11px', fontFamily: 'Tahoma' }}>
              <a href="/api/latest"                             style={{ color: '#0000ee' }}>API</a>
              <span style={{ color: '#808080' }}>|</span>
              <a href="https://github.com/hugging-bay" target="_blank" rel="noopener noreferrer" style={{ color: '#0000ee' }}>GitHub</a>
            </div>
          </div>
        </div>

        {/* Dark strip — disclaimer */}
        <div style={{
          background: '#050f05',
          borderTop: '1px solid #00c851',
          padding: '4px 12px',
          textAlign: 'center',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '9px',
          color: '#333',
          letterSpacing: '0.05em',
        }}>
          <span style={{ color: '#1a4d1a' }}>
            NO COPYRIGHT // SHARE AND ENJOY // NOT AFFILIATED WITH HUGGING FACE //
            SEED GENEROUSLY // ARR!
          </span>
        </div>
      </footer>
    </>
  )
}
