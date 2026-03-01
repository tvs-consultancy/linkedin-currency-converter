import { describe, it, expect } from 'vitest';
import { convert } from '../../src/converter';

describe('convert', () => {
	it('converts amount using provided rate', () => {
		const result = convert(100, 'USD', 'EUR', 0.89, 'Euro', 30);
		expect(result.convertedAmount).toBe(89);
		expect(result.rate).toBe(0.89);
		expect(result.from).toBe('USD');
		expect(result.to).toBe('EUR');
		expect(result.amount).toBe(100);
		expect(result.availableCurrencies).toBe(30);
		expect(result.description).toBe('Euro');
	});

	it('works for any-to-any conversion (non-USD)', () => {
		const result = convert(50, 'EUR', 'GBP', 1.12, 'British Pound', 30);
		expect(result.convertedAmount).toBe(56);
		expect(result.rate).toBe(1.12);
		expect(result.from).toBe('EUR');
		expect(result.to).toBe('GBP');
		expect(result.description).toBe('British Pound');
	});

	it('rounds converted amount to 2 decimal places', () => {
		const result = convert(1, 'USD', 'JPY', 148.5, 'Japanese Yen', 30);
		expect(result.convertedAmount).toBe(148.5);
	});

	it('handles decimal input amount', () => {
		const result = convert(0.01, 'USD', 'JPY', 148.5, 'Japanese Yen', 30);
		expect(result.convertedAmount).toBe(1.49);
	});

	it('handles zero amount', () => {
		const result = convert(0, 'USD', 'EUR', 0.89, 'Euro', 30);
		expect(result.convertedAmount).toBe(0);
	});

	it('handles large amounts', () => {
		const result = convert(1000000, 'USD', 'JPY', 148.5, 'Japanese Yen', 30);
		expect(result.convertedAmount).toBe(148500000);
	});
});
