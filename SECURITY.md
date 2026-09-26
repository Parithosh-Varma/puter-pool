# Security Policy

Puter Pool runs a local API server that holds sensitive credentials (Puter
account tokens, your own `API_KEY`, optional Google OAuth client ID)
and proxies requests to third-party AI providers. We take reports about
credential exposure, auth bypass, and injection issues seriously.

## Supported Versions

This project does not yet publish tagged releases with independent security
support; only the latest code on `main` is maintained.

| Version         | Supported          |
| ---------------- | ------------------ |
| `main` (latest)  | :white_check_mark: |
| Older commits     | :x:                 |

If you're running an older checkout, please update to `main` before
reporting an issue — it may already be fixed.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately using one of these channels:

1. **GitHub Security Advisories (preferred):** open a
   [private advisory](https://github.com/Parithosh-Varma/puter-pool/security/advisories/new)
   for this repository. This lets us discuss and patch before disclosure.
2. **Email:** if you don't have GitHub access, contact the maintainer listed
   on the [GitHub profile](https://github.com/Parithosh-Varma) with a
   description of the issue.

When reporting, please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (a minimal request/config that triggers it is ideal)
- The affected file(s)/endpoint(s) (e.g. `src/api/middleware.ts`, `/v1/messages`)
- Any suggested fix or mitigation, if you have one

**Response times:** we aim to acknowledge new reports within 5 business
days and to provide a status update (accepted/declined, and rough timeline
if accepted) within 14 days. Fix timelines depend on severity — critical
credential-exposure or auth-bypass issues are prioritized.

Please give us a reasonable window to release a fix before any public
disclosure. We're happy to credit reporters in the changelog unless you'd
prefer to stay anonymous.

## Scope

In scope:

- The API server (`src/`), including auth middleware, the OpenAI/Anthropic
  compatible endpoints, the scheduler, credit tracker, and account manager
- The dashboard (`dashboard/`)
- The Docker/Fly/Railway deployment configs in this repo
- The `supabase-schema.sql` schema and any Supabase-backed auth flow

Out of scope:

- Vulnerabilities in Puter's own platform/API (report those to Puter)
- Vulnerabilities in third-party AI provider platforms accessed through Puter
- Issues that require an attacker to already have your `.env` file, raw
  Puter account tokens, or shell access to your host
- Denial-of-service via simply exhausting your own pooled accounts' daily
  credits

## Security-relevant configuration

If you're deploying this yourself, a few things matter for your own
security posture (not vulnerabilities in the code, but common
misconfigurations):

- **Set a strong `API_KEY`.** The default in `.env.example` is a placeholder
  (`change-me-to-a-secure-random-string`) — never deploy with it unchanged.
  `apiKeyAuth` middleware (`src/api/middleware.ts`) skips authentication
  entirely when `NODE_ENV=development`, so make sure production deployments
  set `NODE_ENV=production` (or another non-development value). Note the
  production API guard is `firebaseAuth` (`src/index.ts`); `apiKeyAuth` is
  currently not wired into the request path.
- **Never commit `.env`, `data/pool.db`, or `logs/`.** These can contain
  Puter account tokens, your API key, and request logs. Check `.gitignore`
  before pushing a fork or a deployment branch.
- **Treat pooled Puter account tokens as credentials.** Anyone with a token
  can consume that account's daily allowance and, depending on Puter's
  permissions model, potentially access data in that account. Only pool
  accounts you own, and rotate tokens if you suspect exposure.
- **The dashboard and API are intended for local/private use.** If you
  expose the API or dashboard publicly (not just `localhost`), put it behind
  your own auth/reverse proxy in addition to `API_KEY`, and review CORS/
  `helmet` settings in `src/index.ts` for your deployment.
- **Rotate `GOOGLE_CLIENT_ID`, `GROQ_API_KEY`, and Supabase keys** the same way you
  would any OAuth or database credential if they're ever exposed.

## Disclosure Policy

Once a reported vulnerability is fixed, we'll publish details via a GitHub
Security Advisory and note the fix in `CHANGELOG.md` under a `### Security`
heading, consistent with the existing changelog format.
