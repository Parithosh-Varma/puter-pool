import { useEffect, useState } from 'react';
import { KeyIcon, PlusIcon, XIcon } from './icons';

interface Props { onAdded: () => void; }

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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => { setOpen(false); setMessage(''); setIsError(false); };

  const signInWithPuter = async () => {
    if (!name.trim()) { setMessage('Enter a unit name first'); setIsError(true); return; }
    setSaving(true); setMessage(''); setIsError(false);
    try {
      const puter = (window as any).puter;
      if (!puter?.auth) throw new Error('Puter.js failed to load');
      await puter.auth.signIn();
      const token = getPuterToken(puter);
      if (!token) throw new Error('No Puter token received');
      setSaving(false);
      await submitToken(name.trim(), token);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sign-in failed — popup blocked?'); setIsError(true);
    } finally { setSaving(false); }
  };

  const submitToken = async (accountName: string, token: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: accountName, token }) });
      const data = await res.json();
      const verification = data.verification;
      if (verification?.valid) { setName(''); onAdded(); close(); }
      else { setMessage(verification?.error || 'Token invalid — try again'); setIsError(true); onAdded(); }
    } catch { setMessage('Network error'); setIsError(true); } finally { setSaving(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={s.addBtn}>
        <PlusIcon size={13} />
        <span className="mono">ADD CARTRIDGE</span>
      </button>

      {open && (
        <div style={s.overlay} onClick={close}>
          <div className="depot-card" style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.head}>
              <div style={s.headLeft}>
                <span style={s.iconBox}><KeyIcon size={16} /></span>
                <div>
                  <div style={s.title}>Slot new cartridge</div>
                  <div style={s.sub} className="mono">Puter auth is handled in the popup — no manual token paste.</div>
                </div>
              </div>
              <button onClick={close} style={s.closeBtn}><XIcon size={14} /></button>
            </div>

            <div style={s.body}>
              <label style={s.label} className="mono">UNIT LABEL</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. ops-alpha · team-2 · personal"
                style={s.input}
                autoFocus
              />
              <div style={s.hint} className="mono">Use a short bay name. You can rename by re-adding later.</div>

              <button onClick={signInWithPuter} disabled={saving} style={{ ...s.puterBtn, opacity: saving ? 0.7 : 1 }}>
                <span style={s.puterLogo}>◒</span>
                {saving ? 'Opening Puter…' : 'Sign in with Puter →'}
              </button>

              {message && (
                <div style={{ ...s.message, background: isError ? 'rgba(255,59,31,0.08)' : 'rgba(0,168,90,0.08)', borderColor: isError ? 'rgba(255,59,31,0.20)' : 'rgba(0,168,90,0.20)', color: isError ? 'var(--danger)' : 'var(--success)' }} className="mono">
                  {message}
                </div>
              )}

              <div style={s.steps} className="mono">
                <span>1 — Label the bay</span>
                <span>2 — Puter popup</span>
                <span>3 — Auto-verified</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--signal)', color: 'white', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', cursor: 'pointer', boxShadow: '3px 3px 0 var(--ink)', transition: 'all 0.12s' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(12,15,18,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modal: { width: '100%', maxWidth: 440, borderRadius: 14, overflow: 'hidden', padding: 0 },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '16px 16px', borderBottom: '1.5px solid var(--border)', background: 'var(--paper-2)' },
  headLeft: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  iconBox: { width: 38, height: 38, borderRadius: 9, background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--ink)', flexShrink: 0 },
  title: { fontFamily: 'var(--display)', fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg)' },
  sub: { fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 },
  closeBtn: { width: 30, height: 30, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 },
  body: { padding: '16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--muted)' },
  input: { padding: '11px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--paper-2)', fontSize: 13, fontFamily: 'var(--sans)', outline: 'none', width: '100%' },
  hint: { fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.04em' },
  puterBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--ink)', color: 'white', fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', cursor: 'pointer', boxShadow: '3px 3px 0 var(--border)', marginTop: 4 },
  puterLogo: { width: 22, height: 22, borderRadius: 6, background: 'white', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 },
  message: { fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '10px 12px', borderRadius: 10, border: '1px solid', lineHeight: 1.4 },
  steps: { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--muted)', borderTop: '1px dashed var(--border)', paddingTop: 10, marginTop: 2 },
};
