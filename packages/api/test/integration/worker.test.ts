import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

const BASE = 'https://example.com';

describe('Worker fetch handler', () => {
	describe('404 responses', () => {
		it('returns 404 for wrong path', async () => {
			const res = await SELF.fetch(`${BASE}/wrong`);
			expect(res.status).toBe(404);
			const body = await res.json<{ error: string }>();
			expect(body.error).toBe('Not found');
		});

		it('returns 404 for wrong HTTP method', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=100&from=USD&to=EUR`, {
				method: 'POST',
			});
			expect(res.status).toBe(404);
		});
	});

	describe('400 responses', () => {
		it('returns 400 for missing params', async () => {
			const res = await SELF.fetch(`${BASE}/convert`);
			expect(res.status).toBe(400);
			const body = await res.json<{ error: string }>();
			expect(body.error).toContain('Missing required parameters');
		});

		it('returns 400 for NaN amount', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=abc&from=USD&to=EUR`);
			expect(res.status).toBe(400);
		});

		it('returns 400 for negative amount', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=-10&from=USD&to=EUR`);
			expect(res.status).toBe(400);
		});

		it('returns 400 for zero amount', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=0&from=USD&to=EUR`);
			expect(res.status).toBe(400);
		});

		it('returns 400 for Infinity amount', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=Infinity&from=USD&to=EUR`);
			expect(res.status).toBe(400);
			const body = await res.json<{ error: string }>();
			expect(body.error).toContain('finite');
		});

		it('returns 400 for 1e309 (overflow to Infinity) amount', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=1e309&from=USD&to=EUR`);
			expect(res.status).toBe(400);
			const body = await res.json<{ error: string }>();
			expect(body.error).toContain('finite');
		});

		it('returns 400 for same from/to', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=100&from=USD&to=USD`);
			expect(res.status).toBe(400);
			const body = await res.json<{ error: string }>();
			expect(body.error).toContain('must differ');
		});

		it('returns 400 for unknown currency', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=100&from=USD&to=ZZZ`);
			expect(res.status).toBe(400);
			const body = await res.json<{ error: string }>();
			expect(body.error).toContain('Unknown currency code');
		});
	});

	describe('200 responses', () => {
		it('converts USD to foreign', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=100&from=USD&to=EUR`);
			expect(res.status).toBe(200);
			const body = await res.json<{ from: string; to: string; convertedAmount: number; availableCurrencies: number }>();
			expect(body.from).toBe('USD');
			expect(body.to).toBe('EUR');
			expect(typeof body.convertedAmount).toBe('number');
			expect(body.availableCurrencies).toBeGreaterThan(0);
		});

		it('converts foreign to USD', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=100&from=EUR&to=USD`);
			expect(res.status).toBe(200);
			const body = await res.json<{ from: string; to: string; convertedAmount: number }>();
			expect(body.from).toBe('EUR');
			expect(body.to).toBe('USD');
			expect(typeof body.convertedAmount).toBe('number');
		});

		it('converts any-to-any currencies (EUR to JPY)', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=100&from=EUR&to=JPY`);
			expect(res.status).toBe(200);
			const body = await res.json<{ from: string; to: string; convertedAmount: number }>();
			expect(body.from).toBe('EUR');
			expect(body.to).toBe('JPY');
			expect(typeof body.convertedAmount).toBe('number');
			expect(body.convertedAmount).toBeGreaterThan(0);
		});

		it('handles case-insensitive currency codes', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=100&from=usd&to=eur`);
			expect(res.status).toBe(200);
			const body = await res.json<{ from: string; to: string }>();
			expect(body.from).toBe('USD');
			expect(body.to).toBe('EUR');
		});

		it('handles decimal amounts', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=99.99&from=USD&to=EUR`);
			expect(res.status).toBe(200);
			const body = await res.json<{ amount: number }>();
			expect(body.amount).toBe(99.99);
		});

		it('returns correct Content-Type header', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=100&from=USD&to=EUR`);
			expect(res.headers.get('Content-Type')).toBe('application/json');
		});

		it('returns CORS headers on /convert', async () => {
			const res = await SELF.fetch(`${BASE}/convert?amount=100&from=USD&to=EUR`);
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});
	});

	describe('/currencies endpoint', () => {
		it('returns 200 with currencies array', async () => {
			const res = await SELF.fetch(`${BASE}/currencies`);
			expect(res.status).toBe(200);
			const body = await res.json<{ currencies: string[] }>();
			expect(Array.isArray(body.currencies)).toBe(true);
			expect(body.currencies.length).toBeGreaterThan(0);
		});

		it('returns currency codes as strings', async () => {
			const res = await SELF.fetch(`${BASE}/currencies`);
			const body = await res.json<{ currencies: string[] }>();
			body.currencies.forEach(code => expect(typeof code).toBe('string'));
		});

		it('includes known currencies', async () => {
			const res = await SELF.fetch(`${BASE}/currencies`);
			const body = await res.json<{ currencies: string[] }>();
			expect(body.currencies).toContain('EUR');
			expect(body.currencies).toContain('GBP');
		});

		it('returns currencies sorted alphabetically', async () => {
			const res = await SELF.fetch(`${BASE}/currencies`);
			const body = await res.json<{ currencies: string[] }>();
			const sorted = [...body.currencies].sort();
			expect(body.currencies).toEqual(sorted);
		});

		it('returns Content-Type application/json', async () => {
			const res = await SELF.fetch(`${BASE}/currencies`);
			expect(res.headers.get('Content-Type')).toBe('application/json');
		});

		it('returns CORS headers', async () => {
			const res = await SELF.fetch(`${BASE}/currencies`);
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});
	});
});
