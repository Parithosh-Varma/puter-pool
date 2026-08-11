import { useState } from 'react';
import {
  PauseCircleIcon,
  RefreshIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
} from './icons';

interface Account {
  id: string;
  name: string;
  status: string;
  health: {
    status: string;
    lastCheck: string | null;
    latency: number;
    errorRate: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    consecutiveFailures: number;
  };
  credit: {
    remaining: number;
    limit: number;
    used: number;
    resetAt: string;
  };
}

interface Props {
  account: Account;
  onToggle: () => void;
  onRefresh: () => void;
  onDelete: () => void;
}

export function PlayIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

const STATUS_BADGES: Record<string, { color: string; bg: string }> = {
  active: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  disabled: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
  exhausted: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  error: { color: '#fb7185', bg: 'rgba(251, 113, 133, 0.1)' },
  pending_verification: { color: '#a5b4fc', bg: 'rgba(165, 180, 252, 0.1)' },
};

export default function AccountCard({ account, onToggle, onRefresh, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState('');

  const badge = STATUS_BADGES[account.status] || { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
  const creditPct = account.credit.limit > 0
    ? Math.min((account.credit.used / account.credit.limit) * 100, 100)
    : 0;

  const reauthWithPuter = async () => {
    setSaving(true);
    setMsg('');
    try {
      const puter = (window as any).puter;
      if (!puter?.auth) throw new Error('Puter.js failed to load');
      await puter.auth.signIn();
      const token = puter.auth.getToken
        ? puter.auth.getToken()
        : localStorage.getItem('puter.auth.token.v2');
      if (!token) throw new Error('No Puter token received');
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, status: 'pending_verification' }),
      });
      if (res.ok) {
        setMsg('Token updated! Re-verifying...');
        onRefresh();
      } else {
        const data = await res.json();
        setMsg(data.error || 'Failed to update');
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Re-auth failed — popup blocked?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="table-row-hover" style={styles.row}>
      <td style={styles.cell}>
        <div style={styles.accountCell}>
          <span style={{ ...styles.statusDot, background: badge.color }} />
          <div>
            <div style={styles.name}>{account.name}</div>
            <div style={styles.id}>{account.id}</div>
          </div>
        </div>
      </td>
      <td style={styles.cell}>
        <span style={{ ...styles.badge, color: badge.color, background: badge.bg }}>
          {account.status.replace('_', ' ')}
        </span>
      </td>
      <td style={styles.cell}>
        <div style={styles.quotaCell}>
          <div style={styles.quotaTop}>
            <span style={styles.quotaValue}>
              {account.credit.remaining.toLocaleString()} <span style={styles.quotaLimit}>/ {account.credit.limit.toLocaleString()}</span>
            </span>
            <span style={styles.quotaPct}>{creditPct.toFixed(0)}%</span>
          </div>
          <div style={styles.barBg}>
            <div style={{
              ...styles.barFill,
              width: `${creditPct}%`,
              background: creditPct > 80 ? '#fb7185' : creditPct > 50 ? '#fbbf24' : '#34d399',
            }} />
          </div>
        </div>
      </td>
      <td style={styles.cell}>
        <span style={styles.mono}>{account.health?.latency ? `${account.health.latency.toFixed(0)}ms` : '-'}</span>
      </td>
      <td style={styles.cell}>
        <span style={styles.mono}>{account.health?.totalRequests || 0}</span>
      </td>
      <td style={styles.cell}>
        <div style={styles.actions}>
          <button
            onClick={onToggle}
            title={account.status === 'disabled' ? 'Enable' : 'Disable'}
            style={{ ...styles.iconBtn, ...(account.status === 'disabled' ? styles.iconBtnGreen : styles.iconBtnRed) }}
          >
            {account.status === 'disabled' ? <PlayIcon size={14} /> : <PauseCircleIcon size={14} />}
          </button>
          <button
            onClick={reauthWithPuter}
            disabled={saving}
            title="Re-auth with Puter"
            style={{ ...styles.iconBtn, ...styles.iconBtnIndigo }}
          >
            <RefreshIcon size={14} className={saving ? 'spin' : undefined} />
          </button>
          {confirmDelete ? (
            <span style={styles.deleteConfirm}>
              <button onClick={() => { onDelete(); setConfirmDelete(false); }} style={styles.confirmBtn} title="Confirm delete">
                <CheckIcon size={14} />
              </button>
              <button onClick={() => setConfirmDelete(false)} style={styles.cancelBtn} title="Cancel">
                <XIcon size={14} />
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete" style={{ ...styles.iconBtn, ...styles.iconBtnRed }}>
              <TrashIcon size={14} />
            </button>
          )}
          {msg && <span style={{ ...styles.msg, color: msg.includes('error') || msg.includes('Failed') || msg.includes('Network') ? '#fb7185' : '#34d399' }}>{msg}</span>}
        </div>
      </td>
    </tr>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    borderBottom: '1px solid var(--glass-border)',
  },
  cell: {
    padding: '14px 16px',
    verticalAlign: 'middle',
  },
  accountCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  id: {
    fontSize: 11,
    color: 'var(--muted-foreground)',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: 1,
  },
  badge: {
    padding: '4px 10px',
    borderRadius: 9999,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  quotaCell: {
    minWidth: 140,
  },
  quotaTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quotaValue: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
  },
  quotaLimit: {
    color: 'var(--muted-foreground)',
    fontWeight: 400,
  },
  quotaPct: {
    fontSize: 10,
    color: 'var(--muted-foreground)',
  },
  barBg: {
    height: 6,
    background: 'var(--secondary)',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 9999,
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  mono: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'var(--input-bg)',
    transition: 'all 0.2s',
  },
  iconBtnGreen: {
    color: '#34d399',
  },
  iconBtnRed: {
    color: '#fb7185',
  },
  iconBtnIndigo: {
    color: '#a5b4fc',
  },
  deleteConfirm: {
    display: 'flex',
    gap: 4,
  },
  confirmBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: 'none',
    background: '#059669',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  cancelBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: '1px solid var(--glass-border)',
    background: 'transparent',
    color: 'var(--muted-foreground)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  msg: {
    fontSize: 11,
    fontWeight: 500,
    marginLeft: 4,
    maxWidth: 160,
  },
};
