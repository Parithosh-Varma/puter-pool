# Puter Pool — Free AI API with No Limits (OpenAI + Anthropic)

**Get a free AI API** for **Claude Opus 5**, **GPT-5.6 Sol**, **Gemini 3.7 Flash**, DeepSeek V4, Qwen, Llama, Mistral, Grok and **400+ models** by pooling free Puter accounts. **Unlimited credits** — no card, no rate limits, no token costs.

- **Live landing (Cloudflare):** https://puterpool.parithosh.workers.dev
- **Tool (localhost-only):** `http://localhost:5173` — depot dashboard, `http://localhost:3000` API
- **Repo:** https://github.com/Parithosh-Varma/puter-pool (moved from `puter-account-pool-manager-` — old URL redirects)

Each Puter account gives daily AI credits. When one hits `No usage left for request`, the depot shunts to the next healthy bay — you never see a 429.

> **Keywords:** free AI API · free Claude API · free GPT-4 API · free Gemini API · unlimited AI API · Anthropic proxy · OpenAI proxy · Puter pool

```bash
git clone https://github.com/Parithosh-Varma/puter-pool.git
cd puter-pool
cp .env.example .env   # SQLite at data/pool.db by default — no config needed
npm install && npm run build && npm start

# separate terminal:
cd dashboard && npm install && npm run dev
# → tool http://localhost:5173 (no auth, local-only)
# → API  http://localhost:3000  (landing stays on Cloudflare)
```

## How it works

1. **Create multiple Puter accounts** (free at puter.com) — each gives daily credits
2. **Paste tokens in depot** at `http://localhost:5173` (health + credit tracked)
3. **Point any SDK** at one endpoint — OpenAI `POST /v1/chat/completions` or Anthropic `POST /v1/messages` / `POST /anthropic/v1/messages`
4. **Scheduler shunts** — `round-robin` or `least-used`, retries up to `MAX_RETRIES=3`, parks `exhausted`/`error` bays via `HealthChecker`
5. **Uninterrupted** — pool handles rotation transparently, tape logs every request

It’s a **free AI API proxy** — OpenAI + Anthropic compatible, SSE streaming on both, same pooled rail.

## Features

- **Free AI API** — OpenAI at `/v1/chat/completions` + Anthropic at `/v1/messages`, `/anthropic/v1/messages`, `/anthropic/messages` (all SSE)
- **400+ free models** — live from `https://developer.puter.com/ai/models-feed.xml` (465 as of Aug 27) — Claude Opus 5, GPT-5.6 Sol, Gemini 3.7 Flash, DeepSeek V4, Muse Glimmer 30B, Mistral Medium 3.5, Qwen3.8 Flash, Grok 4.6, etc. — grouped by lab with LobeHub `icons-static-svg`
- **Unlimited credits** — automatic failover across accounts never hits cap
- **Local by design** — depot never deployed; tokens stay on `localhost`, landing is static on Cloudflare Workers (`puterpool`)
- **Depot UI** — `P` logo (`#0C0F12` ink + `#FF3B1F` signal + `#FDB813` bolt), industrial rail, conveyor, health rail, queue meter, request tape, live traffic chart
- **Custom depot icons** — RoundRobin / HealthRail / LiveTape SVGs + LobeHub provider logos
- **Local SQLite** — `data/pool.db` via `node:sqlite` auto-created; `NEON_DATABASE_URL`/`DATABASE_URL` optional for Postgres
- **React dashboard** — no Google OAuth gate (auto `LOCAL`); chat, account rack, strategy switch
- **Docker** — `docker compose up -d` persists `./data` + `./logs`

## API

```
# Proxies (same pool, same failover)
POST /v1/chat/completions              OpenAI — JSON {model, messages, stream, max_tokens, temperature}
POST /v1/messages                      Anthropic — JSON {model, max_tokens, messages, system, temperature, stream}
POST /anthropic/v1/messages            alt Anthropic (SDK baseURL /anthropic)
POST /anthropic/messages               alt
GET  /v1/models                        OpenAI list (from https://api.puter.com/puterai/chat/models/details)
GET  /healthz                          liveness
GET  /readyz                           readiness (503 if 0 active)

# App
POST /api/ai/chat                      auto-routed {model, prompt, stream}
GET  /api/models                       Puter models (RSS + details)
GET  /api/accounts                     list with health + credit (token redacted)
POST /api/accounts                     {name, token, dailyCreditLimit}
DELETE /api/accounts/:id
PATCH /api/accounts/:id                {status, token, name}
GET  /api/stats                        pool + scheduler stats
GET  /api/dashboard                    full UI data
GET  /api/history?limit=100            request history (DB or memory)
```

**OpenAI curl:**
```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-opus-5","messages":[{"role":"user","content":"Hello"}]}'
```

**Anthropic curl:**
```bash
curl http://localhost:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: ignored" -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-opus-5","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

**OpenAI SDK:**
```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:3000/v1", api_key="ignored")
print(client.chat.completions.create(model="gpt-5.6-sol", messages=[{"role":"user","content":"Hello"}]).choices[0].message.content)
```

**Anthropic SDK:**
```python
import anthropic
c = anthropic.Anthropic(base_url="http://localhost:3000", api_key="ignored")
print(c.messages.create(model="claude-opus-5", max_tokens=1024, messages=[{"role":"user","content":"Hello"}]).content[0].text)
```

## Config

Full options in `.env.example`. Key:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3000 | API port |
| `SQLITE_PATH` | `data/pool.db` | Local SQLite file (auto-created) |
| `NEON_DATABASE_URL` / `DATABASE_URL` | — | If set, uses Postgres (Neon) instead of SQLite |
| `SCHEDULER_STRATEGY` | round-robin | `round-robin` \| `least-used` |
| `MAX_RETRIES` | 3 | Accounts to try before 5xx |
| `HEALTH_CHECK_INTERVAL_MS` | 60000 | Re-verify interval |
| `REQUEST_TIMEOUT_MS` | 30000 | Per-request timeout |

## Dashboard

`http://localhost:5173` — **TOOL · LOCALHOST ONLY** (no login):

- Chat with any model (streaming)
- Rack: add/enable/disable/delete cartridges
- Health / credit / latency / errorRate / consecutiveFailures
- Queue rail (128 slots) + live tape + traffic chart
- Strategy switch

## Database

- **Default:** `node:sqlite` at `SQLITE_PATH` (no setup, `data/` mounted in Docker)
- **Optional Postgres:** set `NEON_DATABASE_URL=postgresql://...`; schema in `supabase-schema.sql` (`puter_accounts` + `ai_responses`) auto-created for SQLite, run SQL for Postgres

## Docker

```bash
# SQLite (default, no env)
docker compose up -d

# Postgres
export NEON_DATABASE_URL=postgresql://...
docker compose up -d
```

## Landing

Separate Vite app at `/landing` — not in this repo’s git (see `.gitignore:landing/`), deployed to Cloudflare Workers:

```bash
cd landing && npm install && npm run build
source ~/bin/load-env.zsh  # CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
npx wrangler deploy        # → https://puterpool.parithosh.workers.dev
```

Source: `landing/src/App.tsx` — hero with OpenAI + Anthropic curl, 400+ grouped by lab (live RSS), how it shunts, API docs, compare, local steps, FAQ; LobeHub CDN icons + custom depot SVGs; `wrangler.toml` `name = "puterpool"`.

## Tests

```bash
npm test              # 54 tests
npm run test:coverage
npm run typecheck
```

## License

Apache-2.0
