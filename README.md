# LinkedIn Currency Converter

A currency converter that reads USD-based exchange rates from a US Treasury CSV file. Provides a REST API (Cloudflare Workers) and a web UI (Next.js).

## Project Structure

```
linkedin-currency-converter/
├── packages/
│   ├── api/          # Cloudflare Worker REST API
│   └── web/          # Next.js web UI
├── prd/              # Product requirements
├── docs/             # Design docs, plans, contributing guide, runbook
├── package.json      # Root workspace config
└── tsconfig.base.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript |
| API runtime | Cloudflare Workers (Wrangler) |
| Web framework | Next.js 15 |
| Styling | Tailwind CSS |
| Testing | Vitest, Playwright |
| Deployment | Cloudflare Workers + Cloudflare Pages |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/currencies` | Returns list of supported currency codes |
| `GET` | `/convert?amount=&from=&to=` | Converts an amount between currencies |

**Constraint:** Only USD-based conversions are supported (one of `from`/`to` must be `USD`).

## Environment Variables

<!-- AUTO-GENERATED -->
### `packages/web`

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | No | Base URL of the API | `http://localhost:8787` |
<!-- END AUTO-GENERATED -->

## Scripts

<!-- AUTO-GENERATED -->
### Root workspace

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start API dev server via Wrangler (port 8787) |
| `npm run dev:web` | Start Next.js web UI dev server |
| `npm test` | Run all API tests |
| `npm run test:unit` | Run API unit tests |
| `npm run test:integration` | Run API integration tests |

### `packages/api`

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Cloudflare Worker dev server |
| `npm run deploy` | Deploy worker to Cloudflare |
| `npm run cf-typegen` | Regenerate Cloudflare env types |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |

### `packages/web`

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run pages:build` | Build for Cloudflare Pages |
| `npm run pages:deploy` | Build and deploy to Cloudflare Pages |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |
<!-- END AUTO-GENERATED -->

## Quick Start

```bash
# Install dependencies
npm install

# Start API (terminal 1) — listens on http://localhost:8787
npm run dev:api

# Start web UI (terminal 2)
npm run dev:web
```

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for full setup instructions.

## Deployment

### Deploy the API

```bash
npm run deploy -w @repo/api
```

Uses `packages/api/wrangler.toml`. Worker name: `linkedin-currency-converter`.

### Deploy the Web UI

```bash
npm run pages:deploy -w @repo/web
# Runs: npx @cloudflare/next-on-pages && wrangler pages deploy .vercel/output/static
```

**Deploy the API first**, then set `NEXT_PUBLIC_API_URL` in the Cloudflare Pages dashboard to your worker URL.

## Health Checks

```bash
# List currencies
curl https://<worker-url>/currencies

# Convert 100 USD → EUR
curl "https://<worker-url>/convert?amount=100&from=USD&to=EUR"
```

Expected: `200` JSON for both. A `400` with `"Only USD conversions supported"` means the constraint is working correctly.

## Updating Exchange Rates

The CSV is bundled at deploy time. To refresh:

1. Download the latest file from [US Treasury](https://fiscaldata.treasury.gov/datasets/treasury-reporting-rates-exchange/)
2. Replace `packages/api/data/*.csv`
3. Redeploy the API

## Rollback

Via the Cloudflare dashboard: Workers & Pages → `linkedin-currency-converter` → Deployments → select a previous version → Rollback.
