# Currency Converter UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Next.js web UI to the existing currency converter API in a monorepo structure, deploy to Cloudflare Pages.

**Architecture:** Restructure as npm workspace monorepo with two packages: existing API (Cloudflare Worker) and new web UI (Next.js on Cloudflare Pages). Add `/currencies` endpoint to API, build minimal responsive conversion form, share types between packages.

**Tech Stack:** TypeScript, Next.js 15, Tailwind CSS, Cloudflare Workers, Cloudflare Pages, Vitest, React Testing Library, Playwright

---

## Status

### Completed

- [x] Phase 1: Monorepo restructured — npm workspaces, `packages/api/`, `packages/web/`
- [x] Phase 2: `/currencies` endpoint added to API with tests
- [x] Phase 3: Next.js 15 app scaffolded — Tailwind CSS, Vitest + RTL configured, `.env.local.example` with `NEXT_PUBLIC_API_URL`

### Remaining

- [ ] Phase 4: Build UI components
- [ ] Phase 5: Add tests
- [ ] Phase 6: Deploy and verify

---

## Phase 4: Build UI Components

### 4.1 Add `@repo/api` workspace dependency to web package

In `packages/web/package.json`, add to `dependencies`:
```json
"@repo/api": "*"
```

This enables type-safe imports from the API package without duplication:
```ts
import type { ConversionResult, CurrenciesResponse, ErrorResponse } from '@repo/api/src/types';
```

### 4.2 Create `src/lib/api.ts`

API client with environment-based URL switching and full type safety.

```ts
// Base URL from env var — set in .env.local for dev, Cloudflare Pages env for prod
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

export async function fetchCurrencies(): Promise<CurrenciesResponse>
export async function convertCurrency(amount: number, from: string, to: string): Promise<ConversionResult>
```

Error handling contract:
- Network failure → throw `Error('Unable to connect. Please try again.')`
- HTTP 400 → throw `Error(<api error message>)`
- HTTP 404 → throw `Error('Service not found. Please refresh the page.')`
- HTTP 5xx → throw `Error('Something went wrong. Please try again later.')`

### 4.3 Create `src/components/CurrencyConverter.tsx`

Single `'use client'` component managing all state with `useState`.

**Inputs:**
- `amount` — number input, validates > 0 (inline error)
- `from` — currency dropdown, populated from `/currencies` response
- `to` — currency dropdown, same source
- Convert button — disabled until form is valid (amount > 0, from and to selected, from ≠ to)

**Result display (shown after successful conversion):**
- Converted amount (large, prominent)
- Exchange rate used
- Currency description from API (`ConversionResult.description`)

**Error display:**
- Red alert box below the form
- Cleared when a new conversion is started

**Loading state:**
- Convert button shows spinner/loading text
- All form inputs disabled during API call
- Previous results cleared when new conversion starts
- Prevents duplicate submissions

**`/currencies` failure:**
- Show inline error with a retry button

**State shape:**
```ts
const [amount, setAmount] = useState('');
const [from, setFrom] = useState('');
const [to, setTo] = useState('');
const [currencies, setCurrencies] = useState<string[]>([]);
const [result, setResult] = useState<ConversionResult | null>(null);
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [currenciesError, setCurrenciesError] = useState(false);
```

Fetch currencies in `useEffect` on mount (and on retry).

### 4.4 Update `src/app/page.tsx`

Replace the placeholder with the `CurrencyConverter` component, keeping the existing layout wrapper.

---

## Phase 5: Add Tests

### 5.1 Component tests — `src/components/CurrencyConverter.test.tsx`

Use Vitest + React Testing Library (already configured in `vitest.config.ts`).

Test cases:
1. Renders form with amount input, from/to dropdowns, Convert button
2. Fetches and populates currency dropdowns on mount
3. Convert button disabled when amount is empty
4. Convert button disabled when from === to
5. Convert button disabled when amount ≤ 0
6. Shows loading state during conversion (button text, inputs disabled)
7. Displays converted amount, rate, and description on success
8. Displays API error message on 400 response
9. Clears previous result when new conversion starts
10. Shows currencies fetch error with retry button
11. Retry button re-fetches currencies

Mock strategy: `vi.mock('../lib/api')` to mock `fetchCurrencies` and `convertCurrency`.

### 5.2 E2E tests — `src/e2e/converter.spec.ts`

Install Playwright as a dev dependency in `packages/web`:
```
npm install --save-dev @playwright/test
```

Add `playwright.config.ts` at `packages/web/` root pointing to `http://localhost:3000`.

Test cases:
1. Full happy path: load page → currencies populate → enter amount → select from/to → click Convert → result displays
2. Validation: Convert disabled with no amount entered
3. Validation: Convert disabled when from === to
4. Error path: API returns error → error message displays

Run against local dev server (`webServer` option in Playwright config).

---

## Phase 6: Deploy and Verify

### 6.1 Cloudflare Pages setup

The `packages:build` and `pages:deploy` scripts are already in `packages/web/package.json`. Steps:
1. Create a Cloudflare Pages project linked to this repo
2. Set build command: `npm run pages:build -w packages/web`
3. Set build output directory: `.vercel/output/static`
4. Set environment variable: `NEXT_PUBLIC_API_URL=<deployed Worker URL>`

### 6.2 GitHub Actions CI/CD workflow

Create `.github/workflows/deploy.yml` that:
1. On push to `main`
2. Runs API tests (`npm test -w packages/api`)
3. Runs web component tests (`npm test -w packages/web`)
4. Deploys API: `wrangler deploy` in `packages/api`
5. Deploys web: `npm run pages:deploy -w packages/web`
6. Runs Playwright E2E smoke tests against the deployed URL

### 6.3 Verification checklist

- [ ] UI calls API and displays conversions correctly
- [ ] Responsive on mobile, tablet, desktop
- [ ] Error states work (invalid input, API down)
- [ ] 80%+ test coverage on new UI code
- [ ] E2E tests pass in CI
- [ ] Both API and web deployed to Cloudflare

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/web/src/lib/api.ts` | API client, env-based URL, typed responses |
| `packages/web/src/components/CurrencyConverter.tsx` | Main form component |
| `packages/web/src/app/page.tsx` | Home page (update to use component) |
| `packages/web/src/components/CurrencyConverter.test.tsx` | Component tests |
| `packages/web/src/e2e/converter.spec.ts` | Playwright E2E tests |
| `packages/web/playwright.config.ts` | Playwright config |
| `.github/workflows/deploy.yml` | CI/CD workflow |

## Types (from `@repo/api`)

Already defined in `packages/api/src/types.ts` — no duplication needed:
- `ConversionResult` — `{ from, to, amount, convertedAmount, rate, description, availableCurrencies }`
- `CurrenciesResponse` — `{ currencies: string[] }`
- `ErrorResponse` — `{ error: string }`
