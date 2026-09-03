import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LogRow {
  id: string;
  account_id: string | null;
  model: string;
  prompt: string;
  response: string | null;
  latency_ms: number;
  success: boolean;
  retry_count: number;
  status_code: number | null;
  error_message: string | null;
  created_at: string;
}

export default function Logs() {
  const { idToken } = useAuth();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ok' | 'fail'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const headers: HeadersInit = idToken ? { Authorization: `Bearer ${idToken}` } : {};

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/history?limit=100', { headers });
      const data = await res.json();
      setRows(data.requests || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 5000);
    return () => clearInterval(id);
  }, [idToken]);

  const filtered = rows.filter(r => filter === 'all' ? true : filter === 'ok' ? r.success : !r.success);

  return (
    <div className="depot-card" style={s.card}>
      <div style={s.head}>
        <span style={s.title} className="mono">07 — API LOGS</span>
        <span style={s.meta} className="mono">{total} TOTAL · {filtered.length} SHOWN</span>
        <div style={s.filters}>
          {(['all','ok','fail'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...s.filterBtn, ...(filter===f ? s.filterActive : {}) }} className="mono">{f.toUpperCase()}</button>
          ))}
          <button onClick={fetchLogs} style={s.refreshBtn} className="mono">↻ REFRESH</button>
        </div>
      </div>
      {loading ? <div style={s.empty} className="mono">Loading logs…</div> : filtered.length===0 ? <div style={s.empty} className="mono">No logs yet — send a request to see entries. Pool logs persist to <code>data/pool.db</code> + <code>ai_responses</code>.</div> : (
        <div style={s.list}>
          {filtered.map(r => (
            <div key={r.id} style={s.row}>
              <div style={s.rowMain} onClick={() => setExpanded(expanded===r.id ? null : r.id)}>
                <span style={s.time}>{new Date(r.created_at).toLocaleTimeString('en-US',{hour12:false})}</span>
                <span style={s.sep}>│</span>
                <span style={s.model}>{r.model.slice(0,32)}</span>
                <span style={s.account}>↳ {(r.account_id || 'no-account').slice(0,12)}</span>
                <span style={{ ...s.latency, color: r.latency_ms > 2000 ? 'var(--warn)' : 'var(--muted)' }}>{r.latency_ms}ms</span>
                {r.status_code && <span style={s.code}>{r.status_code}</span>}
                <span style={r.success ? s.ok : s.fail}>{r.success ? '● OK' : '● FAIL'}</span>
                <span style={s.expand}>{expanded===r.id ? '▴' : '▾'}</span>
              </div>
              {expanded===r.id && (
                <div style={s.detail}>
                  <div><strong>ID:</strong> <code>{r.id}</code></div>
                  <div><strong>Prompt:</strong> <span style={s.prompt}>{r.prompt.slice(0,400)}</span></div>
                  {r.response && <div><strong>Response:</strong> <span style={s.prompt}>{r.response.slice(0,400)}</span></div>}
                  {r.error_message && <div style={s.error}><strong>Error:</strong> {r.error_message.slice(0,600)}</div>}
                  <div><strong>Retry:</strong> {r.retry_count} · <strong>Account:</strong> {r.account_id || '—'}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={s.foot} className="mono">Live from <code>GET /api/history?limit=100</code> + <code>GET /api/dashboard.recentRequests</code> — polls every 5s. File log only in <code>NODE_ENV=production</code> → <code>logs/account-pool.log</code>.</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: { padding: 0, overflow: 'hidden' },
  head: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '12px 14px', borderBottom: '1.5px solid var(--border)', background: 'var(--paper-2)' },
  title: { fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' },
  meta: { fontSize: 10, color: 'var(--muted)', fontWeight: 700 },
  filters: { marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' },
  filterBtn: { padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 10, fontWeight: 800, cursor: 'pointer' },
  filterActive: { background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)' },
  refreshBtn: { padding: '5px 10px', borderRadius: 999, border: '1.5px solid var(--ink)', background: 'var(--card)', fontSize: 10, fontWeight: 800, cursor: 'pointer' },
  list: { maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  row: { borderBottom: '1px solid var(--border)', background: 'var(--card)' },
  rowMain: { display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden' },
  time: { color: 'rgba(0,0,0,0.45)', flexShrink: 0 },
  sep: { color: 'rgba(0,0,0,0.12)' },
  model: { color: '#0C0F12', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' },
  account: { color: 'var(--muted)', flexShrink: 0 },
  latency: { flexShrink: 0 },
  code: { background: 'var(--paper-2)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 999, fontSize: 10, fontWeight: 700 },
  ok: { color: 'var(--success)', fontWeight: 700, marginLeft: 'auto', flexShrink: 0 },
  fail: { color: 'var(--danger)', fontWeight: 700, marginLeft: 'auto', flexShrink: 0 },
  expand: { color: 'var(--muted)', marginLeft: 6 },
  detail: { padding: '8px 14px 10px', background: 'var(--paper)', borderTop: '1px dashed var(--border)', fontSize: 11, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 4 },
  prompt: { color: 'var(--muted)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  error: { color: 'var(--danger)', background: 'rgba(255,59,31,0.08)', border: '1px solid rgba(255,59,31,0.18)', padding: '6px 8px', borderRadius: 8, wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  empty: { padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 11 },
  foot: { padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--muted)', background: 'var(--paper-2)' },
};
