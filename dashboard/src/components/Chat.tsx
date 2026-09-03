import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Message { role: 'user' | 'assistant'; content: string; model?: string; accountId?: string; latency?: number; error?: string; }
interface FeedModel { id: string; name: string; provider: string; description: string; }

const PROVIDER_ICON: Record<string, string> = {
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'gemini',
  gemini: 'gemini',
  qwen: 'qwen',
  alibaba: 'qwen',
  meta: 'meta',
  groq: 'groq',
  deepseek: 'deepseek',
  mistral: 'mistral',
  xai: 'xai',
  moonshot: 'moonshot',
  zhipu: 'zhipu',
  kimi: 'moonshot',
};

const iconFor = (provider: string) => {
  const p = (provider || '').toLowerCase();
  if (PROVIDER_ICON[p]) return PROVIDER_ICON[p];
  if (p.includes('anthropic') || p.includes('claude')) return 'anthropic';
  if (p.includes('openai') || p.includes('gpt')) return 'openai';
  if (p.includes('gemini') || p.includes('google')) return 'gemini';
  if (p.includes('qwen') || p.includes('alibaba')) return 'qwen';
  if (p.includes('deepseek')) return 'deepseek';
  if (p.includes('mistral') || p.includes('codestral')) return 'mistral';
  if (p.includes('meta') || p.includes('llama') || p.includes('muse')) return 'meta';
  if (p.includes('grok') || p.includes('xai')) return 'xai';
  if (p.includes('groq')) return 'groq';
  if (p.includes('kimi')) return 'moonshot';
  if (p.includes('glm') || p.includes('zhipu')) return 'zhipu';
  return p.split('/')[0] || p || 'openai';
};

