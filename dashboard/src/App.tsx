import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useApi } from './hooks/useApi';
import AccountList from './components/AccountList';
import Statistics from './components/Statistics';
import UsageGraph, { LiveTrafficChart } from './components/UsageGraph';
import StrategyControl from './components/StrategyControl';
import AddAccountForm from './components/AddAccountForm';
import Chat from './components/Chat';
import AdSlot from './components/AdSlot';
import Onboarding from './components/Onboarding';
import {
  SunIcon,
  MoonIcon,
  GithubIcon,
  RefreshIcon,
  HelpCircleIcon,
  ServerIcon,
  LockIcon,
  TerminalIcon,
  DatabaseIcon,
  CheckCircleIcon,
} from './components/icons';

type Tab = 'dashboard' | 'chat';

function getInitialTheme(): 'dark' | 'light' {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

const QUEUE_CAPACITY = 128;

function AppContent() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('onboarding_done') !== 'true');
  const { user, idToken, logout, enterLocal } = useAuth();
  useEffect(() => { if (!user) enterLocal(); }, []); // tool is localhost-only — auto-enter local, no landing gate
  const effectiveIdToken = idToken ?? '';
  const {
    dashboardData,
    stats,
    loading,
    refreshing,
    lastUpdated,
    error,
    refreshInterval,
    setRefreshInterval,
    toggleAccount,
    deleteAccount,
    setStrategy,
    refetch,
  } = useApi(effectiveIdToken);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const updatedAgo = lastUpdated ? Math.max(0, Math.round((now - lastUpdated) / 1000)) : null;
  const isOnline = (stats?.activeAccounts ?? 0) > 0;
  const queuedPct = Math.min(100, Math.round(((stats?.queuedRequests ?? 0) / QUEUE_CAPACITY) * 100));
  const successRate = stats && stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests) * 100 : 0;

  const copyEndpoint = async () => {
    const url = `${window.location.origin}/v1/chat/completions`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <style>{depotStyles}</style>
        <div style={s.loadingCard} className="depot-card">
          <div style={s.loadingTop}>
            <span style={s.loadingEyebrow}>PUTER DEPOT · SYSTEM CHECK</span>
            <span style={s.loadingDot} />
          </div>
          <div style={s.loadingBarTrack}><div style={s.loadingBarFill} /></div>
          <p style={s.loadingText}>Opening depot gates — syncing pool manifest…</p>
          <p style={s.loadingSub}>Verifying tokens · checking health · loading rack</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.shell}>
      <style>{depotStyles}</style>

      <div style={s.conveyor} aria-hidden>
        <svg width="100%" height="10" viewBox="0 0 1200 10" preserveAspectRatio="none" style={{ display: 'block' }}>
          <line x1="0" y1="5" x2="1200" y2="5" stroke="var(--border)" strokeWidth="1" strokeDasharray="10 14" style={{ animation: 'conveyor 0.9s linear infinite' }} />
        </svg>
        <div style={s.conveyorLabel} className="mono">CONVEYOR — REQUEST RAIL · {dashboardData?.recentRequests.length ?? 0} IN TRANSIT</div>
      </div>

      <header style={s.topbar}>
        <div style={s.topbarInner}>
          <div style={s.brand}>
            <div style={s.logoWrap}>
              <img src="https://avatars.githubusercontent.com/u/277201506?v=4&size=64" alt="" style={s.logo} />
              <span style={s.logoBolt}>◒</span>
            </div>
            <div>
              <div style={s.wordmark}>
                PUTER DEPOT <span style={s.wordmarkSub}>ROUTER</span>
              </div>
              <div style={s.brandSub} className="mono">LOT 2026 · POOL MANAGER · OPENAI-COMPATIBLE</div>
            </div>
          </div>

          <div style={s.topbarCenter}>
            <div style={s.segment}>
              <button onClick={() => setTab('dashboard')} style={{ ...s.segBtn, ...(tab === 'dashboard' ? s.segActive : {}) }}>
                <span style={s.segDot} data-on={tab === 'dashboard'} />
                Dashboard
              </button>
              <button onClick={() => setTab('chat')} style={{ ...s.segBtn, ...(tab === 'chat' ? s.segActive : {}) }}>
                <span style={s.segDot} data-on={tab === 'chat'} />
                Comms
              </button>
            </div>
            <div style={s.statusPill} data-online={isOnline}>
              <span style={s.statusLedWrap}>
                <span style={{ ...s.statusPing, background: isOnline ? 'var(--success)' : 'var(--danger)' }} />
                <span style={{ ...s.statusLed, background: isOnline ? 'var(--success)' : 'var(--danger)' }} />
              </span>
              <span style={s.statusText} className="mono">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              <span style={s.statusMeta} className="mono">{stats?.activeAccounts ?? 0} ACTIVE</span>
            </div>
          </div>

          <div style={s.topbarActions}>
            <span style={{ ...s.statusPill, background: 'var(--paper-2)', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }} className="mono">TOOL · LOCALHOST ONLY · NOT DEPLOYED</span>
            {user && user.uid !== 'local' && (
              <div style={s.userPill}>
                {user.picture ? <img src={user.picture} alt="" style={s.userAvatar} /> : <span style={s.userFallback}>{(user.name || user.email || 'U')[0]}</span>}
                <span style={s.userName} className="mono">{user.name || user.email}</span>
                <button onClick={logout} style={s.logoutBtn} className="mono">EXIT</button>
              </div>
            )}
            {user?.uid === 'local' && (
              <span style={{ ...s.userPill, padding: '6px 10px', fontSize: 11, fontWeight: 700 }} className="mono">LOCAL ✓</span>
            )}
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={s.iconBtn} aria-label="Toggle theme">
              {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
            </button>
            <button onClick={() => setShowOnboarding(true)} style={s.iconBtn} aria-label="How to use"><HelpCircleIcon size={15} /></button>
            <a href="https://github.com/Parithosh-Varma/puter-account-pool-manager-" target="_blank" rel="noopener noreferrer" style={s.ghostBtn}>
              <GithubIcon size={14} /> <span className="github-btn-text mono" style={{ fontSize: 11 }}>GITHUB</span>
            </a>
          </div>
        </div>
      </header>

      <div style={s.body}>
        <aside style={s.sidebar}>
          <div style={s.sideCard} className="depot-card">
            <div style={s.sideCardHead}>
              <span className="mono" style={s.sideEyebrow}>01 — ENDPOINT</span>
              <span style={s.sideTag} className="mono">OPENAI</span>
            </div>
            <div style={s.manifestBlock}>
              <div style={s.manifestLabel} className="mono">POST /v1/chat/completions</div>
              <div style={s.codeBox} className="mono">
                <span style={{ color: 'var(--muted)' }}>{window.location.origin}</span>/v1/chat/completions
              </div>
              <button onClick={copyEndpoint} style={s.copyBtn} className="mono">
                {copied ? 'COPIED ✓' : 'COPY ENDPOINT'}
              </button>
              <div style={s.manifestHint}>
                Drop-in replacement for OpenAI. Point any SDK here — key is ignored, routing is automatic.
              </div>
            </div>
            <div style={s.sideDivider} />
            <div style={s.pollRow}>
              <span className="mono" style={s.pollLabel}>AUTO-REFRESH</span>
              <select value={refreshInterval} onChange={e => setRefreshInterval(Number(e.target.value))} style={s.pollSelect} className="mono">
                <option value={2000}>2 S</option>
                <option value={5000}>5 S</option>
                <option value={10000}>10 S</option>
                <option value={30000}>30 S</option>
              </select>
            </div>
            <div style={s.updatedRow} className="mono">
              <RefreshIcon size={12} className={refreshing ? 'spin' : undefined} />
              <span>{updatedAgo !== null ? `SYNC ${updatedAgo}s AGO` : 'SYNCING…'}</span>
              <button onClick={refetch} style={s.tinyBtn} className="mono">PULL</button>
            </div>
          </div>

          <div style={s.sideCard} className="depot-card">
            <div style={s.sideCardHead}>
              <span className="mono" style={s.sideEyebrow}>02 — QUEUE RAIL</span>
              <span className="mono" style={s.sideCount}>{String(stats?.queuedRequests ?? 0).padStart(2, '0')} / {QUEUE_CAPACITY}</span>
            </div>
            <div style={s.queueGrid}>
              <div style={s.queueMeter}>
                <div style={s.meterTrack}>
                  <div style={{ ...s.meterFill, height: `${queuedPct}%`, background: queuedPct > 80 ? 'var(--danger)' : queuedPct > 45 ? 'var(--warn)' : 'var(--success)' }} />
                  {Array.from({ length: 6 }).map((_, i) => <span key={i} style={{ ...s.meterNotch, bottom: `${(i / 6) * 100}%` }} />)}
                </div>
                <div style={s.meterLabels} className="mono">
                  <span>128</span><span>64</span><span>0</span>
                </div>
              </div>
              <div style={s.queueStats}>
                <div style={s.qStat}>
                  <span className="mono" style={s.qLabel}>QUEUED</span>
                  <span style={s.qValue} className="mono">{stats?.queuedRequests ?? 0}</span>
                  <div style={s.qBar}><div style={{ ...s.qBarFill, width: `${queuedPct}%` }} /></div>
                </div>
                <div style={s.qStat}>
                  <span className="mono" style={s.qLabel}>UPTIME</span>
                  <span style={s.qValueSmall} className="mono">{stats ? formatUptime(stats.uptime) : '—'}</span>
                </div>
                <div style={s.qStat}>
                  <span className="mono" style={s.qLabel}>SUCCESS</span>
                  <span style={s.qValueSmall} className="mono">{successRate.toFixed(1)}%</span>
                </div>
                <div style={s.qFoot} className="mono">
                  <span><LockIcon size={10} /> TLS 1.3</span>
                  <span><ServerIcon size={10} /> V2</span>
                </div>
              </div>
            </div>
          </div>

          <div style={s.sideCard} className="depot-card" data-compact>
            <div className="mono" style={s.legendTitle}>STATUS LEDGER</div>
            <div style={s.legendGrid} className="mono">
              <span><i style={{ ...s.led, background: 'var(--success)' }} /> ACTIVE</span>
              <span><i style={{ ...s.led, background: '#9AA3AD' }} /> DISABLED</span>
              <span><i style={{ ...s.led, background: 'var(--warn)' }} /> EXHAUSTED</span>
              <span><i style={{ ...s.led, background: 'var(--danger)' }} /> ERROR</span>
            </div>
            <div style={s.manifestHint}>Health checks auto-park failing units. Re-auth to clear ERROR.</div>
          </div>

          <div style={s.sideFooter} className="mono">
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={s.sideLink}>Privacy →</a>
            <span style={{ opacity: 0.3 }}>·</span>
            <a href="https://github.com/Parithosh-Varma/puter-account-pool-manager-" target="_blank" rel="noopener noreferrer" style={s.sideLink}>Source →</a>
          </div>
        </aside>

        <main style={s.main}>
          {error && (
            <div style={s.errorBar}>
              <span style={s.errorDot} />
              <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>MANIFEST ERROR — {error}</span>
              <button onClick={() => window.location.reload()} style={s.errorBtn} className="mono">RETRY</button>
            </div>
          )}

          {tab === 'chat' ? (
            <div style={s.chatWrap}>
              <div style={s.sectionHead}>
                <h2 style={s.sectionTitle}>COMMS — LIVE TRANSMISSION</h2>
                <span style={s.sectionMeta} className="mono">ROUTES THROUGH POOL · STREAMING ENABLED</span>
              </div>
              <Chat />
            </div>
          ) : (
            <>
              {stats && <Statistics stats={stats} />}

              <AdSlot slot="1" format="square" />

              {dashboardData && (
                <>
                  <div style={s.bento} className="depot-bento">
                    <div className="depot-card" style={s.bentoCard}>
                      <div style={s.cardHead}>
                        <span className="mono" style={s.cardEyebrow}>03 — ROUTING STRATEGY</span>
                        <span style={s.cardPill} className="mono">{stats?.strategy === 'least-used' ? 'LEAST-USED' : 'ROUND-ROBIN'}</span>
                      </div>
                      <StrategyControl current={stats?.strategy || 'round-robin'} onSet={setStrategy} />
                    </div>

                    <div className="depot-card" style={s.bentoCard}>
                      <div style={s.cardHead}>
                        <span className="mono" style={s.cardEyebrow}>04 — LIVE TRAFFIC</span>
                        <span className="mono" style={s.cardMeta}>{dashboardData.recentRequests.length} SAMPLES</span>
                      </div>
                      <LiveTrafficChart requests={dashboardData.recentRequests} />
                    </div>

                    <div className="depot-card" style={{ ...s.bentoCard, ...s.healthCard }}>
                      <div style={s.cardHead}>
                        <span className="mono" style={s.cardEyebrow}>05 — SYSTEM HEALTH</span>
                        <span style={s.healthDot} data-ok={isOnline} />
                      </div>
                      <div style={s.healthGrid}>
                        <div style={s.healthCell}>
                          <span className="mono" style={s.healthLabel}>AVG LATENCY</span>
                          <span style={s.healthValue} className="mono">{stats ? `${stats.averageLatency.toFixed(0)} ms` : '—'}</span>
                          <span style={s.healthSub}>p50 across pool</span>
                        </div>
                        <div style={s.healthCell}>
                          <span className="mono" style={s.healthLabel}>SUCCESS</span>
                          <span style={s.healthValue} className="mono">{successRate.toFixed(1)}%</span>
                          <span style={s.healthSub}>{stats?.successfulRequests ?? 0} / {stats?.totalRequests ?? 0}</span>
                        </div>
                        <div style={s.healthCell}>
                          <span className="mono" style={s.healthLabel}>THROUGHPUT</span>
                          <span style={s.healthValue} className="mono">{dashboardData.recentRequests.length}</span>
                          <span style={s.healthSub}>recent window</span>
                        </div>
                        <div style={s.healthCellFull}>
                          <div style={s.healthBarTrack}><div style={{ ...s.healthBarFill, width: `${Math.min(100, successRate)}%` }} /></div>
                          <span className="mono" style={s.healthSub}>Failover retries up to {3} accounts before 5xx</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={s.poolSection}>
                    <div style={s.poolHead}>
                      <div>
                        <h2 style={s.poolTitle}>POOL RACK — ACCOUNT CARTRIDGES</h2>
                        <p style={s.poolSub} className="mono">{dashboardData.accounts.length} UNITS · SLOTS ARE HOT-SWAPPABLE · TOKENS STORED SERVER-SIDE</p>
                      </div>
                      <AddAccountForm onAdded={refetch} />
                    </div>
                    <AccountList accounts={dashboardData.accounts} onToggle={toggleAccount} onRefresh={refetch} onDelete={deleteAccount} />
                  </div>

                  <div className="depot-card" style={s.tapeCard}>
                    <div style={s.tapeHead}>
                      <span style={s.tapeTitle}>
                        <span style={s.tapeIcon}><TerminalIcon size={13} /></span>
                        <span className="mono" style={{ fontWeight: 800, letterSpacing: '0.08em', fontSize: 11 }}>06 — REQUEST TAPE</span>
                        <span style={s.tapeLive} className="mono"><span style={s.tapeLiveDot} /> LIVE FEED</span>
                      </span>
                      <span className="mono" style={s.tapeMeta}>{dashboardData.recentRequests.length} LINES · NEWEST LAST</span>
                    </div>
                    <div style={s.tapeBody}>
                      {dashboardData.recentRequests.length === 0 ? (
                        <div style={s.tapeEmpty} className="mono">
                          <DatabaseIcon size={18} />
                          <span>IDLE — NO TRAFFIC ON RAIL. SEND A REQUEST TO PRINT TAPE.</span>
                        </div>
                      ) : (
                        <div style={s.tapeLines}>
                          {[...dashboardData.recentRequests].reverse().slice(0, 40).map(r => (
                            <div key={r.id} style={s.tapeLine} className="mono">
                              <span style={s.tapeTime}>{formatTime(r.timestamp)}</span>
                              <span style={s.tapeSep}>│</span>
                              <span style={s.tapeModel}>{truncate(r.model || 'unknown', 28)}</span>
                              <span style={s.tapeVia}>↳ {truncate(r.accountId, 12)}</span>
                              <span style={{ ...s.tapeLatency, color: r.latency > 4000 ? 'var(--warn)' : 'var(--muted)' }}>{r.latency.toFixed(0)}ms</span>
                              {r.retryCount > 0 && <span style={s.tapeRetry}>↻×{r.retryCount}</span>}
                              <span style={r.success ? s.tapeOk : s.tapeFail}>{r.success ? '● OK' : '● FAIL'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <UsageGraph requests={dashboardData.recentRequests} theme={theme} />
                </>
              )}

              <AdSlot slot="2" format="leaderboard" />

              <footer style={s.footer}>
                <div style={s.footerLeft} className="mono">
                  <CheckCircleIcon size={12} />
                  <span>Free AI via pooled Puter accounts — 400+ models · No card · No limit.</span>
                </div>
                <div style={s.footerRight} className="mono">
                  <span>PUTER DEPOT SYSTEM</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>MANIFEST v2</span>
                </div>
              </footer>
            </>
          )}

          {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '275728447491-g2f03lsnon3rritavjsbdg5pmeaj3hsa.apps.googleusercontent.com';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}D`);
  if (h > 0) parts.push(`${h}H`);
  parts.push(`${m}M`);
  return parts.join(' ');
}
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleTimeString('en-US', { hour12: false });
}
function truncate(s: string, n: number): string { return s.length > n ? s.slice(0, n) + '…' : s; }

const s: Record<string, React.CSSProperties> = {
  shell: { minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' },
  conveyor: { height: 18, borderBottom: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', overflow: 'hidden' },
  conveyorLabel: { fontSize: 10, letterSpacing: '0.14em', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' },
  topbar: { position: 'sticky', top: 0, zIndex: 30, background: 'var(--card)', borderBottom: '1.5px solid var(--border-strong)', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' },
  topbarInner: { maxWidth: 1440, margin: '0 auto', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  logoWrap: { position: 'relative', width: 44, height: 44, borderRadius: 10, background: 'var(--ink)', border: '1.5px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  logo: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.92 },
  logoBolt: { position: 'absolute', right: 4, bottom: 2, fontSize: 10, color: 'var(--warn)', fontWeight: 900, textShadow: '0 1px 0 black' },
  wordmark: { fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', lineHeight: 1 },
  wordmarkSub: { fontWeight: 400, color: 'var(--muted)', fontSize: 12, letterSpacing: '0.12em' },
  brandSub: { fontSize: 10, letterSpacing: '0.08em', color: 'var(--muted)', marginTop: 2 },
  topbarCenter: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  segment: { display: 'flex', gap: 4, padding: 4, background: 'var(--paper-2)', border: '1.5px solid var(--border)', borderRadius: 999 },
  segBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, border: '1px solid transparent', background: 'transparent', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', color: 'var(--muted)', transition: 'all 0.15s' },
  segActive: { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' },
  segDot: { width: 7, height: 7, borderRadius: 999, background: 'currentColor', opacity: 0.5, display: 'inline-block' } as any,
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, border: '1.5px solid var(--border)', background: 'var(--card)', whiteSpace: 'nowrap' },
  statusLedWrap: { position: 'relative', width: 8, height: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  statusLed: { width: 8, height: 8, borderRadius: 999, display: 'inline-block' },
  statusPing: { position: 'absolute', width: 8, height: 8, borderRadius: 999, animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite' },
  statusText: { fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' },
  statusMeta: { fontSize: 10, color: 'var(--muted)', borderLeft: '1px solid var(--border)', paddingLeft: 8, marginLeft: 2 },
  topbarActions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  userPill: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 4px 6px', borderRadius: 999, background: 'var(--paper-2)', border: '1.5px solid var(--border)' },
  userAvatar: { width: 22, height: 22, borderRadius: 999, objectFit: 'cover' },
  userFallback: { width: 22, height: 22, borderRadius: 999, background: 'var(--ink)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 },
  userName: { fontSize: 11, fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: { padding: '4px 8px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 10, fontWeight: 700, cursor: 'pointer' },
  iconBtn: { width: 36, height: 36, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--fg)' },
  ghostBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', textDecoration: 'none', fontWeight: 700, fontSize: 12 },
  body: { maxWidth: 1440, margin: '0 auto', display: 'flex', gap: 18, padding: '18px 18px 40px', alignItems: 'flex-start' },
  sidebar: { width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 78 },
  sideCard: { padding: 14, borderRadius: 12 },
  sideCardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sideEyebrow: { fontSize: 10, letterSpacing: '0.14em', fontWeight: 800, color: 'var(--muted)' },
  sideTag: { fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 7px', borderRadius: 999, background: 'var(--ink)', color: 'white' },
  sideCount: { fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', padding: '4px 8px', borderRadius: 999, background: 'var(--paper-2)', border: '1px solid var(--border)' },
  manifestBlock: { display: 'flex', flexDirection: 'column', gap: 10 },
  manifestLabel: { fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' },
  codeBox: { padding: '10px 10px', background: 'var(--ink)', color: '#FDFBF3', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1px solid var(--ink)', wordBreak: 'break-all', lineHeight: 1.5 },
  copyBtn: { padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--ink)', background: 'var(--signal)', color: 'white', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer', boxShadow: '2px 2px 0 var(--ink)' },
  manifestHint: { fontSize: 11, lineHeight: 1.5, color: 'var(--muted)' },
  sideDivider: { height: 1, background: 'var(--border)', margin: '14px 0' },
  pollRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pollLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--muted)' },
  pollSelect: { padding: '6px 8px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)', fontSize: 11, fontWeight: 700 },
  updatedRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 10, letterSpacing: '0.08em', fontWeight: 700, color: 'var(--muted)' },
  tinyBtn: { marginLeft: 'auto', padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 10, fontWeight: 800, cursor: 'pointer' },
  queueGrid: { display: 'flex', gap: 14 },
  queueMeter: { display: 'flex', gap: 8, alignItems: 'stretch' },
  meterTrack: { position: 'relative', width: 22, height: 140, background: 'var(--paper-2)', border: '1.5px solid var(--border)', borderRadius: 999, overflow: 'hidden' },
  meterFill: { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 999, transition: 'height 0.5s' },
  meterNotch: { position: 'absolute', left: 6, right: 6, height: 1, background: 'rgba(0,0,0,0.12)', display: 'block' },
  meterLabels: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, color: 'var(--muted)', padding: '2px 0' },
  queueStats: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10 },
  qStat: { padding: '10px 10px', background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 10 },
  qLabel: { fontSize: 9, letterSpacing: '0.12em', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: 4 },
  qValue: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 },
  qValueSmall: { fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' },
  qBar: { height: 6, background: 'var(--card)', borderRadius: 999, overflow: 'hidden', marginTop: 8, border: '1px solid var(--border)' },
  qBarFill: { height: '100%', background: 'var(--ink)', borderRadius: 999, transition: 'width 0.4s' },
  qFoot: { display: 'flex', gap: 12, fontSize: 9, letterSpacing: '0.08em', fontWeight: 700, color: 'var(--muted)', borderTop: '1px dashed var(--border)', paddingTop: 8 },
  legendTitle: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 10 },
  legendGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' },
  led: { width: 8, height: 8, borderRadius: 999, display: 'inline-block', marginRight: 6, verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.12)' },
  sideFooter: { display: 'flex', gap: 8, justifyContent: 'center', fontSize: 10, letterSpacing: '0.08em', fontWeight: 700, paddingTop: 4 },
  sideLink: { color: 'var(--muted)', textDecoration: 'none', borderBottom: '1px solid var(--border)' },
  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16, animation: 'rise 0.5s ease both' },
  errorBar: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#FFF1EF', border: '1.5px solid #FFC9C0', borderRadius: 10, color: '#8A1E0F' },
  errorDot: { width: 10, height: 10, borderRadius: 999, background: 'var(--danger)', flexShrink: 0 },
  errorBtn: { marginLeft: 'auto', padding: '6px 12px', borderRadius: 999, border: '1.5px solid #FFC9C0', background: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', borderBottom: '1.5px solid var(--border)', paddingBottom: 12 },
  sectionTitle: { margin: 0, fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' },
  sectionMeta: { fontSize: 10, letterSpacing: '0.12em', fontWeight: 700, color: 'var(--muted)' },
  chatWrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  bento: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 },
  bentoCard: { padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 280 },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardEyebrow: { fontSize: 10, letterSpacing: '0.14em', fontWeight: 800, color: 'var(--muted)' },
  cardPill: { fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', padding: '4px 8px', borderRadius: 999, background: 'var(--electric)', color: 'white' },
  cardMeta: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)' },
  healthCard: { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' },
  healthDot: { width: 10, height: 10, borderRadius: 999, background: 'var(--success)', boxShadow: '0 0 0 6px rgba(0,168,90,0.15)', flexShrink: 0 },
  healthGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 },
  healthCell: { padding: '12px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' },
  healthLabel: { fontSize: 9, letterSpacing: '0.14em', fontWeight: 800, color: 'rgba(253,251,243,0.6)', display: 'block', marginBottom: 6 },
  healthValue: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', display: 'block' },
  healthSub: { fontSize: 10, color: 'rgba(253,251,243,0.55)', marginTop: 4, display: 'block' },
  healthCellFull: { gridColumn: '1 / -1', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' },
  healthBarTrack: { height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' },
  healthBarFill: { height: '100%', background: 'var(--success)', borderRadius: 999, transition: 'width 0.4s' },
  poolSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  poolHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', borderBottom: '1.5px solid var(--border)', paddingBottom: 12 },
  poolTitle: { margin: 0, fontFamily: 'var(--display)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' },
  poolSub: { margin: '4px 0 0', fontSize: 10, letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 600 },
  tapeCard: { overflow: 'hidden', padding: 0 },
  tapeHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1.5px solid var(--border)', background: 'var(--paper-2)', flexWrap: 'wrap' },
  tapeTitle: { display: 'flex', alignItems: 'center', gap: 10 },
  tapeIcon: { width: 24, height: 24, borderRadius: 7, background: 'var(--ink)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  tapeLive: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: 'var(--success)', background: 'white', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 999 },
  tapeLiveDot: { width: 6, height: 6, borderRadius: 999, background: 'var(--success)', display: 'inline-block', animation: 'ping 1.4s infinite' },
  tapeMeta: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)' },
  tapeBody: { background: 'var(--ink)', color: '#CBD5E1', maxHeight: 320, overflowY: 'auto' },
  tapeLines: { padding: '10px 14px 14px' },
  tapeLine: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden' },
  tapeTime: { color: 'rgba(255,255,255,0.45)', flexShrink: 0 },
  tapeSep: { color: 'rgba(255,255,255,0.12)' },
  tapeModel: { color: '#E2E8F0', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' },
  tapeVia: { color: 'rgba(255,255,255,0.45)', flexShrink: 0 },
  tapeLatency: { flexShrink: 0 },
  tapeRetry: { color: 'var(--warn)', flexShrink: 0 },
  tapeOk: { color: 'var(--success)', fontWeight: 700, flexShrink: 0, marginLeft: 'auto' },
  tapeFail: { color: 'var(--danger)', fontWeight: 700, flexShrink: 0, marginLeft: 'auto' },
  tapeEmpty: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '36px 14px', fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, color: 'rgba(255,255,255,0.45)' },
  footer: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '16px 0 8px', borderTop: '1.5px solid var(--border)', marginTop: 4 },
  footerLeft: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.06em', fontWeight: 600, color: 'var(--muted)' },
  footerRight: { display: 'flex', gap: 8, fontSize: 10, letterSpacing: '0.1em', fontWeight: 700, color: 'var(--muted)' },
  loadingWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 },
  loadingCard: { width: '100%', maxWidth: 420, padding: 20, borderRadius: 14, textAlign: 'left' },
  loadingTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  loadingEyebrow: { fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', fontWeight: 800, color: 'var(--muted)' },
  loadingDot: { width: 10, height: 10, borderRadius: 999, background: 'var(--signal)', animation: 'ping 1s infinite' },
  loadingBarTrack: { height: 6, background: 'var(--paper-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border)' },
  loadingBarFill: { height: '100%', width: '45%', background: 'var(--ink)', borderRadius: 999, animation: 'ticker 0.9s ease-in-out infinite alternate' },
  loadingText: { margin: '14px 0 4px', fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' },
  loadingSub: { margin: 0, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' },
};

const depotStyles = `
@media (max-width: 1100px) {
  .depot-bento { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 900px) {
  [style*="display: flex"][style*="gap: 18px"] { flex-direction: column !important; }
  aside { width: 100% !important; position: static !important; }
  .depot-bento { grid-template-columns: 1fr !important; }
}
@media (max-width: 640px) {
  header div[style*="topbarInner"] { padding: 10px 12px !important; }
}
`;
