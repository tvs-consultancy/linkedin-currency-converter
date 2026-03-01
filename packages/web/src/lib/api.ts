import type { ConversionResult, CurrenciesResponse } from '@repo/api/src/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 404) {
    throw new Error('Service not found. Please refresh the page.');
  }
  if (response.status >= 500) {
    throw new Error('Something went wrong. Please try again later.');
  }
  if (!response.ok) {
    const data = (await response.json()) as { error: string };
    throw new Error(data.error);
  }
  return response.json() as Promise<T>;
}

export async function fetchCurrencies(): Promise<CurrenciesResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/currencies`);
  } catch {
    throw new Error('Could not connect. Please try again.');
  }
  return handleResponse<CurrenciesResponse>(response);
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<ConversionResult> {
  const params = new URLSearchParams({ amount: String(amount), from, to });
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/convert?${params}`);
  } catch {
    throw new Error('Could not connect. Please try again.');
  }
  return handleResponse<ConversionResult>(response);
}
