import {
  ArrowsSpinIcon,
  ChartPieIcon,
  CheckIcon,
  TrendingUpIcon,
} from './icons';

interface Props {
  current: string;
  onSet: (strategy: string) => void;
}

const OPTIONS = [
  {
    value: 'round-robin',
    name: 'Round Robin',
    desc: 'Requests are distributed evenly across all healthy accounts, one after the other.',
    Icon: ArrowsSpinIcon,
  },
  {
    value: 'least-used',
    name: 'Least Used',
    desc: 'The account with the most remaining quota handles the next request, preserving credits.',
    Icon: ChartPieIcon,
  },
];

export default function StrategyControl({ current, onSet }: Props) {
  const currentName = OPTIONS.find(o => o.value === current)?.name ?? 'Round Robin';

  return (
    <div style={styles.container}>
      <div style={styles.optionList}>
        {OPTIONS.map(opt => {
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSet(opt.value)}
              style={{
                ...styles.option,
                ...(active ? styles.optionActive : {}),
              }}
            >
              <div style={{ ...styles.optIcon, ...(active ? styles.optIconActive : {}) }}>
                <opt.Icon size={16} />
              </div>
              <div style={styles.optBody}>
                <div style={styles.optName}>{opt.name}</div>
                <div style={styles.optDesc}>{opt.desc}</div>
              </div>
              <div style={{ ...styles.optCheck, ...(active ? styles.optCheckActive : {}) }}>
                {active && <CheckIcon size={12} />}
              </div>
            </button>
          );
        })}
      </div>
      <div style={styles.failoverRow}>
        <TrendingUpIcon size={13} />
        <span>
          Auto-failover: <strong>{currentName}</strong> falls back to the next healthy account on 5xx or quota exhaustion.
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  optionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  option: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px',
    borderRadius: 10,
    border: '1px solid var(--glass-border)',
    background: 'var(--input-bg)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  optionActive: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
    background: 'rgba(99, 102, 241, 0.1)',
  },
  optIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(148, 163, 184, 0.12)',
    color: '#94a3b8',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  optIconActive: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
  },
  optBody: {
    flex: 1,
  },
  optName: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 3,
  },
  optDesc: {
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--muted-foreground)',
  },
  optCheck: {
    width: 18,
    height: 18,
    borderRadius: 999,
    border: '2px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  optCheckActive: {
    borderColor: '#6366f1',
    background: '#6366f1',
    color: '#ffffff',
  },
  failoverRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: 'var(--muted-foreground)',
    lineHeight: 1.5,
    borderTop: '1px solid var(--glass-border)',
    paddingTop: 12,
  },
};
