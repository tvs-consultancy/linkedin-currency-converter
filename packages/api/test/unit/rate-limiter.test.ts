import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { checkRateLimit, resetRateLimiter } from '../../src/rate-limiter';

describe('checkRateLimit', () => {
	beforeEach(() => {
		resetRateLimiter();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('allows first request from an IP', () => {
		const result = checkRateLimit('1.2.3.4');
		expect(result.allowed).toBe(true);
		expect(result.retryAfterMs).toBe(0);
	});

	it('allows up to MAX_REQUESTS (60) requests within the window', () => {
		for (let i = 0; i < 60; i++) {
			const result = checkRateLimit('1.2.3.4');
			expect(result.allowed).toBe(true);
		}
	});

	it('blocks the 61st request within the same window', () => {
		for (let i = 0; i < 60; i++) {
			checkRateLimit('1.2.3.4');
		}
		const result = checkRateLimit('1.2.3.4');
		expect(result.allowed).toBe(false);
		expect(result.retryAfterMs).toBeGreaterThan(0);
	});

	it('tracks different IPs independently', () => {
		for (let i = 0; i < 60; i++) {
			checkRateLimit('1.2.3.4');
		}
		// First IP is at limit
		expect(checkRateLimit('1.2.3.4').allowed).toBe(false);
		// Different IP should still be allowed
		expect(checkRateLimit('5.6.7.8').allowed).toBe(true);
	});

	it('resets the counter after the window expires', () => {
		for (let i = 0; i < 60; i++) {
			checkRateLimit('1.2.3.4');
		}
		expect(checkRateLimit('1.2.3.4').allowed).toBe(false);

		// Advance time past the 1-minute window
		vi.advanceTimersByTime(60_001);

		const result = checkRateLimit('1.2.3.4');
		expect(result.allowed).toBe(true);
		expect(result.retryAfterMs).toBe(0);
	});

	it('returns a positive retryAfterMs when blocked', () => {
		for (let i = 0; i < 60; i++) {
			checkRateLimit('1.2.3.4');
		}
		const result = checkRateLimit('1.2.3.4');
		expect(result.allowed).toBe(false);
		expect(result.retryAfterMs).toBeGreaterThan(0);
		expect(result.retryAfterMs).toBeLessThanOrEqual(60_000);
	});

	it('increments count on each allowed request', () => {
		// First 59 requests should be allowed
		for (let i = 0; i < 59; i++) {
			expect(checkRateLimit('10.0.0.1').allowed).toBe(true);
		}
		// 60th request is still within limit
		expect(checkRateLimit('10.0.0.1').allowed).toBe(true);
		// 61st request exceeds limit
		expect(checkRateLimit('10.0.0.1').allowed).toBe(false);
	});
});

describe('resetRateLimiter', () => {
	it('clears all tracked IPs', () => {
		for (let i = 0; i < 60; i++) {
			checkRateLimit('1.2.3.4');
		}
		expect(checkRateLimit('1.2.3.4').allowed).toBe(false);

		resetRateLimiter();

		expect(checkRateLimit('1.2.3.4').allowed).toBe(true);
	});
});
