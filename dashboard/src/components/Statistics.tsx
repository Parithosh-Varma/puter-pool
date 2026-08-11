import {
  UsersIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  BatteryEmptyIcon,
  TriangleAlertIcon,
  ChartLineIcon,
  ShieldCheckIcon,
  GaugeIcon,
} from './icons';

interface Stats {
  totalAccounts: number;
  activeAccounts: number;
  disabledAccounts: number;
  exhaustedAccounts: number;
  errorAccounts: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
}

interface Props {
  stats: Stats;
}

export default function Statistics({ stats }: Props) {
  const cards = [
    {
      label: 'Total Accounts',
      value: stats.totalAccounts,
      sub: 'configured in pool',
      color: '#cbd5e1',
      bg: 'rgba(148, 163, 184, 0.08)',
      Icon: UsersIcon,
    },
    {
      label: 'Active',
      value: stats.activeAccounts,
      sub: 'ready to route',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.08)',
      Icon: CheckCircleIcon,
    },
    {
      label: 'Disabled',
      value: stats.disabledAccounts,
      sub: 'manually paused',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.08)',
      Icon: PauseCircleIcon,
    },
    {
      label: 'Exhausted',
      value: stats.exhaustedAccounts,
      sub: 'quota reached',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.08)',
      Icon: BatteryEmptyIcon,
    },
    {
      label: 'Error',
      value: stats.errorAccounts,
      sub: 'auth or connection',
      color: '#fb7185',
      bg: 'rgba(251, 113, 133, 0.08)',
      Icon: TriangleAlertIcon,
    },
    {
      label: 'Requests',
      value: stats.totalRequests.toLocaleString(),
      sub: `${stats.failedRequests} failed requests`,
      color: '#d8b4fe',
      bg: 'rgba(216, 180, 254, 0.08)',
      Icon: ChartLineIcon,
    },
    {
      label: 'Success Rate',
      value: stats.totalRequests > 0
        ? `${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%`
        : 'N/A',
      sub: stats.totalRequests > 0
        ? `${stats.successfulRequests} successful`
        : 'no traffic yet',
      color: '#5eead4',
      bg: 'rgba(94, 234, 212, 0.08)',
      Icon: ShieldCheckIcon,
    },
    {
      label: 'Avg Latency',
      value: `${stats.averageLatency.toFixed(0)}ms`,
      sub: 'response time',
      color: '#67e8f9',
      bg: 'rgba(103, 232, 249, 0.08)',
      Icon: GaugeIcon,
    },
  ];

  return (
    <div style={styles.grid}>
      {cards.map(card => (
        <div key={card.label} className="glass-panel glass-panel-hover" style={styles.card}>
          <div style={styles.cardTop}>
            <div style={styles.label}>{card.label}</div>
            <div style={{ ...styles.iconBox, background: card.bg, color: card.color }}>
              <card.Icon size={15} />
            </div>
          </div>
          <div style={styles.value}>{card.value}</div>
          <div style={styles.sub}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    borderRadius: 14,
    padding: '16px',
    textAlign: 'left',
    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  value: {
    fontSize: 24,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.1,
    marginBottom: 4,
  },
  sub: {
    fontSize: 11,
    color: 'var(--muted-foreground)',
  },
};
