import { useState } from 'react';
import {
  LayersIcon,
  UserPlusIcon,
  KeyIcon,
  MessageIcon,
  SlidersIcon,
} from './icons';

const STEPS = [
  {
    icon: <LayersIcon size={28} />,
    title: 'What is this?',
    body: 'Puter Account Pool Manager routes your AI requests across multiple free Puter accounts. When one account runs out of daily credits, the pool automatically fails over to the next — so you get unlimited, uninterrupted AI access.',
  },
  {
    icon: <UserPlusIcon size={28} />,
    title: 'Create free Puter accounts',
    body: 'Each Puter account comes with free daily AI credits. Create one or more accounts at puter.com — no credit card, no cost. The more accounts you add, the bigger your pool.',
  },
  {
    icon: <KeyIcon size={28} />,
    title: 'Add accounts to the pool',
    body: 'In the Add Account section, enter a name (e.g. "as1"), then click "Sign in with Puter". A popup opens — log in with the Puter account and the pool stores its auth token automatically.',
  },
  {
    icon: <MessageIcon size={28} />,
    title: 'Chat & use any model',
    body: 'Open the Chat tab, pick any model (Claude, Gemini, GPT, DeepSeek, 400+ more), and send messages. Each reply shows which pool account handled it and the latency.',
  },
  {
    icon: <SlidersIcon size={28} />,
    title: 'Manage the pool',
    body: 'Monitor health, latency, credit usage and error rates per account. Disable broken accounts, re-auth expired ones, switch the scheduling strategy (Round Robin / Least Used), and tune the auto-refresh rate.',
  },
];

interface Props {
  onClose: () => void;
}

export default function Onboarding({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const last = STEPS.length - 1;

  const finish = () => {
    localStorage.setItem('onboarding_done', 'true');
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <button onClick={finish} style={styles.skip}>Skip</button>

        <div style={styles.iconBox}>
          {STEPS[step].icon}
        </div>
        <h2 style={styles.title}>{STEPS[step].title}</h2>
        <p style={styles.body}>{STEPS[step].body}</p>

        <div style={styles.dots}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{ ...styles.dot, ...(i === step ? styles.dotActive : {}) }}
            />
          ))}
        </div>

        <div style={styles.actions}>
          <button
            onClick={() => setStep(s => s - 1)}
            style={{ ...styles.btn, ...styles.btnGhost }}
            disabled={step === 0}
          >
            Back
          </button>
          {step === last ? (
            <button onClick={finish} style={{ ...styles.btn, ...styles.btnPrimary }}>
              Get Started
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              style={{ ...styles.btn, ...styles.btnPrimary }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(6px)',
    padding: 24,
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 460,
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 20,
    padding: '40px 36px',
    textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
    animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  skip: {
    position: 'absolute',
    top: 16,
    right: 18,
    border: 'none',
    background: 'transparent',
    color: 'hsl(var(--muted-foreground))',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  iconBox: {
    width: 64,
    height: 64,
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    color: 'hsl(var(--primary))',
    background: 'hsl(var(--primary) / 0.12)',
  },
  title: {
    margin: '0 0 10px',
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'hsl(var(--foreground))',
  },
  body: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    color: 'hsl(var(--muted-foreground))',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    margin: '24px 0',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'hsl(var(--border))',
    transition: 'all 0.2s',
  },
  dotActive: {
    width: 22,
    borderRadius: 9999,
    background: 'hsl(var(--primary))',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
  },
  btn: {
    padding: '10px 24px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'opacity 0.2s',
  },
  btnPrimary: {
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
  },
  btnGhost: {
    background: 'transparent',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--muted-foreground))',
  },
};
