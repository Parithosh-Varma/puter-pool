# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Security

- Patched transitive vulnerabilities via `npm audit fix` (qs, body-parser,
  brace-expansion, js-yaml, nanoid, postcss): 13 advisories down to 5.
- Remaining 5 advisories require breaking major bumps (vitest 5 / vite 8 /
  esbuild chain) and are deferred for manual review.
- Bumped `morgan` 1.10.x to 1.12.x (log-forging fix).
- Fixed `SECURITY.md` inaccuracies: repo has no `GOOGLE_CLIENT_SECRET`
  (only `GOOGLE_CLIENT_ID`), added `GROQ_API_KEY` to the rotation list, and
  documented that the production API guard is `firebaseAuth` (`src/index.ts`)
  while `apiKeyAuth` is currently not wired into the request path.

### Added

- `eslint.config.mjs`: flat-config lint gate for root TypeScript/JavaScript
  (`typescript-eslint` recommended, scoped to root; `dashboard/` excluded as a
  separate app). `npm run lint` passes with 0 errors.
- `CHANGELOG.md` to track unreleased maintenance.

### Changed

- Non-breaking dependency updates (patch + minor): `@supabase/supabase-js`
  2.109 to 2.116, `express` 4.21 to 4.22, `helmet` 8.0 to 8.3, `winston` 3.17
  to 3.19, `typescript` 5.7 to 5.9, `uuid` 11.0 to 11.1, `tsx` 4.19 to 4.23,
  `dotenv` 16.4 to 16.6, plus patch bumps (cors, ws, vitest 2.1.9, types-*).
- Fixed `lint` script for ESLint v9 flat-config syntax (removed `--ext` flag).
- Documented `npm run lint` in `AGENTS.md` verification steps.
- Non-breaking patch/minor bumps: `@supabase/supabase-js` 2.116.0 to 2.117.2,
  `tsx` 4.23.13 to 4.23.15, `typescript-eslint` 8.70.0 to 8.70.1,
  `@types/node` 22.20.3 to 22.20.4. Prod `npm audit`: 0 vulnerabilities;
  dev-only 5 (vitest/vite/esbuild chain) still deferred as breaking majors.

### Deprecated

- Major bumps flagged for manual review (NOT applied): `express` 5,
  `eslint` 10, `vitest` 5, `vite` 8, `typescript` 7, `uuid` 14,
  `node-fetch` 3 (ESM-only), `dotenv` 17, `express-rate-limit` 8,
  `google-auth-library` 11.

### Fixed

- Removed unused `apiKeyAuth` import in `src/index.ts` (dead import; the
  middleware itself is unchanged in `src/api/middleware.ts`). Lint warnings
  30 down to 29, 0 errors.
