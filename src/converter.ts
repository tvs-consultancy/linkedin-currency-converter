import type { ExchangeRate, ConversionResult } from './types';

export function convert(
	amount: number,
	from: string,
	to: string,
	rates: Map<string, ExchangeRate>,
): ConversionResult {
	if (from === 'USD') {
		const target = rates.get(to);
		if (!target) throw new Error(`Unknown currency code: ${to}`);
		const convertedAmount = Math.round(amount * target.rate * 100) / 100;
		return {
			from,
			to,
			amount,
			convertedAmount,
			rate: Math.round(target.rate * 1000000) / 1000000,
			description: target.description,
		};
	}

	// to === 'USD'
	const source = rates.get(from);
	if (!source) throw new Error(`Unknown currency code: ${from}`);
	const rate = 1 / source.rate;
	const convertedAmount = Math.round(amount * rate * 100) / 100;
	return {
		from,
		to,
		amount,
		convertedAmount,
		rate: Math.round(rate * 1000000) / 1000000,
		description: source.description,
	};
}
