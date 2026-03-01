import type { ConversionResult } from './types';

export function convert(
	amount: number,
	from: string,
	to: string,
	rate: number,
	description: string,
	availableCurrencies: number,
): ConversionResult {
	const convertedAmount = Math.round(amount * rate * 100) / 100;
	return {
		from,
		to,
		amount,
		convertedAmount,
		rate,
		description,
		availableCurrencies,
	};
}