export default function Chat() {
  const { idToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'COMMS OPEN — Send a probe to test the rail. Each reply is stamped with the handling unit and latency.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState('openai/gpt-5-nano');
  const [feedModels, setFeedModels] = useState<FeedModel[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const authHeaders = (): Record<string, string> => idToken ? { Authorization: `Bearer ${idToken}` } : {};

  useEffect(() => {
    fetch('/api/models', { headers: authHeaders() }).then(r => r.json()).then(d => setFeedModels(d.models || [])).catch(() => {});
  }, [idToken]);

  const [puterSignedIn, setPuterSignedIn] = useState<boolean | null>(null);
  const isPuterReady = () => typeof window !== 'undefined' && (window as any).puter?.ai?.chat && (window as any).puter?.auth?.isSignedIn;

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!isPuterReady()) { if (!cancelled) setPuterSignedIn(null); return; }
      try { const v = await (window as any).puter.auth.isSignedIn(); if (!cancelled) setPuterSignedIn(!!v); } catch { if (!cancelled) setPuterSignedIn(false); }
    };
    check();
    const id = setInterval(check, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = feedModels.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase()));
  const selectModel = (name: string) => { setModel(name); setShowDropdown(false); setSearch(''); };

  const send = async () => {
    if (!input.trim() || sending) return;
    const prompt = input;
    const userMsg: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]); setInput(''); setSending(true);
    const t0 = Date.now();
    const timeout = <T,>(p: Promise<T>, ms: number, label: string) => Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error(label + ' timed out after ' + ms / 1000 + 's — popup blocked or network')), ms))]);
    try {
      if (!isPuterReady()) throw new Error('Puter.js not ready — refresh http://localhost:5173 (not file://) and allow puter.com popup; Puter.js is ' + (typeof (window as any).puter));
      const puter = (window as any).puter;
      const signedIn = await timeout(puter.auth.isSignedIn(), 8000, 'isSignedIn') as boolean;
      if (!signedIn) await timeout(puter.auth.signIn(), 20000, 'signIn');
      const stillIn = await timeout(puter.auth.isSignedIn(), 8000, 'isSignedIn') as boolean;
      if (!stillIn) throw new Error('Sign-in required — popup was closed/blocked. Allow puter.com popups and retry');
      const resp = await timeout((puter.ai.chat as any)(prompt, { model }), 25000, 'puter.ai.chat');
      let text = '';
      if (typeof resp === 'string') text = resp;
      else if (resp?.message?.content) text = Array.isArray(resp.message.content) ? resp.message.content.map((c: any) => c.text || c.content || '').join('') : resp.message.content;
      else if (resp?.choices?.[0]?.message?.content) text = resp.choices[0].message.content;
      else text = resp?.text || resp?.content || JSON.stringify(resp);
      const latency = Date.now() - t0;
      setMessages(prev => [...prev, { role: 'assistant', content: (text && String(text).trim()) ? String(text) : 'no response (model returned empty — try gpt-5-nano)', model, accountId: 'puter:user', latency, error: text ? undefined : 'Empty response: ' + JSON.stringify(resp).slice(0, 400) }]);
    } catch (err) {
      const msg = err instanceof Error ? `${err.message}${(err as any)?.cause ? ' — ' + (err as any).cause : ''}` : String(err);
      console.error('[Chat] puter error', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'ERR — ' + msg, error: msg }]);
    } finally { setSending(false); }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const activeModel = feedModels.find(m => m.name === model || m.id === model);

  return (
    <div style={s.shell} className="depot-card">
      <div style={s.toolbar}>
        <div style={s.toolbarLeft}>
          <span className="mono" style={s.kicker}>PATCH BAY</span>
          <div style={s.modelSelector} ref={dropdownRef}>
            <button style={s.modelBtn} onClick={() => setShowDropdown(!showDropdown)}>
              <span style={s.logoWrap}>
                <img src={`https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${iconFor(activeModel?.provider || model)}-color.svg`} alt={activeModel?.provider || ''} width={18} height={18} style={{ display: 'block' }} onError={e => { (e.currentTarget as HTMLImageElement).src = `https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${iconFor(activeModel?.provider || model)}.svg`; }} />
              </span>
              <span style={s.modelName} className="mono">{model}</span>
              <span style={s.caret}>{showDropdown ? '▴' : '▾'}</span>
            </button>
            {showDropdown && (
              <div style={s.dropdown}>
                <div style={s.searchWrap}>
                  <span style={s.searchIcon}>⌕</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search 400+ models..." style={s.search} autoFocus />
                </div>
                <div style={s.list}>
                  {search && !feedModels.some(m => m.name.toLowerCase() === search.toLowerCase()) && (
                    <button style={s.item} onClick={() => selectModel(search)}>
                      <span style={s.customTag} className="mono">CUSTOM</span> {search}
                    </button>
                  )}
                  {filtered.map(m => (
                    <button key={m.id} style={{ ...s.item, ...(model === m.id ? s.itemActive : {}) }} onClick={() => selectModel(m.id)}>
                      <span style={s.logoSmWrap}>
                        <img src={`https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${iconFor(m.provider)}-color.svg`} alt={m.provider} width={18} height={18} style={{ display: 'block' }} onError={e => { (e.currentTarget as HTMLImageElement).src = `https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${iconFor(m.provider)}.svg`; }} />
                      </span>
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        <span style={s.itemName}>{m.name}</span>
                        <span style={s.itemProvider} className="mono">{m.provider}</span>
                      </span>
                      <span style={s.itemDesc}>{m.description?.slice(0, 48)}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && !search && <div style={s.loading} className="mono">Loading manifest…</div>}
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={s.toolbarRight} className="mono">
          <span style={s.badge}>{isPuterReady() ? 'VIA PUTER (USER-PAYS)' : 'VIA POOL'}</span>
          <span style={s.badgeMuted}>{messages.length} MESSAGES</span>
        </div>
      </div>

      {puterSignedIn === false && (
        <div style={s.popupBanner} className="mono">
          <span style={s.popupDot} /> POPUP REQUIRED — Click <button onClick={async () => { try { await (window as any).puter.auth.signIn(); setPuterSignedIn(await (window as any).puter.auth.isSignedIn()); } catch (e) { alert(String(e)); } }} style={s.popupBtn}>Sign in with Puter</button> and <strong>Allow popup for puter.com</strong> (Brave/Shields → Allow, Chrome → Pop-up blocked → Always allow). Use <code>http://localhost:5173</code> or <code>http://localhost:8000/simple-chat.html</code> — <code>file://</code> is blocked.
        </div>
      )}
      {puterSignedIn === null && !isPuterReady() && (
        <div style={s.popupBannerWarn} className="mono">Puter.js not loaded — refresh on <code>http://localhost:5173</code> (not <code>file://</code>). If you see <code>Unsupported Protocol</code>, serve via <code>python3 -m http.server</code>.</div>
      )}
      <div style={s.tape}>
        <div style={s.tapeInner}>
          {messages.map((msg, i) => (
            <div key={i} style={msg.role === 'user' ? s.rowUser : s.rowAssist}>
              <div style={msg.role === 'user' ? s.bubbleUser : s.bubbleAssist}>
                <div style={s.bubbleHead} className="mono">
                  <span style={s.bubbleRole}>{msg.role === 'user' ? 'YOU — OUTBOUND' : 'DEPOT — INBOUND'}</span>
                  <span style={s.bubbleTime}>{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
                </div>
                <div style={s.bubbleText}>{msg.content}</div>
                {(msg.accountId || msg.latency || msg.model) && (
                  <div style={s.meta} className="mono">
                    {msg.model && <span>MODEL {msg.model}</span>}
                    {msg.accountId && <span>UNIT {msg.accountId}</span>}
                    {msg.latency && <span>{msg.latency}ms</span>}
                  </div>
                )}
                {msg.error && <div style={s.error} className="mono">ERR — {msg.error}</div>}
              </div>
            </div>
          ))}
          {sending && (
            <div style={s.rowAssist}>
              <div style={s.bubbleAssist}>
                <div style={s.typing} className="mono">
                  <span style={s.typingDot} /><span style={s.typingDot} /><span style={s.typingDot} />
                  <span>TRANSMITTING…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div style={s.composer}>
        <div style={s.composerInner}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message — Shift+Enter for line break"
            rows={1}
            style={s.textarea}
          />
          <button onClick={send} disabled={sending || !input.trim()} style={{ ...s.sendBtn, opacity: !input.trim() || sending ? 0.5 : 1 }}>
            <span className="mono" style={{ fontWeight: 800, letterSpacing: '0.08em' }}>SEND →</span>
          </button>
        </div>
        <div style={s.composerFoot} className="mono">
          <span>User-pays via puter.js — instant, no 30s queue. Allow popup for puter.com.</span>
          <span style={{ opacity: 0.5 }}>ENTER to send · Model: {model}</span>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 520, padding: 0 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1.5px solid var(--border)', background: 'var(--paper-2)', flexWrap: 'wrap' },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  kicker: { fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 999 },
  modelSelector: { position: 'relative' },
  modelBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--card)', cursor: 'pointer', minWidth: 220 },
  logoWrap: { width: 22, height: 22, borderRadius: 6, background: 'white', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' },
  logo: { width: 22, height: 22, borderRadius: 6, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  modelName: { fontSize: 12, fontWeight: 700, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  caret: { fontSize: 10, color: 'var(--muted)' },
  dropdown: { position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, minWidth: 320, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.16)', zIndex: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 380 },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border)' },
  searchIcon: { color: 'var(--muted)', fontSize: 13 },
  search: { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--fg)' },
  list: { overflowY: 'auto', maxHeight: 300 },
  item: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', textAlign: 'left' },
  itemActive: { background: 'var(--paper-2)' },
  logoSmWrap: { width: 22, height: 22, borderRadius: 6, background: 'white', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' },
  logoSm: { width: 22, height: 22, borderRadius: 6, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 },
  itemName: { fontSize: 12, fontWeight: 700, display: 'block' },
  itemProvider: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', display: 'block' },
  itemDesc: { fontSize: 10, color: 'var(--muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  customTag: { fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--electric)', background: 'var(--electric-soft)', border: '1px solid #C7D2FF', padding: '2px 6px', borderRadius: 999 },
  loading: { padding: 16, textAlign: 'center', fontSize: 11, letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 700 },
  toolbarRight: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' },
  badge: { padding: '4px 8px', borderRadius: 999, background: 'var(--ink)', color: 'white' },
  badgeMuted: { color: 'var(--muted)' },
  tape: { flex: 1, overflowY: 'auto', background: 'var(--paper)', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 28px, rgba(0,0,0,0.03) 28px 29px)' },
  tapeInner: { padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 860, margin: '0 auto', width: '100%' },
  rowUser: { display: 'flex', justifyContent: 'flex-end' },
  rowAssist: { display: 'flex', justifyContent: 'flex-start' },
  bubbleUser: { maxWidth: '78%', padding: '12px 14px', borderRadius: 14, background: 'var(--ink)', color: 'var(--paper)', border: '1.5px solid var(--ink)', boxShadow: '2px 2px 0 var(--border)' },
  bubbleAssist: { maxWidth: '78%', padding: '12px 14px', borderRadius: 14, background: 'var(--card)', border: '1.5px solid var(--border)', boxShadow: '2px 2px 0 var(--border)' },
  bubbleHead: { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', opacity: 0.6, marginBottom: 6, borderBottom: '1px dashed var(--border)', paddingBottom: 6 },
  bubbleRole: { letterSpacing: '0.10em' },
  bubbleTime: { fontVariantNumeric: 'tabular-nums' },
  bubbleText: { fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  meta: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.6, borderTop: '1px solid var(--border)', paddingTop: 8 },
  error: { marginTop: 8, fontSize: 10, fontWeight: 700, color: 'var(--danger)', background: 'rgba(255,59,31,0.08)', border: '1px solid rgba(255,59,31,0.18)', padding: '6px 8px', borderRadius: 8 },
  typing: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', color: 'var(--muted)' },
  typingDot: { width: 6, height: 6, borderRadius: 999, background: 'var(--muted)', display: 'inline-block', animation: 'ping 1.2s infinite' },
  composer: { borderTop: '1.5px solid var(--border)', background: 'var(--card)', padding: '12px 14px' },
  composerInner: { display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 860, margin: '0 auto', width: '100%' },
  textarea: { flex: 1, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--paper-2)', fontSize: 13, fontFamily: 'var(--sans)', resize: 'none', outline: 'none', minHeight: 42, maxHeight: 120 },
  sendBtn: { padding: '11px 16px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--signal)', color: 'white', fontSize: 12, cursor: 'pointer', boxShadow: '2px 2px 0 var(--ink)', flexShrink: 0 },
  composerFoot: { display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 10, fontWeight: 600, color: 'var(--muted)', maxWidth: 860, margin: '8px auto 0', width: '100%', flexWrap: 'wrap' },
  popupBanner: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 12px', background: '#FFF7ED', border: '1.5px solid #FDB813', borderRadius: 10, fontSize: 11, lineHeight: 1.5, color: '#7C2D12' },
  popupBannerWarn: { padding: '8px 12px', background: '#FFF1EF', border: '1.5px solid #FFC9C0', borderRadius: 10, fontSize: 11, color: '#7C2D12' },
  popupDot: { width: 8, height: 8, borderRadius: 999, background: '#FDB813', flexShrink: 0, animation: 'ping 1.2s infinite' },
  popupBtn: { padding: '4px 10px', borderRadius: 999, border: '1.5px solid var(--ink)', background: 'var(--ink)', color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer' },
};
