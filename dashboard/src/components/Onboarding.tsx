import { useState } from 'react';
import { LayersIcon, UserPlusIcon, KeyIcon, MessageIcon, SlidersIcon } from './icons';

const STEPS = [
  {
    icon: <LayersIcon size={24} />,
    kicker: 'DEPOT 01',
    title: 'Pool your Puter accounts',
    body: 'Each Puter account ships with free daily credits. The depot routes every request across your pool — when one cartridge empties, the rail skips to the next. Unlimited, uninterrupted.',
  },
  {
    icon: <UserPlusIcon size={24} />,
    kicker: 'DEPOT 02',
    title: 'Create free Puter accounts',
    body: 'Make one or more accounts at puter.com — no card, no cost. More cartridges = larger depot, bigger quota to share.',
  },
  {
    icon: <KeyIcon size={24} />,
    kicker: 'DEPOT 03',
    title: 'Slot a cartridge',
    body: 'Click “Add cartridge”, name the bay (e.g. ops-alpha), then Sign in with Puter. The popup authenticates and the depot seals the token server-side.',
  },
  {
    icon: <MessageIcon size={24} />,
    kicker: 'DEPOT 04',
    title: 'Transmit via Comms',
    body: 'Open Comms, pick any of 400+ models (Claude, Gemini, GPT, DeepSeek…), and send. Each reply is stamped with the handling unit and rail latency.',
  },
  {
    icon: <SlidersIcon size={24} />,
    kicker: 'DEPOT 05',
    title: 'Tend the rack',
    body: 'Watch quota segments, latency, and error rates per unit. Park a bad bay, re-auth an expired one, flip the routing strategy, and tune the poll rate.',
  },
];

export default function Onboarding({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const last = STEPS.length - 1;
  const finish = () => { localStorage.setItem('onboarding_done', 'true'); onClose(); };
  const cur = STEPS[step];
  return (
    <div style={s.overlay}>
      <div style={s.card} className="depot-card">
        <button onClick={finish} style={s.skip} className="mono">SKIP ✕</button>
        <div style={s.kicker} className="mono">{cur.kicker} · {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}</div>
        <div style={s.iconBox}>{cur.icon}</div>
        <h2 style={s.title}>{cur.title}</h2>
        <p style={s.body}>{cur.body}</p>
        <div style={s.dots}>
          {STEPS.map((_, i) => <span key={i} style={{ ...s.dot, ...(i === step ? s.dotActive : {}) }} />)}
        </div>
        <div style={s.actions}>
          <button onClick={() => setStep(v => v - 1)} style={{ ...s.btn, ...s.btnGhost }} disabled={step === 0} className="mono">BACK</button>
          {step === last ? (
            <button onClick={finish} style={{ ...s.btn, ...s.btnPrimary }} className="mono">OPEN DEPOT →</button>
          ) : (
            <button onClick={() => setStep(v => v + 1)} style={{ ...s.btn, ...s.btnPrimary }} className="mono">NEXT →</button>
          )}
        </div>
        <div style={s.progressTrack}><div style={{ ...s.progressFill, width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(12,15,18,0.55)', backdropFilter: 'blur(8px)', padding: 24 },
  card: { position: 'relative', width: '100%', maxWidth: 480, borderRadius: 16, padding: '28px 24px 20px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' },
  skip: { position: 'absolute', top: 12, right: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted)', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '6px 10px', borderRadius: 999, cursor: 'pointer' },
  kicker: { display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--muted)', background: 'var(--paper-2)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 999, marginBottom: 14 },
  iconBox: { width: 56, height: 56, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, color: 'var(--ink)', background: 'var(--paper-2)', border: '1.5px solid var(--border)' },
  title: { margin: '0 0 8px', fontFamily: 'var(--display)', fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--fg)', lineHeight: 1.1 },
  body: { margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--muted)', fontFamily: 'var(--sans)' },
  dots: { display: 'flex', justifyContent: 'center', gap: 6, margin: '18px 0 14px' },
  dot: { width: 7, height: 7, borderRadius: 999, background: 'var(--border)', transition: 'all 0.2s', border: '1px solid var(--border)' },
  dotActive: { width: 22, background: 'var(--ink)', borderColor: 'var(--ink)' },
  actions: { display: 'flex', justifyContent: 'center', gap: 10 },
  btn: { padding: '10px 18px', borderRadius: 10, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer', border: '1.5px solid transparent', transition: 'all 0.15s', minWidth: 110 },
  btnPrimary: { background: 'var(--ink)', color: 'white', borderColor: 'var(--ink)', boxShadow: '3px 3px 0 var(--border)' },
  btnGhost: { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted)' },
  progressTrack: { height: 4, background: 'var(--paper-2)', borderRadius: 999, overflow: 'hidden', marginTop: 18, border: '1px solid var(--border)' },
  progressFill: { height: '100%', background: 'var(--signal)', borderRadius: 999, transition: 'width 0.3s' },
};
