import { describe, it, expect } from 'vitest';
import { parseRates } from '../../src/csv-parser';

describe('parseRates', () => {
	it('parses valid CSV with multiple currencies', () => {
		const csv = `Header,Description,Rate,EffectiveDate,CurrencyCode
1,Euro Zone-Euro,0.89,2024-01-15,EUR
2,Japan-Yen,148.50,2024-01-15,JPY`;

		const rates = parseRates(csv);
		expect(rates.size).toBe(2);
		expect(rates.get('EUR')).toEqual({
			currencyCode: 'EUR',
			rate: 0.89,
			effectiveDate: '2024-01-15',
			description: 'Euro Zone-Euro',
		});
		expect(rates.get('JPY')).toEqual({
			currencyCode: 'JPY',
			rate: 148.5,
			effectiveDate: '2024-01-15',
			description: 'Japan-Yen',
		});
	});

	it('keeps most recent effective date per currency', () => {
		const csv = `Header,Description,Rate,EffectiveDate,CurrencyCode
1,Euro Zone-Euro,0.85,2023-06-01,EUR
2,Euro Zone-Euro,0.89,2024-01-15,EUR
3,Euro Zone-Euro,0.87,2023-12-01,EUR`;

		const rates = parseRates(csv);
		expect(rates.size).toBe(1);
		expect(rates.get('EUR')!.rate).toBe(0.89);
		expect(rates.get('EUR')!.effectiveDate).toBe('2024-01-15');
	});

	it('skips header row', () => {
		const csv = `SomeID,Description,Rate,EffectiveDate,CurrencyCode
1,Euro Zone-Euro,0.89,2024-01-15,EUR`;

		const rates = parseRates(csv);
		expect(rates.size).toBe(1);
		expect(rates.has('CurrencyCode')).toBe(false);
	});

	it('skips blank lines', () => {
		const csv = `Header,Description,Rate,EffectiveDate,CurrencyCode

1,Euro Zone-Euro,0.89,2024-01-15,EUR

2,Japan-Yen,148.50,2024-01-15,JPY
`;

		const rates = parseRates(csv);
		expect(rates.size).toBe(2);
	});

	it('skips invalid (NaN) rates', () => {
		const csv = `Header,Description,Rate,EffectiveDate,CurrencyCode
1,Euro Zone-Euro,notanumber,2024-01-15,EUR
2,Japan-Yen,148.50,2024-01-15,JPY`;

		const rates = parseRates(csv);
		expect(rates.size).toBe(1);
		expect(rates.has('EUR')).toBe(false);
		expect(rates.has('JPY')).toBe(true);
	});

	it('skips lines with missing fields', () => {
		const csv = `Header,Description,Rate,EffectiveDate,CurrencyCode
1,Euro Zone-Euro,0.89
2,Japan-Yen,148.50,2024-01-15,JPY`;

		const rates = parseRates(csv);
		expect(rates.size).toBe(1);
		expect(rates.has('JPY')).toBe(true);
	});

	it('returns empty Map for empty/header-only CSV', () => {
		expect(parseRates('')).toEqual(new Map());
		expect(parseRates('Header,Description,Rate,EffectiveDate,CurrencyCode')).toEqual(new Map());
	});
});
