import AccountCard from './AccountCard';
import { InboxIcon, KeyIcon } from './icons';

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
  accounts: Account[];
  onToggle: (id: string, status: string) => void;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

export default function AccountList({ accounts, onToggle, onRefresh, onDelete }: Props) {
  if (accounts.length === 0) {
    return (
      <div className="glass-panel" style={styles.empty}>
        <div style={styles.emptyIconBox}>
          <InboxIcon size={28} />
        </div>
        <p style={styles.emptyTitle}>No accounts in the pool</p>
        <p style={styles.emptyText}>
          Add accounts to start routing AI requests across them automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={styles.wrap}>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Account Label', 'Status', 'Remaining Quota', 'Avg Latency', 'Total Requests', 'Actions'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                onToggle={() => onToggle(account.id, account.status)}
                onRefresh={onRefresh}
                onDelete={() => onDelete(account.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div style={styles.footer}>
        <KeyIcon size={13} />
        <span>Credentials are stored server-side. Tokens never leave your machine during routing.</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 760,
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    borderBottom: '1px solid var(--glass-border)',
    whiteSpace: 'nowrap',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    fontSize: 11,
    color: 'var(--muted-foreground)',
    borderTop: '1px solid var(--glass-border)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '48px 24px',
    textAlign: 'center',
    borderRadius: 14,
    marginBottom: 24,
  },
  emptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: 'rgba(99, 102, 241, 0.12)',
    color: '#818cf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    margin: 0,
  },
  emptyText: {
    fontSize: 13,
    color: 'var(--muted-foreground)',
    margin: 0,
  },
};
