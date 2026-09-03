import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

interface Request { id: string; accountId: string; model: string; latency: number; success: boolean; retryCount: number; timestamp: string; }
interface Props { requests: Request[]; theme?: 'dark' | 'light'; }

const tooltipStyle: React.CSSProperties = {
  background: '#0C0F12',
  border: '1px solid #262C33',
  borderRadius: 10,
  fontSize: 11,
  color: '#FDFBF3',
  fontFamily: 'JetBrains Mono, monospace',
};

export function LiveTrafficChart({ requests }: { requests: Request[] }) {
  const recent = requests.slice(-50);
  const data = recent.map((r, idx) => ({ idx, ms: r.latency, ok: r.success ? 1 : 0 }));
  const latest = recent.length ? recent[recent.length - 1].latency : 0;
  const avg = recent.length ? Math.round(recent.reduce((a, b) => a + b.latency, 0) / recent.length) : 0;
  return (
    <div style={s.liveWrap}>
      <div style={s.liveTop}>
        <div>
          <div className="mono" style={s.liveLabel}>SAMPLE WINDOW</div>
          <div className="mono" style={s.liveSub}>{recent.length} points · avg {avg}ms</div>
        </div>
        <div style={s.liveBadge} className="mono">
          <span style={s.liveDot} />
          {latest.toFixed(0)} ms
        </div>
      </div>
      {recent.length === 0 ? (
        <div style={s.emptyMini} className="mono">NO TRACE — IDLE</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="depotTraffic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0C0F12" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#FF3B1F" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="idx" tick={false} axisLine={false} />
            <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#7A838F' }} width={36} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle as any} labelStyle={{ display: 'none' }} cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="ms" stroke="#0C0F12" strokeWidth={1.8} fill="url(#depotTraffic)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
      <div style={s.liveFoot} className="mono">
        <span>RAIL LATENCY · MS</span>
        <span style={s.liveFootDot}>● RECENT 50</span>
      </div>
    </div>
  );
}

export default function UsageGraph({ requests, theme = 'dark' }: Props) {
  const recent = requests.slice(-50);
  const latencyData = recent.map((r, i) => ({ i, ms: r.latency }));
  const modelCounts: Record<string, number> = {};
  let ok = 0, fail = 0;
  for (const r of recent) {
    const m = r.model || 'unknown';
    modelCounts[m] = (modelCounts[m] || 0) + 1;
    if (r.success) ok++; else fail++;
  }
  const modelData = Object.entries(modelCounts).map(([model, count]) => ({
    model: model.length > 14 ? model.slice(0, 14) + '…' : model,
    count,
  }));
  const outcomeData = [
    { name: 'OK', value: ok },
    { name: 'FAIL', value: fail },
  ];

  if (recent.length === 0) {
    return (
      <div className="depot-card" style={s.emptyCard}>
        <span style={s.emptyIcon}>◒</span>
        <span className="mono" style={s.emptyText}>No telemetry yet — send a request to ink the charts.</span>
      </div>
    );
  }

  return (
    <div style={s.grid}>
      <div className="depot-card" style={s.card}>
        <div style={s.cardHead}>
          <span className="mono" style={s.cardEyebrow}>LATENCY · MS</span>
          <span className="mono" style={s.cardMeta}>{recent.length} samples</span>
        </div>
        <ResponsiveContainer width="100%" height={200} key={theme}>
          <LineChart data={latencyData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="i" tick={false} axisLine={false} />
            <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#7A838F' }} width={36} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle as any} labelStyle={{ display: 'none' }} />
            <Line type="monotone" dataKey="ms" stroke="#0C0F12" strokeWidth={1.8} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={s.cardFoot} className="mono">Lower is better · p50 across pool</div>
      </div>

      <div className="depot-card" style={s.card}>
        <div style={s.cardHead}>
          <span className="mono" style={s.cardEyebrow}>BY MODEL</span>
          <span className="mono" style={s.cardMeta}>{modelData.length} models</span>
        </div>
        <ResponsiveContainer width="100%" height={200} key={theme + 'bar'}>
          <BarChart data={modelData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="model" tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#7A838F' }} interval={0} angle={-14} dy={10} height={36} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#7A838F' }} width={30} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle as any} cursor={{ fill: 'rgba(12,15,18,0.04)' }} />
            <Bar dataKey="count" fill="#0C0F12" radius={[6, 6, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
        <div style={s.cardFoot} className="mono">Distribution in recent window</div>
      </div>

      <div className="depot-card" style={s.card}>
        <div style={s.cardHead}>
          <span className="mono" style={s.cardEyebrow}>OUTCOME</span>
          <span className="mono" style={s.cardMeta}>{ok} OK · {fail} FAIL</span>
        </div>
        <ResponsiveContainer width="100%" height={200} key={theme + 'out'}>
          <BarChart data={outcomeData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="name" tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#7A838F', fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#7A838F' }} width={30} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle as any} cursor={{ fill: 'rgba(12,15,18,0.04)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={42}>
              {outcomeData.map(e => (
                <Bar key={e.name} dataKey="value" fill={e.name === 'OK' ? '#00A85A' : '#FF3B1F'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={s.cardFoot} className="mono">Green = routed clean · Red = exhausted / 5xx</div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  liveWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  liveTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  liveLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--muted)' },
  liveSub: { fontSize: 10, fontWeight: 600, color: 'var(--muted)', marginTop: 2 },
  liveBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', padding: '6px 10px', borderRadius: 999, background: 'var(--ink)', color: 'white' },
  liveDot: { width: 7, height: 7, borderRadius: 999, background: 'var(--success)', boxShadow: '0 0 0 6px rgba(0,168,90,0.18)', display: 'inline-block' },
  emptyMini: { height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, letterSpacing: '0.12em', fontWeight: 800, color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 10, background: 'var(--paper-2)' },
  liveFoot: { display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--muted)', borderTop: '1px dashed var(--border)', paddingTop: 8 },
  liveFootDot: { color: 'var(--fg)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gridAutoFlow: 'dense', gap: 12 },
  card: { padding: 14, borderRadius: 12 },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardEyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--muted)' },
  cardMeta: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', background: 'var(--paper-2)', border: '1px solid var(--border)', padding: '3px 7px', borderRadius: 999 },
  cardFoot: { fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--muted)', borderTop: '1px dashed var(--border)', paddingTop: 8, marginTop: 4 },
  emptyCard: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28, borderRadius: 12 },
  emptyIcon: { width: 28, height: 28, borderRadius: 999, background: 'var(--paper-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
  emptyText: { fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--muted)' },
};
