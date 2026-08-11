import { useEffect, useState } from 'react';
import { KeyIcon, PlusIcon, XIcon } from './icons';

interface Props {
  onAdded: () => void;
}

function getPuterToken(puter: any): string | null {
  if (puter?.auth?.getToken) return puter.auth.getToken();
  return localStorage.getItem('puter.auth.token.v2');
}

export default function AddAccountForm({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    setMessage('');
    setIsError(false);
  };

  const signInWithPuter = async () => {
    if (!name.trim()) {
      setMessage('Enter an account name first');
      setIsError(true);
      return;
    }
    setSaving(true);
    setMessage('');
    setIsError(false);
    try {
      const puter = (window as any).puter;
      if (!puter?.auth) throw new Error('Puter.js failed to load');
      await puter.auth.signIn();
      const token = getPuterToken(puter);
      if (!token) throw new Error('No Puter token received');
      setSaving(false);
      await submitToken(name.trim(), token);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sign-in failed — popup blocked?');
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const submitToken = async (accountName: string, token: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: accountName, token }),
      });
      const data = await res.json();
      const verification = data.verification;
      if (verification?.valid) {
        setName('');
        onAdded();
        close();
      } else {
        setMessage(verification?.error || 'Token invalid — try again');
        setIsError(true);
        onAdded();
      }
    } catch {
      setMessage('Network error');
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={styles.addBtn}>
        <PlusIcon size={14} />
        <span>Add Account</span>
      </button>

      {open && (
        <div style={styles.overlay} onClick={close}>
          <div className="glass-panel" style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.header}>
              <div style={styles.headerTitle}>
                <div style={styles.iconBox}>
                  <KeyIcon size={16} />
                </div>
                <div>
                  <div style={styles.title}>Add Account</div>
                  <div style={styles.sub}>Connect a Puter account to the pool</div>
                </div>
              </div>
              <button onClick={close} style={styles.closeBtn}>
                <XIcon size={16} />
              </button>
            </div>
            <div style={styles.form}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Account name (e.g. My Account)"
                className="glass-input"
                style={styles.input}
                autoFocus
              />
              <button onClick={signInWithPuter} disabled={saving} style={styles.puterBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M12 12l-8-4 8-4 8 4-8 4z" fill="currentColor" opacity="0.3" />
                </svg>
                {saving ? 'Signing in...' : 'Sign in with Puter'}
              </button>
              {message && (
                <div style={{ ...styles.message, color: isError ? '#fb7185' : '#34d399' }}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 6, 23, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    border: '1px solid var(--glass-border)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  sub: {
    fontSize: 12,
    color: 'var(--muted-foreground)',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: '1px solid var(--glass-border)',
    background: 'var(--input-bg)',
    color: 'var(--muted-foreground)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    padding: '11px 14px',
    borderRadius: 10,
    color: 'var(--foreground)',
    fontSize: 14,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  },
  puterBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
  },
  message: {
    fontSize: 13,
    fontWeight: 500,
  },
};