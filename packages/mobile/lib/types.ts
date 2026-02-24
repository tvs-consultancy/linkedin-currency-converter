export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  description: string;
  availableCurrencies: number;
}

export interface CurrenciesResponse {
  currencies: string[];
}
