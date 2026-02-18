import { describe, it, expect } from 'vitest';
import { convert } from '../../src/converter';
import type { ExchangeRate } from '../../src/types';

function makeRates(...entries: [string, number, string][]): Map<string, ExchangeRate> {
	const map = new Map<string, ExchangeRate>();
	for (const [code, rate, desc] of entries) {
		map.set(code, { currencyCode: code, rate, effectiveDate: '2024-01-15', description: desc });
	}
	return map;
}

const rates = makeRates(['EUR', 0.89, 'Euro Zone-Euro'], ['JPY', 148.5, 'Japan-Yen']);

describe('convert', () => {
	describe('USD to foreign', () => {
		it('converts correctly and rounds amount to 2dp', () => {
			const result = convert(100, 'USD', 'EUR', rates);
			expect(result.convertedAmount).toBe(89);
			expect(result.rate).toBe(0.89);
			expect(result.from).toBe('USD');
			expect(result.to).toBe('EUR');
			expect(result.amount).toBe(100);
			expect(result.availableCurrencies).toBe(2);
		});

		it('rounds rate to 6dp', () => {
			const r = makeRates(['XYZ', 1.23456789, 'Test Currency']);
			const result = convert(1, 'USD', 'XYZ', r);
			expect(result.rate).toBe(1.234568);
		});

		it('includes description', () => {
			const result = convert(100, 'USD', 'EUR', rates);
			expect(result.description).toBe('Euro Zone-Euro');
		});
	});

	describe('foreign to USD', () => {
		it('converts correctly using inverse rate', () => {
			const result = convert(89, 'EUR', 'USD', rates);
			expect(result.convertedAmount).toBe(100);
			expect(result.availableCurrencies).toBe(2);
		});

		it('rounds inverse rate to 6dp', () => {
			const result = convert(100, 'EUR', 'USD', rates);
			expect(result.rate).toBe(Math.round((1 / 0.89) * 1000000) / 1000000);
		});

		it('includes description', () => {
			const result = convert(100, 'JPY', 'USD', rates);
			expect(result.description).toBe('Japan-Yen');
		});
	});

	describe('errors', () => {
		it('throws for unknown currency code (USD to foreign)', () => {
			expect(() => convert(100, 'USD', 'ZZZ', rates)).toThrow('Unknown currency code: ZZZ');
		});

		it('throws for unknown currency code (foreign to USD)', () => {
			expect(() => convert(100, 'ZZZ', 'USD', rates)).toThrow('Unknown currency code: ZZZ');
		});
	});

	describe('edge cases', () => {
		it('handles zero amount', () => {
			const result = convert(0, 'USD', 'EUR', rates);
			expect(result.convertedAmount).toBe(0);
		});

		it('handles small amounts', () => {
			const result = convert(0.01, 'USD', 'JPY', rates);
			expect(result.convertedAmount).toBe(1.49);
		});

		it('handles large amounts', () => {
			const result = convert(1000000, 'USD', 'JPY', rates);
			expect(result.convertedAmount).toBe(148500000);
		});
	});
});
