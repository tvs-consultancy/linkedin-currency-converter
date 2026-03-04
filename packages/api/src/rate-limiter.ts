interface RateLimitEntry {
	count: number;
	resetTime: number;
}

const ipRequests = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;  // 60 requests per minute per IP

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
	const now = Date.now();
	evictExpired(now);
	const entry = ipRequests.get(ip);

	if (!entry || now >= entry.resetTime) {
		ipRequests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
		return { allowed: true, retryAfterMs: 0 };
	}

	if (entry.count >= MAX_REQUESTS) {
		return { allowed: false, retryAfterMs: entry.resetTime - now };
	}

	ipRequests.set(ip, { count: entry.count + 1, resetTime: entry.resetTime });
	return { allowed: true, retryAfterMs: 0 };
}

function evictExpired(now: number): void {
	for (const [key, entry] of ipRequests) {
		if (now >= entry.resetTime) {
			ipRequests.delete(key);
		}
	}
}

export function resetRateLimiter(): void {
	ipRequests.clear();
}
