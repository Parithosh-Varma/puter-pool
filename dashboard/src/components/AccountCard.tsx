import { useState } from 'react';
import { PauseCircleIcon, RefreshIcon, TrashIcon, CheckIcon, XIcon } from './icons';

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
interface Props { account: Account; onToggle: () => void; onRefresh: () => void; onDelete: () => void; }

export function PlayIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><polygon points="6 3 20 12 6 21 6 3" /></svg>
  );
}

const STATUS: Record<string, { label: string; color: string; bg: string; stripe: string }> = {
  active: { label: 'ACTIVE', color: 'var(--success)', bg: 'rgba(0,168,90,0.10)', stripe: 'var(--success)' },
  disabled: { label: 'PARKED', color: '#7A838F', bg: 'rgba(122,131,143,0.12)', stripe: '#7A838F' },
  exhausted: { label: 'EMPTY', color: 'var(--warn)', bg: 'rgba(255,184,0,0.15)', stripe: 'var(--warn)' },
  error: { label: 'ERROR', color: 'var(--danger)', bg: 'rgba(255,59,31,0.12)', stripe: 'var(--danger)' },
  pending_verification: { label: 'VERIFYING', color: 'var(--electric)', bg: 'rgba(26,67,255,0.10)', stripe: 'var(--electric)' },
};

export default function AccountCard({ account, onToggle, onRefresh, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState('');
  const meta = STATUS[account.status] || STATUS.disabled;
  const pct = account.credit.limit > 0 ? Math.min((account.credit.used / account.credit.limit) * 100, 100) : 0;
  const remainingPct = 100 - pct;

  const reauthWithPuter = async () => {
    setSaving(true); setMsg('');
    try {
      const puter = (window as any).puter;
      if (!puter?.auth) throw new Error('Puter.js failed to load');
      await puter.auth.signIn();
      const token = puter.auth.getToken ? puter.auth.getToken() : localStorage.getItem('puter.auth.token.v2');
      if (!token) throw new Error('No Puter token received');
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, status: 'pending_verification' }),
      });
      if (res.ok) { setMsg('Token refreshed — verifying…'); onRefresh(); }
      else { const d = await res.json(); setMsg(d.error || 'Failed to update'); }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Re-auth failed');
    } finally { setSaving(false); }
  };

  return (
    <tr style={s.row}>
      <td style={s.cell}>
        <div style={s.idCell}>
          <span style={{ ...s.rail, background: meta.stripe }} />
          <span style={{ ...s.dot, background: meta.color, boxShadow: `0 0 0 6px ${meta.bg}` }} />
          <div style={{ minWidth: 0 }}>
            <div style={s.nameRow}>
              <span style={s.name}>{account.name}</span>
              <span style={{ ...s.statusBadge, color: meta.color, background: meta.bg, borderColor: meta.color }}>{meta.label}</span>
            </div>
            <div style={s.id} className="mono">{account.id}</div>
          </div>
        </div>
      </td>
      <td style={s.cell}>
        <span style={{ ...s.statusPill, background: meta.bg, color: meta.color, borderColor: meta.color }}>{meta.label}</span>
      </td>
      <td style={s.cell}>
        <div style={s.quotaCell}>
          <div style={s.quotaTop} className="mono">
            <span style={s.quotaVal}>{account.credit.remaining.toLocaleString()} <span style={s.quotaSlash}>/ {account.credit.limit.toLocaleString()}</span></span>
            <span style={{ ...s.quotaPct, color: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warn)' : 'var(--success)' }}>{remainingPct.toFixed(0)}% LEFT</span>
          </div>
          <div style={s.segTrack} aria-hidden>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} style={{ ...s.seg, background: (i / 10) * 100 < pct ? (pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warn)' : 'var(--ink)') : 'var(--border)', opacity: (i / 10) * 100 < pct ? 1 : 0.35 }} />
            ))}
          </div>
        </div>
      </td>
      <td style={s.cell}><span className="mono" style={s.monoVal}>{account.health?.latency ? `${account.health.latency.toFixed(0)}ms` : '—'}</span></td>
      <td style={s.cell}><span className="mono" style={s.monoVal}>{account.health?.totalRequests ?? 0}</span></td>
      <td style={s.cell}>
        <div style={s.actions}>
          <button onClick={onToggle} title={account.status === 'disabled' ? 'Enable' : 'Park'} style={{ ...s.actBtn, color: account.status === 'disabled' ? 'var(--success)' : 'var(--muted)' }}>
            {account.status === 'disabled' ? <PlayIcon size={12} /> : <PauseCircleIcon size={12} />}
          </button>
          <button onClick={reauthWithPuter} disabled={saving} title="Re-auth" style={s.actBtn}>
            <RefreshIcon size={12} className={saving ? 'spin' : undefined} />
          </button>
          {confirmDelete ? (
            <span style={s.confirmGroup}>
              <button onClick={() => { onDelete(); setConfirmDelete(false); }} style={s.confirmOk}><CheckIcon size={11} /></button>
              <button onClick={() => setConfirmDelete(false)} style={s.confirmCancel}><XIcon size={11} /></button>
            </span>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete" style={{ ...s.actBtn, color: 'var(--danger)' }}><TrashIcon size={12} /></button>
          )}
        </div>
        {msg && <div style={s.msg} className="mono">{msg}</div>}
      </td>
    </tr>
  );
}

const s: Record<string, React.CSSProperties> = {
  row: { borderBottom: '1px solid var(--border)', background: 'var(--card)', transition: 'background 0.15s' },
  cell: { padding: '12px 14px', verticalAlign: 'middle' },
  idCell: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 },
  rail: { width: 3, alignSelf: 'stretch', minHeight: 38, borderRadius: 999, flexShrink: 0 },
  dot: { width: 8, height: 8, borderRadius: 999, flexShrink: 0, border: '1.5px solid var(--card)' },
  nameRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em', color: 'var(--fg)' },
  statusBadge: { fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', padding: '2px 6px', borderRadius: 999, border: '1px solid', whiteSpace: 'nowrap' },
  id: { fontSize: 10, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.02em' },
  statusPill: { fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '4px 8px', borderRadius: 999, border: '1px solid', whiteSpace: 'nowrap' },
  quotaCell: { minWidth: 150 },
  quotaTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 },
  quotaVal: { fontSize: 11, fontWeight: 800, letterSpacing: '-0.02em' },
  quotaSlash: { color: 'var(--muted)', fontWeight: 500 },
  quotaPct: { fontSize: 9, fontWeight: 800, letterSpacing: '0.08em' },
  segTrack: { display: 'flex', gap: 3 },
  seg: { flex: 1, height: 8, borderRadius: 2, transition: 'background 0.3s', border: '1px solid rgba(0,0,0,0.06)' },
  monoVal: { fontSize: 12, fontWeight: 700 },
  actions: { display: 'flex', alignItems: 'center', gap: 6 },
  actBtn: { width: 28, height: 28, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--fg)', flexShrink: 0 },
  confirmGroup: { display: 'flex', gap: 4 },
  confirmOk: { width: 28, height: 28, borderRadius: 8, border: '1px solid var(--success)', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  confirmCancel: { width: 28, height: 28, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  msg: { fontSize: 10, fontWeight: 700, marginTop: 4, color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
