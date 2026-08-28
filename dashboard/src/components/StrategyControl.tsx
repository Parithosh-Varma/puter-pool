import { ArrowsSpinIcon, ChartPieIcon, CheckIcon, TrendingUpIcon } from './icons';

interface Props { current: string; onSet: (strategy: string) => void; }

const OPTIONS = [
  {
    value: 'round-robin',
    name: 'Round Robin',
    mono: 'RR-01',
    desc: 'Even spread. Each healthy unit takes the next turn in order.',
    Icon: ArrowsSpinIcon,
  },
  {
    value: 'least-used',
    name: 'Least Used',
    mono: 'LU-02',
    desc: 'Quota-aware. Most remaining credit handles the next request.',
    Icon: ChartPieIcon,
  },
];

export default function StrategyControl({ current, onSet }: Props) {
  return (
    <div style={s.wrap}>
      <div style={s.rail} aria-hidden>
        <span style={s.railLabel} className="mono">SELECTOR</span>
        <span style={s.railLine} />
      </div>
      <div style={s.list}>
        {OPTIONS.map(opt => {
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSet(opt.value)}
              style={{ ...s.option, ...(active ? s.active : {}) }}
            >
              <div style={s.optHead}>
                <span style={s.monoTag} className="mono">{opt.mono}</span>
                <span style={{ ...s.radio, ...(active ? s.radioOn : {}) }}>
                  {active && <span style={s.radioDot} />}
                </span>
              </div>
              <div style={s.optBody}>
                <span style={{ ...s.optIcon, ...(active ? s.optIconOn : {}) }}><opt.Icon size={14} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={s.optName}>{opt.name}</div>
                  <div style={s.optDesc}>{opt.desc}</div>
                </div>
              </div>
              {active && <span style={s.check}><CheckIcon size={10} /></span>}
            </button>
          );
        })}
      </div>
      <div style={s.note} className="mono">
        <TrendingUpIcon size={11} />
        <span>Failover is automatic — on 5xx or empty quota, rail skips to next healthy bay.</span>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  rail: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 },
  railLabel: { fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--muted)', background: 'var(--paper-2)', border: '1px solid var(--border)', padding: '3px 7px', borderRadius: 999 },
  railLine: { flex: 1, height: 1, background: 'var(--border)' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  option: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '12px 12px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    background: 'var(--card)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  active: { borderColor: 'var(--ink)', background: 'var(--ink)', color: 'var(--paper)', boxShadow: '3px 3px 0 var(--border)' },
  optHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  monoTag: { fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', padding: '3px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.06)', border: '1px solid var(--border)' },
  radio: { width: 18, height: 18, borderRadius: 999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card)', flexShrink: 0 },
  radioOn: { borderColor: 'var(--paper)', background: 'var(--paper)' },
  radioDot: { width: 8, height: 8, borderRadius: 999, background: 'var(--ink)', display: 'block' },
  optBody: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  optIcon: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper-2)', border: '1px solid var(--border)', color: 'var(--muted)', flexShrink: 0 },
  optIconOn: { background: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.18)', color: 'var(--paper)' },
  optName: { fontFamily: 'var(--display)', fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.1 },
  optDesc: { fontSize: 11, lineHeight: 1.5, opacity: 0.75, marginTop: 3 },
  check: { position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 999, background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  note: { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 10, lineHeight: 1.5, color: 'var(--muted)', fontWeight: 600, borderTop: '1px dashed var(--border)', paddingTop: 10 },
};
