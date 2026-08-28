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

interface Props { stats: Stats; }

export default function Statistics({ stats }: Props) {
  const successRate = stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests) * 100 : 0;

  const cells = [
    {
      lot: 'LOT-01',
      label: 'Total units',
      value: String(stats.totalAccounts).padStart(2, '0'),
      sub: 'in rack',
      accent: 'var(--ink)',
      Icon: UsersIcon,
    },
    {
      lot: 'LOT-02',
      label: 'Active',
      value: String(stats.activeAccounts).padStart(2, '0'),
      sub: 'ready to route',
      accent: 'var(--success)',
      Icon: CheckCircleIcon,
    },
    {
      lot: 'LOT-03',
      label: 'Disabled',
      value: String(stats.disabledAccounts).padStart(2, '0'),
      sub: 'parked',
      accent: '#9AA3AD',
      Icon: PauseCircleIcon,
    },
    {
      lot: 'LOT-04',
      label: 'Exhausted',
      value: String(stats.exhaustedAccounts).padStart(2, '0'),
      sub: 'quota 0',
      accent: 'var(--warn)',
      Icon: BatteryEmptyIcon,
    },
    {
      lot: 'LOT-05',
      label: 'Error',
      value: String(stats.errorAccounts).padStart(2, '0'),
      sub: 'needs re-auth',
      accent: 'var(--danger)',
      Icon: TriangleAlertIcon,
    },
    {
      lot: 'LOT-06',
      label: 'Requests',
      value: stats.totalRequests.toLocaleString(),
      sub: `${stats.failedRequests} failed`,
      accent: 'var(--electric)',
      Icon: ChartLineIcon,
    },
    {
      lot: 'LOT-07',
      label: 'Success',
      value: stats.totalRequests > 0 ? `${successRate.toFixed(1)}%` : '—',
      sub: `${stats.successfulRequests} ok`,
      accent: 'var(--success)',
      Icon: ShieldCheckIcon,
    },
    {
      lot: 'LOT-08',
      label: 'Avg latency',
      value: `${stats.averageLatency.toFixed(0)}ms`,
      sub: 'p50 response',
      accent: 'var(--ink)',
      Icon: GaugeIcon,
    },
  ];

  return (
    <div style={s.wrap}>
      <div style={s.ribbonHead}>
        <span style={s.headEyebrow} className="mono">00 — POOL MANIFEST</span>
        <span style={s.headTitle}>Live inventory — every unit stamped and logged.</span>
        <span style={s.headMeta} className="mono">{stats.totalRequests} TOTAL ROUTED · {successRate.toFixed(1)}% CLEAN</span>
      </div>
      <div style={s.grid}>
        {cells.map(c => (
          <div key={c.lot} style={s.card} className="depot-card">
            <div style={{ ...s.topStripe, background: c.accent }} />
            <div style={s.cardInner}>
              <div style={s.cardTop}>
                <span style={s.lot} className="mono">{c.lot}</span>
                <span style={{ ...s.iconBox, borderColor: c.accent, color: c.accent }}>
                  <c.Icon size={13} />
                </span>
              </div>
              <div style={s.label} className="mono">{c.label}</div>
              <div style={s.value} className="mono">{c.value}</div>
              <div style={s.sub}>{c.sub}</div>
            </div>
            <div style={s.perfRow} aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => <i key={i} style={s.perfDot} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  ribbonHead: { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', borderBottom: '1.5px solid var(--border)', paddingBottom: 10 },
  headEyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--muted)', background: 'var(--paper-2)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 999 },
  headTitle: { fontFamily: 'var(--display)', fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--fg)' },
  headMeta: { marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 },
  card: { position: 'relative', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' },
  topStripe: { height: 4, width: '100%', flexShrink: 0 },
  cardInner: { padding: '12px 14px 12px', flex: 1 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  lot: { fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--muted)', background: 'var(--paper-2)', border: '1px solid var(--border)', padding: '3px 6px', borderRadius: 6 },
  iconBox: { width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid', background: 'var(--card)', flexShrink: 0 },
  label: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 },
  value: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--fg)' },
  sub: { fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--mono)', fontWeight: 500 },
  perfRow: { display: 'flex', gap: 6, padding: '8px 14px', borderTop: '1px dashed var(--border)', justifyContent: 'center', opacity: 0.6 },
  perfDot: { width: 6, height: 6, borderRadius: 999, background: 'var(--border)', display: 'inline-block', border: '1px solid var(--card)' },
};
