import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth, AUTH_REQUIRED } from '../contexts/AuthContext';
import { GithubIcon } from './icons';

const CLOCK = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

function WifiIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
      <path d="M8 10.2a1.4 1.4 0 100 2.8 1.4 1.4 0 000-2.8zM8 6.9c-1.5 0-2.9.6-3.9 1.6l1.3 1.3a3.7 3.7 0 015.2 0l1.3-1.3A5.5 5.5 0 008 6.9zM8 3.5c-2.4 0-4.6 1-6.2 2.5L3.1 7.3a6.9 6.9 0 019.8 0l1.3-1.3A8.7 8.7 0 008 3.5z" transform="translate(0 -3)" />
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 27 13" aria-hidden>
      <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" fill="none" stroke="rgba(0,0,0,0.45)" />
      <rect x="2" y="2" width="17" height="9" rx="2" fill="rgba(0,0,0,0.75)" />
      <path d="M24 4.5v4c1-.3 1.6-1.1 1.6-2s-.6-1.7-1.6-2z" fill="rgba(0,0,0,0.45)" />
    </svg>
  );
}
function TrafficLights() {
  return (
    <span className="hcy-dots" aria-hidden>
      <i className="hcy-dot hcy-dot-r" />
      <i className="hcy-dot hcy-dot-y" />
      <i className="hcy-dot hcy-dot-g" />
    </span>
  );
}

