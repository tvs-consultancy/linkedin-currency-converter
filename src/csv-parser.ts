import csvData from '../data/RprtRateXchgCln_20210101_20251231_with_codes.csv';
import type { ExchangeRate } from './types';

function parseRates(csv: string): Map<string, ExchangeRate> {
	const rates = new Map<string, ExchangeRate>();
	const lines = csv.trim().split('\n');

	// Skip header row
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const [, description, rateStr, effectiveDate, currencyCode] = line.split(',');
		if (!currencyCode || !rateStr) continue;

		const code = currencyCode.trim();
		const rate = parseFloat(rateStr.trim());
		const date = effectiveDate.trim();
		const desc = description.trim();

		if (isNaN(rate)) continue;

		const existing = rates.get(code);
		if (!existing || date >= existing.effectiveDate) {
			rates.set(code, { currencyCode: code, rate, effectiveDate: date, description: desc });
		}
	}

	return rates;
}

export const exchangeRates = parseRates(csvData);
