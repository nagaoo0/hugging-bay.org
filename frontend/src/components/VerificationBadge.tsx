import type { VerificationStatus } from '@/lib/types'

const config: Record<VerificationStatus, { label: string; color: string; bg: string; dot: string }> = {
  verified_author:    { label: 'Verified Author',     color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
  community_verified: { label: 'Community Verified',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', dot: '#3b82f6' },
  mirror:             { label: 'Mirror',               color: '#a855f7', bg: 'rgba(168,85,247,0.12)', dot: '#a855f7' },
  archived:           { label: 'Archived',             color: '#64748b', bg: 'rgba(100,116,139,0.12)', dot: '#64748b' },
  unverified:         { label: 'Unverified',           color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
}

export default function VerificationBadge({ status }: { status: VerificationStatus }) {
  const c = config[status] || config.unverified
  return (
    <span
      className="badge"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}30` }}
    >
      <span
        style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: c.dot,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  )
}