export default function LoginPage() {
  const { setAuth, enterLocal } = useAuth();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hcy">
      <style>{CSS}</style>
      <header className="hcy-menubar">
        <div className="hcy-menubar-left">
          <img src="https://avatars.githubusercontent.com/u/277201506?v=4&size=64" alt="" className="hcy-mark" />
          <span className="hcy-appname">puter depot</span>
          <span className="hcy-depot-badge">ROUTER · LOT 2026</span>
          <nav className="hcy-menu">
            <a href="#features">features</a>
            <a href="#faq">faq</a>
          </nav>
        </div>
        <div className="hcy-menubar-right">
          <WifiIcon />
          <BatteryIcon />
          <span className="hcy-clock">{CLOCK.format(now)}</span>
          <a href="#get-started" className="hcy-menubar-cta">get started →</a>
        </div>
      </header>

      <main>
        <section className="hcy-hero" id="get-started">
          <span className="hcy-kao hcy-kao-1">^ ω ^</span>
          <span className="hcy-kao hcy-kao-2">&#123; ^-^ &#125;</span>
          <span className="hcy-kao hcy-kao-3">(¬_¬)</span>
          <span className="hcy-kao hcy-kao-4">¯\_(ツ)_/¯</span>

          <div className="hcy-nametag hcy-float hcy-float-a" aria-hidden>
            <div className="hcy-nametag-band">hello</div>
            <div className="hcy-nametag-body">
              my name is
              <img src="https://avatars.githubusercontent.com/u/277201506?v=4&size=128" alt="" className="hcy-nametag-img" />
            </div>
          </div>

          <div className="hcy-win hcy-float hcy-float-b" aria-hidden>
            <TrafficLights />
            <div className="hcy-win-screen">
              <div className="hcy-win-face">¯\_(ツ)_/¯</div>
              <div className="hcy-win-caption">pooling accounts…</div>
              <div className="hcy-win-bar"><i style={{ width: '72%' }} /></div>
            </div>
          </div>

          <div className="hcy-win hcy-float hcy-float-c" aria-hidden>
            <TrafficLights />
            <div className="hcy-win-screen">
              <div className="hcy-win-face">{'{ ^-^ }'}</div>
              <div className="hcy-win-caption">routing to gpt-5.2…</div>
              <div className="hcy-win-bar"><i style={{ width: '38%' }} /></div>
            </div>
          </div>

          <div className="hcy-hero-center">
            <span className="hcy-pill-label">free ai api · no limits · depot rail</span>
            <h1 className="hcy-title">puter depot</h1>
            <p className="hcy-sub">
              pool your puter accounts and route requests across 400+ models.
              one endpoint. zero dollars. industrial-grade failover.
            </p>

            <div className="hcy-btns" id="sign-in-anchor">
              {!AUTH_REQUIRED && (
                <button className="hcy-btn hcy-btn-mac hcy-btn-big" onClick={enterLocal}>
                  open depot →
                </button>
              )}
              <GoogleLogin
                onSuccess={async ({ credential }) => {
                  if (!credential) return;
                  try {
                    const res = await fetch('/api/auth/google', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ idToken: credential }),
                    });
                    const data = await res.json();
                    if (data.user) setAuth(data.user, data.token);
                  } catch { alert('Sign in failed'); }
                }}
                onError={() => alert('Sign in failed')}
                theme={AUTH_REQUIRED ? 'filled_blue' : 'outline'}
                shape="pill"
                size="large"
                text={AUTH_REQUIRED ? 'signin_with' : 'continue_with'}
                logo_alignment="left"
                width={292}
              />
              <a className="hcy-btn hcy-btn-gray" href="https://github.com/Parithosh-Varma/puter-account-pool-manager-" target="_blank" rel="noopener noreferrer">
                <GithubIcon size={16} /> star on github
              </a>
            </div>
            <p className="hcy-fineprint">
              {AUTH_REQUIRED ? '100% free · no card needed · bring your own cartridges' : 'no account needed · sign in with google to sync'}
            </p>
            <div className="hcy-conveyor-mini" aria-hidden>
              <span>CONVEYOR — REQUEST RAIL READY</span>
              <i />
            </div>
          </div>
        </section>

        <section className="hcy-section" id="features">
          <span className="hcy-pill-label hcy-plabel">the manifest</span>
          <div className="hcy-note-win">
            <TrafficLights />
            <div className="hcy-note-title">manifest.txt — DEPOT v2</div>
            <div className="hcy-note-body">
              <p>
                everyone wants free ai. puter gives every account access to hundreds of frontier models — but juggling keys and quotas by hand is a pain.
              </p>
              <p>
                the depot is a rail yard for tokens. throw all your puter cartridges into the rack, point your app at one openai-compatible endpoint, and the router shunts load, retries failures, and keeps every bay healthy while you sleep.
              </p>
              <p>it's early! spin it up today and tell us what you think.</p>
            </div>
          </div>

          <div className="hcy-feats">
            <div className="hcy-feat">
              <span className="hcy-feat-emoji">♻️</span>
              <b>round-robin + least-used</b>
              <span>scheduling strategies that spread quota evenly — like shunting cars</span>
            </div>
            <div className="hcy-feat">
              <span className="hcy-feat-emoji">🩺</span>
              <b>health rail</b>
              <span>dead cartridges get parked automatically, tape logs every move</span>
            </div>
            <div className="hcy-feat">
              <span className="hcy-feat-emoji">📡</span>
              <b>live tape + charts</b>
              <span>watch every request print to tape in real time</span>
            </div>
          </div>
        </section>

        <section className="hcy-section" id="faq">
          <span className="hcy-pill-label hcy-plabel">faq</span>
          <div className="hcy-faq-list">
            <details className="hcy-faq-item">
              <summary>what is this?</summary>
              <p>a self-hosted depot / load balancer for puter accounts. add cartridges, get a single free ai endpoint that rotates between them.</p>
            </details>
            <details className="hcy-faq-item">
              <summary>is it really free?</summary>
              <p>yes. you bring your own puter accounts — we just shunt traffic across them. no charges, no cards, just rail.</p>
            </details>
            <details className="hcy-faq-item">
              <summary>how do i use it?</summary>
              <p>add cartridges from the depot, then point any openai-compatible client at <code>/v1/chat/completions</code>. that’s it.</p>
            </details>
            <details className="hcy-faq-item">
              <summary>what happens if a cartridge empties?</summary>
              <p>health checks catch it, it gets parked, and traffic shunts to healthy bays. requests retry automatically.</p>
            </details>
          </div>
        </section>
      </main>

      <footer className="hcy-footer">
        <div className="hcy-footer-links">
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">privacy</a>
          <span>·</span>
          <a href="https://github.com/Parithosh-Varma/puter-account-pool-manager-" target="_blank" rel="noopener noreferrer">github</a>
          <span>·</span>
          <span className="hcy-footer-meta">DEPOT SYSTEM · v2 · LOT 2026</span>
        </div>
        <div className="hcy-footer-note">© puter depot · a rail with no limits ^ ω ^</div>
      </footer>
    </div>
  );
}

