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
import LoginPage from './components/LoginPage';
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

const STRATEGY_NAMES: Record<string, string> = {
  'round-robin': 'Round Robin',
  'least-used': 'Least Used',
};

const QUEUE_CAPACITY = 128;

function getInitialTheme(): 'dark' | 'light' {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function AppContent() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('onboarding_done') !== 'true');
  const { user, idToken, logout } = useAuth();
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
  } = useApi(idToken);
  const [now, setNow] = useState(Date.now());

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

  if (!user) {
    return <LoginPage />;
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Connecting to Account Pool Manager...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <div style={styles.logoBox}>
              <img
                src="https://avatars.githubusercontent.com/u/277201506?v=4&size=64"
                alt="logo"
                style={styles.logo}
              />
            </div>
            <div>
              <div style={styles.titleRow}>
                <h1 style={styles.title}>Puter AI Router</h1>
                <span style={isOnline ? styles.badgeOnline : styles.badgeOffline}>
                  <span style={styles.badgeDotWrap}>
                    <span style={{ ...styles.badgePing, background: isOnline ? '#34d399' : '#fb7185' }} />
                    <span style={{ ...styles.badgeDot, background: isOnline ? '#34d399' : '#fb7185' }} />
                  </span>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div style={styles.subtitle}>Smart load-balancer &amp; token quota optimizer</div>
            </div>
          </div>

          <div style={styles.headerRight}>
            {user && user.uid !== 'local' && (
              <div style={styles.userBadge}>
                {user.picture ? <img src={user.picture} style={styles.userAvatar} /> : null}
                <span style={styles.userName}>{user.name || user.email}</span>
                <button onClick={logout} style={styles.logoutBtn}>Logout</button>
              </div>
            )}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={styles.iconBtn}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
            <button
              onClick={() => setShowOnboarding(true)}
              style={styles.iconBtn}
              title="How to use"
              aria-label="How to use"
            >
              <HelpCircleIcon size={16} />
            </button>
            <a
              href="https://github.com/Parithosh-Varma/puter-account-pool-manager-"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.githubBtn}
            >
              <GithubIcon size={16} />
              <span className="github-btn-text">Source</span>
            </a>
            <div style={styles.tabs}>
              <button
                onClick={() => setTab('dashboard')}
                style={{ ...styles.tab, ...(tab === 'dashboard' ? styles.tabActive : {}) }}
              >Dashboard</button>
              <button
                onClick={() => setTab('chat')}
                style={{ ...styles.tab, ...(tab === 'chat' ? styles.tabActive : {}) }}
              >Chat</button>
            </div>
          </div>

          {tab === 'dashboard' && (
            <div style={styles.refreshPill}>
              <select
                value={refreshInterval}
                onChange={e => setRefreshInterval(Number(e.target.value))}
                style={styles.refreshSelect}
                title="Auto-refresh interval"
              >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
              <span style={styles.pillDivider} />
              <span style={styles.updatedAgo}>
                {updatedAgo !== null ? `Updated ${updatedAgo}s ago` : 'Connecting...'}
              </span>
              <button
                onClick={refetch}
                style={styles.refreshBtn}
                title="Refresh now"
                aria-label="Refresh now"
              >
                <RefreshIcon size={14} className={refreshing ? 'spin' : undefined} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={styles.main}>
        {error && (
          <div style={styles.errorBar}>
            {error}
            <button onClick={() => window.location.reload()} style={styles.retryBtn}>Retry</button>
          </div>
        )}

        {tab === 'chat' ? (
          <Chat />
        ) : (
          <>
            {stats && <Statistics stats={stats} />}

            <AdSlot slot="1" format="square" />

            {dashboardData && (
              <>
                <div style={styles.grid}>
                  <div className="glass-panel glass-panel-hover" style={styles.card}>
                    <div style={styles.cardHeaderRow}>
                      <span style={styles.cardHeaderTitle}>Scheduling Strategy</span>
                      <span style={styles.cardBadge}>
                        {STRATEGY_NAMES[stats?.strategy || 'round-robin'] || 'Round Robin'}
                      </span>
                    </div>
                    <StrategyControl
                      current={stats?.strategy || 'round-robin'}
                      onSet={setStrategy}
                    />
                  </div>

                  <div className="glass-panel glass-panel-hover" style={styles.card}>
                    <div style={styles.cardHeaderRow}>
                      <span style={styles.cardHeaderTitle}>Queue &amp; Core Engine</span>
                    </div>
                    <div style={styles.queueBody}>
                      <div style={styles.queueStatBox}>
                        <div style={styles.queueStatLabel}>Queued Requests</div>
                        <div style={styles.queueStatValue}>
                          {stats?.queuedRequests ?? 0}
                          <span style={styles.queueStatCap}> / {QUEUE_CAPACITY}</span>
                        </div>
                      </div>
                      <div style={styles.queueStatBox}>
                        <div style={styles.queueStatLabel}>Uptime</div>
                        <div style={styles.queueStatValue}>
                          {stats ? formatUptime(stats.uptime) : 'N/A'}
                        </div>
                      </div>
                      <div style={styles.bufferBlock}>
                        <div style={styles.bufferTop}>
                          <span style={styles.bufferLabel}>Buffer Usage</span>
                          <span style={styles.bufferValue}>
                            {Math.min(100, Math.round(((stats?.queuedRequests ?? 0) / QUEUE_CAPACITY) * 100))}%
                          </span>
                        </div>
                        <div style={styles.barBg}>
                          <div style={{
                            ...styles.barFill,
                            width: `${Math.min(100, Math.round(((stats?.queuedRequests ?? 0) / QUEUE_CAPACITY) * 100))}%`,
                            background: 'linear-gradient(90deg, #818cf8, #c084fc)',
                          }} />
                        </div>
                      </div>
                      <div style={styles.queueFooter}>
                        <span style={styles.queueFooterItem}>
                          <LockIcon size={12} /> SSL · TLS 1.3
                        </span>
                        <span style={styles.queueFooterItem}>
                          <ServerIcon size={12} /> Engine v2
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel glass-panel-hover" style={styles.card}>
                    <LiveTrafficChart requests={dashboardData.recentRequests} />
                  </div>
                </div>

                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <div style={styles.sectionTitleWrap}>
                      <h2 style={styles.sectionTitle}>Account Pool &amp; Credentials</h2>
                      <span style={styles.sectionCount}>{dashboardData.accounts.length} accounts</span>
                    </div>
                    <AddAccountForm onAdded={refetch} />
                  </div>
                  <AccountList
                    accounts={dashboardData.accounts}
                    onToggle={toggleAccount}
                    onRefresh={refetch}
                    onDelete={deleteAccount}
                  />
                </div>

                <div className="glass-panel" style={styles.streamCard}>
                  <div style={styles.streamHeader}>
                    <div style={styles.streamTitleWrap}>
                      <div style={styles.streamIconBox}>
                        <TerminalIcon size={14} />
                      </div>
                      <span style={styles.streamTitle}>Live API Request Stream</span>
                    </div>
                    <span style={styles.streamStatus}>
                      <span style={{ ...styles.badgeDot, background: '#34d399' }} />
                      {dashboardData.recentRequests.length} requests
                    </span>
                  </div>
                  <div style={styles.streamBody}>
                    {dashboardData.recentRequests.length === 0 ? (
                      <div style={styles.streamEmpty}>
                        <DatabaseIcon size={20} />
                        <span>Waiting for requests — route AI traffic to see the stream</span>
                      </div>
                    ) : (
                      [...dashboardData.recentRequests].reverse().slice(0, 40).map(r => (
                        <div key={r.id} style={styles.streamLine}>
                          <span style={styles.streamTime}>{formatTime(r.timestamp)}</span>
                          <span style={styles.streamArrow}>&rarr;</span>
                          <span style={styles.streamModel}>{truncate(r.model || 'unknown', 32)}</span>
                          <span style={styles.streamVia}>via {truncate(r.accountId, 14)}</span>
                          <span style={styles.streamLatency}>{r.latency.toFixed(0)}ms</span>
                          {r.retryCount > 0 && (
                            <span style={styles.streamRetry}>retry x{r.retryCount}</span>
                          )}
                          <span style={r.success ? styles.streamOk : styles.streamFail}>
                            {r.success ? '200 OK' : 'FAILED'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <UsageGraph requests={dashboardData.recentRequests} theme={theme} />
              </>
            )}

            <AdSlot slot="2" format="leaderboard" />

            <footer style={styles.footer}>
              <div style={styles.footerLinks}>
                <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Privacy Policy</a>
                <span style={styles.footerDot}>·</span>
                <a
                  href="https://github.com/Parithosh-Varma/puter-account-pool-manager-"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.footerLink}
                >
                  GitHub
                </a>
              </div>
              <div style={styles.footerNote}>
                <CheckCircleIcon size={12} />
                <span>Free AI API with no limits — pool your Puter accounts and route across 400+ models.</span>
              </div>
            </footer>
          </>
        )}

        {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
      </main>
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
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  return parts.join(' ');
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleTimeString('en-US', { hour12: false });
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '...' : s;
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    color: 'var(--foreground)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'var(--background)',
    color: 'var(--foreground)',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '3px solid var(--border)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--muted-foreground)',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--glass-border)',
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    padding: 2,
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
    flexShrink: 0,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    objectFit: 'cover',
    display: 'block',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, var(--foreground), #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    marginTop: 1,
  },
  badgeOnline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '3px 10px',
    borderRadius: 9999,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#34d399',
    background: 'rgba(52, 211, 153, 0.1)',
    border: '1px solid rgba(52, 211, 153, 0.25)',
  },
  badgeOffline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '3px 10px',
    borderRadius: 9999,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#fb7185',
    background: 'rgba(251, 113, 133, 0.1)',
    border: '1px solid rgba(251, 113, 133, 0.25)',
  },
  badgeDotWrap: {
    position: 'relative',
    width: 7,
    height: 7,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    display: 'inline-block',
  },
  badgePing: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 999,
    animation: 'ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  iconBtn: {
    background: 'var(--input-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 10,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--foreground)',
    transition: 'all 0.2s',
  },
  githubBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--foreground)',
    border: '1px solid var(--glass-border)',
    background: 'var(--input-bg)',
    borderRadius: 10,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
  },
  tabs: {
    display: 'flex',
    gap: 4,
    background: 'var(--input-bg)',
    borderRadius: 10,
    padding: 3,
    border: '1px solid var(--glass-border)',
  },
  tab: {
    padding: '6px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--muted-foreground)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
  },
  refreshPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '5px 8px 5px 6px',
    borderRadius: 9999,
    border: '1px solid var(--glass-border)',
    background: 'var(--input-bg)',
    maxWidth: 340,
  },
  refreshSelect: {
    padding: '3px 6px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--muted-foreground)',
    fontSize: 12,
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
  },
  pillDivider: {
    width: 1,
    height: 14,
    background: 'var(--glass-border)',
  },
  updatedAgo: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    whiteSpace: 'nowrap',
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: 'none',
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginLeft: 'auto',
    transition: 'all 0.2s',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    borderRadius: 10,
    background: 'var(--input-bg)',
    border: '1px solid var(--glass-border)',
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
  },
  userName: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--foreground)',
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    padding: '3px 8px',
    borderRadius: 6,
    border: 'none',
    background: 'rgba(251, 113, 133, 0.15)',
    color: '#fb7185',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '28px 24px 48px',
    animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  errorBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    marginBottom: 24,
    borderRadius: 12,
    background: 'rgba(251, 113, 133, 0.1)',
    border: '1px solid rgba(251, 113, 133, 0.25)',
    color: '#fda4af',
    fontSize: 14,
  },
  retryBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid rgba(251, 113, 133, 0.3)',
    background: 'rgba(251, 113, 133, 0.2)',
    color: '#fda4af',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 12,
    marginBottom: 28,
  },
  card: {
    borderRadius: 14,
    padding: 20,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  cardBadge: {
    padding: '4px 10px',
    borderRadius: 9999,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#a5b4fc',
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
  },
  queueBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  queueStatBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: 10,
    background: 'var(--input-bg)',
    border: '1px solid var(--glass-border)',
  },
  queueStatLabel: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
  },
  queueStatValue: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
  },
  queueStatCap: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    fontWeight: 400,
  },
  bufferBlock: {
    padding: '4px 2px',
  },
  bufferTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bufferLabel: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
  },
  bufferValue: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
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
  queueFooter: {
    display: 'flex',
    gap: 16,
    paddingTop: 10,
    borderTop: '1px solid var(--glass-border)',
  },
  queueFooterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'var(--muted-foreground)',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  sectionTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    background: 'var(--input-bg)',
    border: '1px solid var(--glass-border)',
    padding: '3px 10px',
    borderRadius: 9999,
  },
  streamCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  streamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid var(--glass-border)',
  },
  streamTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  streamIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamTitle: {
    fontSize: 13,
    fontWeight: 600,
  },
  streamStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 11,
    color: 'var(--muted-foreground)',
    fontWeight: 500,
  },
  streamBody: {
    padding: '8px 16px 12px',
    maxHeight: 300,
    overflowY: 'auto',
  },
  streamLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '5px 0',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    borderBottom: '1px solid var(--glass-border)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  streamTime: {
    color: 'var(--muted-foreground)',
    flexShrink: 0,
  },
  streamArrow: {
    color: '#6366f1',
    flexShrink: 0,
  },
  streamModel: {
    color: '#cbd5e1',
    flexShrink: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  streamVia: {
    color: 'var(--muted-foreground)',
    flexShrink: 0,
  },
  streamLatency: {
    color: '#67e8f9',
    flexShrink: 0,
  },
  streamRetry: {
    color: '#fbbf24',
    flexShrink: 0,
  },
  streamOk: {
    color: '#34d399',
    fontWeight: 600,
    flexShrink: 0,
  },
  streamFail: {
    color: '#fb7185',
    fontWeight: 600,
    flexShrink: 0,
  },
  streamEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '28px 0',
    color: 'var(--muted-foreground)',
    fontSize: 13,
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '24px 0 8px',
    borderTop: '1px solid var(--glass-border)',
    marginTop: 28,
  },
  footerLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  footerLink: {
    fontSize: 13,
    color: 'var(--muted-foreground)',
    textDecoration: 'none',
  },
  footerDot: {
    color: 'var(--muted-foreground)',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'var(--muted-foreground)',
  },
};
