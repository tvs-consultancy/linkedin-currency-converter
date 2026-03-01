export interface ConversionResult {
	from: string;
	to: string;
	amount: number;
	convertedAmount: number;
	rate: number;
	description: string;
	availableCurrencies: number;
}

export interface ErrorResponse {
	error: string;
}

export interface CurrenciesResponse {
	currencies: string[];
}
