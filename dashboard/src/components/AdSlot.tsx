import { useEffect, useRef } from 'react';

const AD_CLIENT_ID = 'ca-pub-5555619941305353';

interface Props {
  slot: string;
  format?: 'leaderboard' | 'square';
}

export default function AdSlot({ slot, format = 'leaderboard' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || pushed.current) return;
    pushed.current = true;
    try {
      const win = window as unknown as { adsbygoogle?: unknown[] };
      (win.adsbygoogle = win.adsbygoogle || []).push({});
    } catch {
      // AdSense unavailable
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`ad-slot${format === 'square' ? ' ad-slot-square' : ''}`}
      style={{ width: format === 'square' ? 300 : '100%', maxWidth: format === 'square' ? 300 : 728 }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: format === 'square' ? 300 : 728, height: format === 'square' ? 250 : 90 }}
        data-ad-client={AD_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
