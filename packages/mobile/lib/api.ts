import type { ConversionResult, CurrenciesResponse } from '@repo/api/src/types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 404) {
    throw new Error('Servicio no encontrado. Por favor, actualiza la aplicación.');
  }
  if (response.status >= 500) {
    throw new Error('Algo salió mal. Por favor, inténtalo de nuevo más tarde.');
  }
  if (!response.ok) {
    try {
      const data = (await response.json()) as { error: string };
      throw new Error(data.error);
    } catch {
      throw new Error('Algo salió mal. Por favor, inténtalo de nuevo más tarde.');
    }
  }
  return response.json() as Promise<T>;
}

export async function fetchCurrencies(): Promise<CurrenciesResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/currencies`);
  } catch {
    throw new Error('No se pudo conectar. Por favor, inténtalo de nuevo.');
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
    throw new Error('No se pudo conectar. Por favor, inténtalo de nuevo.');
  }
  return handleResponse<ConversionResult>(response);
}
