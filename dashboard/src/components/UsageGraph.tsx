import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface Request {
  id: string;
  accountId: string;
  model: string;
  latency: number;
  success: boolean;
  retryCount: number;
  timestamp: string;
}

interface Props {
  requests: Request[];
  theme?: 'dark' | 'light';
}

const tooltipStyle = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  fontSize: 12,
};

export function LiveTrafficChart({ requests }: { requests: Request[] }) {
  const recent = requests.slice(-50);
  const trafficData = recent.map((r, idx) => ({
    index: idx,
    latency: r.latency,
  }));

  const latest = recent.length > 0 ? recent[recent.length - 1].latency : 0;

  return (
    <div>
      <div style={styles.chartHeader}>
        <div>
          <div style={styles.chartTitle}>Live Traffic</div>
          <div style={styles.chartSub}>{recent.length} recent requests</div>
        </div>
        <div style={styles.liveBadge}>
          <span style={styles.liveDot} />
          {latest.toFixed(0)}ms
        </div>
      </div>
      {recent.length === 0 ? (
        <div style={styles.emptyChart}>No traffic yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={trafficData}>
            <defs>
              <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#c084fc" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="index" tick={false} stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" fontSize={10} width={32} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--muted-foreground)' }} />
            <Area
              type="monotone"
              dataKey="latency"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#trafficFill)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function UsageGraph({ requests, theme = 'dark' }: Props) {
  const recentRequests = requests.slice(-50);

  const latencyData = recentRequests.map((r, idx) => ({
    index: idx,
    latency: r.latency,
    success: r.success ? 1 : 0,
  }));

  const modelCounts: Record<string, number> = {};
  const successCounts = { success: 0, failed: 0 };

  for (const r of recentRequests) {
    const model = r.model || 'unknown';
    modelCounts[model] = (modelCounts[model] || 0) + 1;
    if (r.success) successCounts.success++;
    else successCounts.failed++;
  }

  const modelData = Object.entries(modelCounts).map(([model, count]) => ({
    model: model.length > 15 ? model.slice(0, 15) + '...' : model,
    count,
  }));

  const pieData = [
    { name: 'Success', value: successCounts.success, fill: '#10b981' },
    { name: 'Failed', value: successCounts.failed, fill: '#f43f5e' },
  ];

  if (recentRequests.length === 0) {
    return (
      <div className="glass-panel" style={styles.empty}>
        <p style={styles.emptyText}>No request data yet. Submit AI requests to see graphs.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <div className="glass-panel" style={styles.chartCard}>
          <div style={styles.chartTitle}>Latency (ms)</div>
          <ResponsiveContainer width="100%" height={200} key={theme}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="index" tick={false} stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-panel" style={styles.chartCard}>
          <div style={styles.chartTitle}>Requests by Model</div>
          <ResponsiveContainer width="100%" height={200} key={theme}>
            <BarChart data={modelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="model" stroke="var(--muted-foreground)" fontSize={9} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-panel" style={styles.chartCard}>
          <div style={styles.chartTitle}>Success vs Failure</div>
          <ResponsiveContainer width="100%" height={200} key={theme}>
            <BarChart data={pieData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="value" name="Requests" radius={[4, 4, 0, 0]}>
                {pieData.map(entry => (
                  <rect key={entry.name} fill={entry.name === 'Success' ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: 24,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 12,
  },
  chartCard: {
    borderRadius: 14,
    padding: '16px',
    transition: 'border-color 0.2s',
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chartSub: {
    fontSize: 11,
    color: 'var(--muted-foreground)',
    marginTop: 2,
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: '#818cf8',
    fontFamily: "'JetBrains Mono', monospace",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: '#34d399',
    animation: 'ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite',
  },
  empty: {
    textAlign: 'center',
    padding: 48,
    color: 'var(--muted-foreground)',
    borderRadius: 14,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
  },
  emptyChart: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 190,
    color: 'var(--muted-foreground)',
    fontSize: 13,
  },
};
