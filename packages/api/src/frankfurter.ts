const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1';

interface RateCache {
	date: string;
	rates: Record<string, number>;
}

const rateCache = new Map<string, RateCache>();
let currenciesCache: { date: string; currencies: Record<string, string> } | null = null;

function todayUTC(): string {
	return new Date().toISOString().slice(0, 10);
}

export async function fetchCurrencies(): Promise<Record<string, string>> {
	const today = todayUTC();
	if (currenciesCache && currenciesCache.date === today) return currenciesCache.currencies;

	const response = await fetch(`${FRANKFURTER_BASE}/currencies`);
	if (!response.ok) throw new Error(`Frankfurter /currencies failed: ${response.status}`);

	const raw: unknown = await response.json();
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
		throw new Error('Frankfurter /currencies returned unexpected response shape');
	}
	const data = raw as Record<string, string>;
	currenciesCache = { date: today, currencies: data };
	return data;
}

export async function fetchRate(from: string, to: string): Promise<{ rate: number; date: string }> {
	const today = todayUTC();
	const cached = rateCache.get(from);
	if (cached && cached.date === today && cached.rates[to] !== undefined) {
		return { rate: cached.rates[to], date: cached.date };
	}

	const response = await fetch(`${FRANKFURTER_BASE}/latest?base=${from}&symbols=${to}`);
	if (!response.ok) throw new Error(`Frankfurter /latest failed: ${response.status}`);

	const raw: unknown = await response.json();
	if (
		typeof raw !== 'object' || raw === null ||
		!('rates' in raw) || typeof (raw as Record<string, unknown>).rates !== 'object' ||
		!('date' in raw) || typeof (raw as Record<string, unknown>).date !== 'string'
	) {
		throw new Error('Frankfurter /latest returned unexpected response shape');
	}
	const data = raw as { base: string; date: string; rates: Record<string, number> };
	const rate = data.rates[to];
	if (typeof rate !== 'number' || !isFinite(rate) || rate <= 0) {
		throw new Error(`Frankfurter returned invalid rate for ${to}`);
	}
	const existing = rateCache.get(from);
	if (existing && existing.date === data.date) {
		rateCache.set(from, { ...existing, rates: { ...existing.rates, [to]: data.rates[to] } });
	} else {
		rateCache.set(from, { date: data.date, rates: { ...data.rates } });
	}

	return { rate: data.rates[to], date: data.date };
}

export function clearCache(): void {
	rateCache.clear();
	currenciesCache = null;
}
