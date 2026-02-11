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
}

export interface ErrorResponse {
	error: string;
}
