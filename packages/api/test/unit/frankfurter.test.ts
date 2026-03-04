import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchCurrencies, fetchRate, clearCache } from '../../src/frankfurter';

const TODAY = new Date().toISOString().slice(0, 10);

function makeFetchMock(body: object, status = 200) {
	return vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(body),
	});
}

beforeEach(() => {
	clearCache();
	vi.restoreAllMocks();
});

describe('fetchCurrencies', () => {
	it('fetches from the correct URL', async () => {
		const mockFetch = makeFetchMock({ EUR: 'Euro', GBP: 'British Pound' });
		vi.stubGlobal('fetch', mockFetch);

		await fetchCurrencies();

		expect(mockFetch).toHaveBeenCalledWith('https://api.frankfurter.dev/v1/currencies');
	});

	it('returns the currencies record', async () => {
		vi.stubGlobal('fetch', makeFetchMock({ EUR: 'Euro', GBP: 'British Pound' }));

		const result = await fetchCurrencies();

		expect(result).toEqual({ EUR: 'Euro', GBP: 'British Pound' });
	});

	it('caches result and does not re-fetch on same day', async () => {
		const mockFetch = makeFetchMock({ EUR: 'Euro' });
		vi.stubGlobal('fetch', mockFetch);

		await fetchCurrencies();
		await fetchCurrencies();

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('re-fetches after clearCache', async () => {
		const mockFetch = makeFetchMock({ EUR: 'Euro' });
		vi.stubGlobal('fetch', mockFetch);

		await fetchCurrencies();
		clearCache();
		await fetchCurrencies();

		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('throws on non-200 response', async () => {
		vi.stubGlobal('fetch', makeFetchMock({}, 503));

		await expect(fetchCurrencies()).rejects.toThrow('Frankfurter /currencies failed: 503');
	});

	it('throws when response is an array', async () => {
		vi.stubGlobal('fetch', makeFetchMock([] as unknown as object));

		await expect(fetchCurrencies()).rejects.toThrow(
			'Frankfurter /currencies returned unexpected response shape',
		);
	});

	it('throws when response is a string', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve('not-an-object'),
			}),
		);

		await expect(fetchCurrencies()).rejects.toThrow(
			'Frankfurter /currencies returned unexpected response shape',
		);
	});

	it('throws when response is null', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve(null),
			}),
		);

		await expect(fetchCurrencies()).rejects.toThrow(
			'Frankfurter /currencies returned unexpected response shape',
		);
	});
});

describe('fetchRate', () => {
	it('fetches from the correct URL with base and symbols', async () => {
		const mockFetch = makeFetchMock({ base: 'USD', date: TODAY, rates: { EUR: 0.89 } });
		vi.stubGlobal('fetch', mockFetch);

		await fetchRate('USD', 'EUR');

		expect(mockFetch).toHaveBeenCalledWith(
			'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR',
		);
	});

	it('returns rate and date', async () => {
		vi.stubGlobal('fetch', makeFetchMock({ base: 'USD', date: TODAY, rates: { EUR: 0.89 } }));

		const result = await fetchRate('USD', 'EUR');

		expect(result.rate).toBe(0.89);
		expect(result.date).toBe(TODAY);
	});

	it('caches by base currency and does not re-fetch same symbol', async () => {
		const mockFetch = makeFetchMock({ base: 'USD', date: TODAY, rates: { EUR: 0.89 } });
		vi.stubGlobal('fetch', mockFetch);

		await fetchRate('USD', 'EUR');
		await fetchRate('USD', 'EUR');

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('re-fetches for a different base currency', async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ base: 'USD', date: TODAY, rates: { EUR: 0.89 } }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ base: 'GBP', date: TODAY, rates: { EUR: 1.18 } }),
			});
		vi.stubGlobal('fetch', mockFetch);

		await fetchRate('USD', 'EUR');
		await fetchRate('GBP', 'EUR');

		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('re-fetches after clearCache', async () => {
		const mockFetch = makeFetchMock({ base: 'USD', date: TODAY, rates: { EUR: 0.89 } });
		vi.stubGlobal('fetch', mockFetch);

		await fetchRate('USD', 'EUR');
		clearCache();
		await fetchRate('USD', 'EUR');

		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('throws on non-200 response', async () => {
		vi.stubGlobal('fetch', makeFetchMock({}, 503));

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow('Frankfurter /latest failed: 503');
	});

	it('throws when response is missing the rates field', async () => {
		vi.stubGlobal('fetch', makeFetchMock({ base: 'USD', date: TODAY }));

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow(
			'Frankfurter /latest returned unexpected response shape',
		);
	});

	it('throws when response is missing the date field', async () => {
		vi.stubGlobal('fetch', makeFetchMock({ base: 'USD', rates: { EUR: 0.89 } }));

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow(
			'Frankfurter /latest returned unexpected response shape',
		);
	});

	it('throws when response date is not a string', async () => {
		vi.stubGlobal('fetch', makeFetchMock({ base: 'USD', date: 20241201, rates: { EUR: 0.89 } }));

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow(
			'Frankfurter /latest returned unexpected response shape',
		);
	});

	it('throws when response is an array', async () => {
		vi.stubGlobal('fetch', makeFetchMock([] as unknown as object));

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow(
			'Frankfurter /latest returned unexpected response shape',
		);
	});

	it('throws when response is null', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve(null),
			}),
		);

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow(
			'Frankfurter /latest returned unexpected response shape',
		);
	});

	it('throws when the rate for the requested symbol is not a number', async () => {
		vi.stubGlobal(
			'fetch',
			makeFetchMock({ base: 'USD', date: TODAY, rates: { EUR: 'not-a-number' } }),
		);

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow(
			'Frankfurter returned invalid rate for EUR',
		);
	});

	it('throws when the rate is zero', async () => {
		vi.stubGlobal('fetch', makeFetchMock({ base: 'USD', date: TODAY, rates: { EUR: 0 } }));

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow(
			'Frankfurter returned invalid rate for EUR',
		);
	});

	it('throws when the rate is negative', async () => {
		vi.stubGlobal('fetch', makeFetchMock({ base: 'USD', date: TODAY, rates: { EUR: -1.5 } }));

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow(
			'Frankfurter returned invalid rate for EUR',
		);
	});

	it('throws when the rate is Infinity', async () => {
		vi.stubGlobal('fetch', makeFetchMock({ base: 'USD', date: TODAY, rates: { EUR: Infinity } }));

		await expect(fetchRate('USD', 'EUR')).rejects.toThrow(
			'Frankfurter returned invalid rate for EUR',
		);
	});

	it('merges new symbol into existing cache entry immutably when date matches', async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ base: 'USD', date: TODAY, rates: { EUR: 0.89 } }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ base: 'USD', date: TODAY, rates: { GBP: 0.79 } }),
			});
		vi.stubGlobal('fetch', mockFetch);

		const first = await fetchRate('USD', 'EUR');
		const second = await fetchRate('USD', 'GBP');

		expect(first.rate).toBe(0.89);
		expect(second.rate).toBe(0.79);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});
});