const CSS = `
.hcy {
  min-height: 100vh;
  background-color: #FDFBF3;
  background-image:
    linear-gradient(#0C0F1210 1px, transparent 1px),
    linear-gradient(90deg, #0C0F1210 1px, transparent 1px),
    radial-gradient(#0C0F1214 1px, transparent 1.3px);
  background-size: 32px 32px, 32px 32px, 34px 34px;
  color: #0C0F12;
  font-family: 'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
}
.hcy a { color: inherit; }
.hcy-menubar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 18px;
  background: rgba(253,251,243,0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1.5px solid #0C0F12;
}
.hcy-menubar-left, .hcy-menubar-right { display: flex; align-items: center; gap: 14px; }
.hcy-mark { width: 28px; height: 28px; border-radius: 8px; box-shadow: 0 1px 0 #0C0F12, 0 2px 8px rgba(0,0,0,0.12); border: 1.5px solid #0C0F12; }
.hcy-appname { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 800; letter-spacing: -0.03em; text-transform: lowercase; }
.hcy-depot-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; color: #0C0F12; background: #F2EDE0; border: 1px solid #E8E1CC; padding: 3px 7px; border-radius: 999px; }
.hcy-menu { display: flex; gap: 14px; }
.hcy-menu a { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0C0F1280; text-decoration: none; }
.hcy-menu a:hover { color: #0C0F12; }
.hcy-clock { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #0C0F1280; font-variant-numeric: tabular-nums; }
.hcy-menubar-right svg { color: rgba(0,0,0,0.55); }
.hcy-menubar-cta { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; text-decoration: none; letter-spacing: -0.01em; color: #FF3B1F; border: 1.5px solid #0C0F12; background: white; padding: 6px 12px; border-radius: 999px; box-shadow: 2px 2px 0 #0C0F12; }
.hcy-menubar-cta:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 #0C0F12; }
.hcy-hero { position: relative; max-width: 1200px; width: 100%; margin: 0 auto; padding: 96px 24px 80px; box-sizing: border-box; }
.hcy-hero-center { position: relative; z-index: 2; max-width: 720px; margin: 0 auto; text-align: center; animation: hcy-rise 0.7s cubic-bezier(0.16,1,0.3,1) both; }
@keyframes hcy-rise { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
.hcy-title { margin: 16px 0 14px; font-family: 'Space Grotesk', sans-serif; font-size: clamp(44px, 8vw, 84px); font-weight: 800; letter-spacing: -0.05em; line-height: 0.95; text-transform: lowercase; }
.hcy-sub { margin: 0 auto 28px; max-width: 540px; font-size: 17px; line-height: 1.55; color: #0C0F1280; }
.hcy-btns { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
.hcy-btns > div:first-child { filter: drop-shadow(0 10px 20px rgba(255,59,31,0.22)); transition: opacity 0.15s, transform 0.15s; }
.hcy-btns > div:first-child:hover { opacity: 0.88; }
.hcy-btns > div:first-child:active { transform: scale(0.97); }
.hcy-btn { display: inline-flex; align-items: center; gap: 9px; height: 40px; padding: 0 18px 1px; border-radius: 999px; font-size: 14px; font-weight: 700; letter-spacing: -0.02em; text-decoration: none; color: #0C0F12; background: white; border: 1.5px solid #0C0F12; box-shadow: 3px 3px 0 #0C0F12; text-shadow: none; transition: all 0.12s; font-family: 'Space Grotesk', sans-serif; }
.hcy-btn:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 #0C0F12; }
.hcy-btn:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #0C0F12; }
.hcy-btn-mac { background: #FF3B1F; color: white; border-color: #0C0F12; box-shadow: 3px 3px 0 #0C0F12; }
.hcy-btn-big { height: 46px; padding: 0 22px 2px; font-size: 15px; }
.hcy-fineprint { margin-top: 14px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; color: #0C0F1273; text-transform: uppercase; }
.hcy-conveyor-mini { margin-top: 18px; display: inline-flex; align-items: center; gap: 10; padding: 7px 12px; border-radius: 999px; background: #0C0F12; color: #FDFBF3; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; }
.hcy-conveyor-mini i { width: 44px; height: 2px; background: repeating-linear-gradient(90deg, #FDFBF3 0 6px, transparent 6px 12px); border-radius: 999px; display: inline-block; }
.hcy-pill-label { display: inline-block; padding: 6px 14px; border-radius: 999px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800; letter-spacing: 0.10em; text-transform: uppercase; color: #0C0F12; background: white; border: 1.5px solid #0C0F12; box-shadow: 2px 2px 0 #0C0F12; white-space: nowrap; }
.hcy-plabel { margin-bottom: 22px; }
.hcy-dots { display: inline-flex; gap: 5px; padding: 0 1px 6px; }
.hcy-dot { width: 12px; height: 12px; border-radius: 999px; display: inline-block; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.08); }
.hcy-dot-r { background: radial-gradient(circle at 35% 30%, #ff9d97, #ff5f57 65%, #e0443e); }
.hcy-dot-y { background: radial-gradient(circle at 35% 30%, #ffe098, #febc2e 65%, #d89e22); }
.hcy-dot-g { background: radial-gradient(circle at 35% 30%, #9be59b, #28c840 65%, #1ea933); }
.hcy-win { background: linear-gradient(90deg, #E8E1CC, #FDFBF3 50%, #E8E1CC); border: 1.5px solid #0C0F12; border-radius: 10px; padding: 7px 4px 4px; box-shadow: 3px 3px 0 #0C0F12; display: flex; flex-direction: column; align-items: flex-start; }
.hcy-win-screen { width: 100%; background: #fff; border-radius: 6px; padding: 18px 16px 16px; box-sizing: border-box; text-align: center; border: 1px solid #E8E1CC; }
.hcy-win-face { font-family: 'JetBrains Mono', monospace; font-size: 22px; letter-spacing: 0.02em; font-weight: 700; }
.hcy-win-caption { margin-top: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0C0F1280; }
.hcy-win-bar { margin: 12px auto 0; width: 80%; height: 6px; border-radius: 999px; background: #F2EDE0; overflow: hidden; border: 1px solid #E8E1CC; }
.hcy-win-bar i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #0C0F12, #FF3B1F); animation: hcy-slide 2.2s ease-in-out infinite alternate; }
@keyframes hcy-slide { from { transform: translateX(-6%); } to { transform: translateX(10%); } }
.hcy-float { position: absolute; z-index: 1; }
.hcy-float-a { left: 3%; top: 58px; transform: rotate(-7deg); }
.hcy-float-b { right: 4%; top: 114px; width: 185px; transform: rotate(4deg); }
.hcy-float-c { left: 1%; bottom: 16px; width: 175px; transform: rotate(-3deg); }
.hcy-nametag { width: 118px; border-radius: 8px; overflow: hidden; background: #fff; border: 1.5px solid #0C0F12; box-shadow: 3px 3px 0 #0C0F12; text-align: center; font-family: 'JetBrains Mono', monospace; }
.hcy-nametag-band { background: #FF3B1F; color: #fff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; padding: 5px 0; border-bottom: 1.5px solid #0C0F12; }
.hcy-nametag-body { padding: 8px 8px 10px; font-size: 10px; color: #333; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.hcy-nametag-img { display: block; width: 56px; height: 56px; margin: 6px auto 0; border-radius: 6px; border: 1.5px solid #0C0F12; }
.hcy-kao { position: absolute; font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #0C0F12; user-select: none; animation: hcy-bob 3.4s ease-in-out infinite alternate; background: white; border: 1.5px solid #0C0F12; padding: 4px 8px; border-radius: 999px; box-shadow: 2px 2px 0 #0C0F12; }
.hcy-kao-1 { left: 22%; top: 36px; }
.hcy-kao-2 { right: 20%; top: 54px; animation-delay: 0.6s; }
.hcy-kao-3 { right: 10%; bottom: 150px; animation-delay: 1.1s; }
.hcy-kao-4 { left: 27%; bottom: 26px; animation-delay: 1.6s; }
@keyframes hcy-bob { from { transform: translateY(-5px) rotate(-2deg); } to { transform: translateY(5px) rotate(2deg); } }
.hcy-section { max-width: 860px; margin: 0 auto; padding: 56px 24px 64px; border-top: 1.5px solid #0C0F12; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; width: 100%; }
main > .hcy-section:last-of-type { padding-bottom: 96px; }
.hcy-note-win { width: 100%; max-width: 720px; background: linear-gradient(90deg, #E8E1CC, #F2EDE0 50%, #E8E1CC); border: 1.5px solid #0C0F12; border-radius: 10px; padding: 8px 4px 4px; box-shadow: 3px 3px 0 #0C0F12; display: flex; flex-direction: column; }
.hcy-note-title { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0C0F1280; padding-bottom: 6px; align-self: center; margin-top: -20px; background: white; border: 1px solid #0C0F12; padding: 4px 10px; border-radius: 999px; box-shadow: 2px 2px 0 #0C0F12; }
.hcy-note-body { background: #FFFEF8; border-radius: 6px; padding: 22px 26px; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.7; color: #1A1E22; border: 1px solid #E8E1CC; }
.hcy-note-body p { margin: 0 0 14px; }
.hcy-note-body p:last-child { margin-bottom: 0; }
.hcy-feats { margin-top: 32px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; width: 100%; max-width: 720px; }
.hcy-feat { display: flex; flex-direction: column; alignItems: center; gap: 6px; text-align: center; padding: 18px 14px; border-radius: 10px; background: white; border: 1.5px solid #0C0F12; box-shadow: 3px 3px 0 #0C0F12; font-size: 13px; color: #0C0F1280; }
.hcy-feat b { font-family: 'Space Grotesk', sans-serif; font-weight: 800; color: #0C0F12; letter-spacing: -0.02em; font-size: 14px; }
.hcy-feat span { line-height: 1.45; }
.hcy-feat-emoji { font-size: 22px; }
.hcy-faq-list { width: 100%; max-width: 720px; display: flex; flex-direction: column; background: white; border: 1.5px solid #0C0F12; border-radius: 10px; overflow: hidden; box-shadow: 3px 3px 0 #0C0F12; }
.hcy-faq-item { border-bottom: 1.5px solid #E8E1CC; padding: 0 2px; }
.hcy-faq-item:last-child { border-bottom: none; }
.hcy-faq-item summary { cursor: pointer; list-style: none; font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; padding: 16px 14px; position: relative; }
.hcy-faq-item summary::-webkit-details-marker { display: none; }
.hcy-faq-item summary::after { content: '+'; position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #0C0F12; font-weight: 800; width: 24px; height: 24px; display: grid; place-items: center; border: 1.5px solid #0C0F12; border-radius: 999px; background: #F2EDE0; }
.hcy-faq-item[open] summary::after { content: '–'; background: #0C0F12; color: white; }
.hcy-faq-item p { margin: 0; padding: 0 14px 16px; font-size: 13px; line-height: 1.6; color: #0C0F1280; }
.hcy-faq-item code { font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #F2EDE0; border: 1px solid #E8E1CC; border-radius: 6px; padding: 2px 6px; font-weight: 700; }
.hcy-footer { margin-top: auto; border-top: 1.5px solid #0C0F12; padding: 24px 24px 32px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; background: white; }
.hcy-footer-links { display: flex; align-items: center; gap: 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.hcy-footer-links a { color: #0C0F1280; text-decoration: none; }
.hcy-footer-links a:hover { color: #0C0F12; }
.hcy-footer-meta { color: #0C0F12; background: #F2EDE0; border: 1px solid #E8E1CC; padding: 3px 8px; border-radius: 999px; }
.hcy-footer-note { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; color: #0C0F1273; }
@media (max-width: 900px) { .hcy-float-a, .hcy-float-b, .hcy-float-c { display: none; } }
@media (max-width: 640px) { .hcy-menu, .hcy-clock, .hcy-menubar-right svg { display: none; } .hcy-hero { padding: 72px 20px 64px; } .hcy-kao { font-size: 12px; } .hcy-kao-1 { left: 6%; } .hcy-kao-2 { right: 8%; } }
`;
