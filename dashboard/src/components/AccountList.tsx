import AccountCard from './AccountCard';
import { InboxIcon } from './icons';

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
  credit: { remaining: number; limit: number; used: number; resetAt: string; };
}
interface Props { accounts: Account[]; onToggle: (id: string, status: string) => void; onRefresh: () => void; onDelete: (id: string) => void; }

export default function AccountList({ accounts, onToggle, onRefresh, onDelete }: Props) {
  if (accounts.length === 0) {
    return (
      <div className="depot-card" style={s.empty}>
        <div style={s.emptyIcon}><InboxIcon size={22} /></div>
        <div style={s.emptyTitle}>Rack empty</div>
        <div style={s.emptyText}>No cartridges slotted. Add an account to open the rail.</div>
        <div style={s.emptyMeta} className="mono">TIP — Use “Add cartridge” → Sign in with Puter → token is stored server-side.</div>
      </div>
    );
  }
  return (
    <div className="depot-card" style={s.wrap}>
      <div style={s.tableHead} className="mono">
        <span>MANIFEST — {accounts.length} {accounts.length === 1 ? 'UNIT' : 'UNITS'}</span>
        <span style={s.tableHint}>HOT-SWAPPABLE · LED = STATUS · SEGMENTS = QUOTA USED</span>
      </div>
      <div style={s.scroll}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Unit / ID', 'Status', 'Quota', 'Latency', 'Routed', 'Bay'].map(h => (
                <th key={h} style={s.th} className="mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map(a => (
              <AccountCard key={a.id} account={a} onToggle={() => onToggle(a.id, a.status)} onRefresh={onRefresh} onDelete={() => onDelete(a.id)} />
            ))}
          </tbody>
        </table>
      </div>
      <div style={s.footer} className="mono">
        <span style={s.footerStripe} aria-hidden />
        <span>Credentials sealed on server. Tokens never print to tape.</span>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { overflow: 'hidden', padding: 0 },
  tableHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--paper-2)', borderBottom: '1.5px solid var(--border)', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--muted)', flexWrap: 'wrap' },
  tableHint: { fontSize: 9, letterSpacing: '0.08em', opacity: 0.8 },
  scroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 720 },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--muted)', borderBottom: '1.5px solid var(--border)', whiteSpace: 'nowrap', background: 'var(--card)' },
  footer: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--muted)', borderTop: '1px dashed var(--border)', background: 'var(--paper-2)' },
  footerStripe: { width: 28, height: 6, borderRadius: 999, background: 'repeating-linear-gradient(90deg, var(--warn) 0 6px, var(--ink) 6px 12px)', flexShrink: 0, border: '1px solid var(--ink)' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '40px 20px', textAlign: 'center' },
  emptyIcon: { width: 44, height: 44, borderRadius: 10, background: 'var(--paper-2)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: 6 },
  emptyTitle: { fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' },
  emptyText: { fontSize: 13, color: 'var(--muted)', maxWidth: 360, lineHeight: 1.5 },
  emptyMeta: { fontSize: 10, letterSpacing: '0.06em', fontWeight: 600, color: 'var(--muted)', marginTop: 8, background: 'var(--paper-2)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: 999 },
};
