export interface ExchangeRate {
	currencyCode: string;
	rate: number;
	effectiveDate: string;
	description: string;
}

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
