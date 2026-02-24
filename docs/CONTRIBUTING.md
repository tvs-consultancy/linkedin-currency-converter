# Contributing Guide

## Prerequisites

- **Node.js** 20+ with npm
- **Cloudflare account** (for deployment; not needed for local dev)

## Development Setup

```bash
# Clone the repo
git clone <repo-url>
cd linkedin-currency-converter

# Install all dependencies (both packages)
npm install

# Copy web env config
cp packages/web/.env.local.example packages/web/.env.local
# Edit .env.local if you want to point at a deployed API
```

## Running Locally

Open two terminals:

```bash
# Terminal 1 — API on http://localhost:8787
npm run dev:api

# Terminal 2 — Web UI on http://localhost:3000
npm run dev:web
```

The web UI reads `NEXT_PUBLIC_API_URL` from `.env.local` and defaults to `http://localhost:8787`.

## Available Scripts

<!-- AUTO-GENERATED -->
### Root

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start API dev server (Wrangler) |
| `npm run dev:web` | Start Next.js web UI |
| `npm test` | Run API tests |
| `npm run test:unit` | Run API unit tests |
| `npm run test:integration` | Run API integration tests |

### `packages/api`

| Command | Description |
|---------|-------------|
| `npm run dev` | Wrangler local dev server |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run cf-typegen` | Regenerate Cloudflare types |
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |

### `packages/web`

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production Next.js build |
| `npm run start` | Serve production build locally |
| `npm run pages:build` | Build for Cloudflare Pages |
| `npm run pages:deploy` | Build and deploy to Cloudflare Pages |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright E2E tests |
<!-- END AUTO-GENERATED -->

## Testing

### Unit & Integration Tests

```bash
# All API tests
npm test

# Specific suites
npm run test:unit
npm run test:integration

# Web component tests
npm test -w @repo/web
```

### E2E Tests

Requires the API to be running locally:

```bash
# In one terminal
npm run dev:api

# In another terminal
npm run test:e2e -w @repo/web
```

Playwright artifacts (screenshots, videos, traces) are saved to `packages/web/test-results/`.

### Coverage

Aim for **80%+ coverage** on new code. Run with:

```bash
vitest run --coverage
```

## Code Style

- TypeScript throughout; no `any` without justification
- Immutable patterns — never mutate objects in place
- Functions under 50 lines; files under 800 lines
- Errors handled explicitly at every level; never silently swallowed

## Commit Format

```
<type>: <description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

## Pull Request Checklist

- [ ] Tests written first (TDD)
- [ ] All tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] No hardcoded secrets or API keys
- [ ] Commit message follows conventional commits format
