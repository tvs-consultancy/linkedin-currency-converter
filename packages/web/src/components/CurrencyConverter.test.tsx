import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CurrencyConverter from './CurrencyConverter';
import { fetchCurrencies, convertCurrency } from '@/lib/api';
import type { ConversionResult } from '@repo/api/src/types';

vi.mock('@/lib/api', () => ({
  fetchCurrencies: vi.fn(),
  convertCurrency: vi.fn(),
}));

const mockFetchCurrencies = vi.mocked(fetchCurrencies);
const mockConvertCurrency = vi.mocked(convertCurrency);

const CURRENCIES = ['EUR', 'GBP', 'JPY', 'USD'];

const MOCK_RESULT: ConversionResult = {
  from: 'USD',
  to: 'EUR',
  amount: 100,
  convertedAmount: 92.5,
  rate: 0.925,
  description: 'Euro',
  availableCurrencies: 4,
};

/** Wait until both From/To selects are populated (currencies loaded). */
async function waitForCurrencies() {
  await waitFor(() => {
    expect(screen.getByLabelText('De')).toHaveValue('USD');
  });
}

describe('CurrencyConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCurrencies.mockResolvedValue({ currencies: CURRENCIES });
  });

  it('renders amount input, from/to dropdowns and Convertir button', async () => {
    render(<CurrencyConverter />);
    await waitForCurrencies();

    expect(screen.getByLabelText('Cantidad')).toBeInTheDocument();
    expect(screen.getByLabelText('De')).toBeInTheDocument();
    expect(screen.getByLabelText('A')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convertir' })).toBeInTheDocument();
  });

  it('fetches currencies on mount and populates dropdowns', async () => {
    render(<CurrencyConverter />);
    await waitForCurrencies();

    expect(mockFetchCurrencies).toHaveBeenCalledOnce();
    // Both dropdowns should list all currencies
    expect(screen.getAllByRole('option', { name: 'EUR' })).toHaveLength(2);
    expect(screen.getAllByRole('option', { name: 'USD' })).toHaveLength(2);
  });

  it('Convertir button is disabled when amount is empty', async () => {
    render(<CurrencyConverter />);
    await waitForCurrencies();

    expect(screen.getByRole('button', { name: 'Convertir' })).toBeDisabled();
  });

  it('Convertir button is disabled when amount is zero', async () => {
    const user = userEvent.setup();
    render(<CurrencyConverter />);
    await waitForCurrencies();

    await user.type(screen.getByLabelText('Cantidad'), '0');

    expect(screen.getByRole('button', { name: 'Convertir' })).toBeDisabled();
  });

  it('Convertir button is disabled when from equals to, and shows validation message', async () => {
    const user = userEvent.setup();
    render(<CurrencyConverter />);
    await waitForCurrencies();

    await user.type(screen.getByLabelText('Cantidad'), '100');
    await user.selectOptions(screen.getByLabelText('A'), 'USD');

    expect(screen.getByRole('button', { name: 'Convertir' })).toBeDisabled();
    expect(
      screen.getByText('Las divisas de origen y destino deben ser diferentes.'),
    ).toBeInTheDocument();
  });

  it('shows loading state during conversion', async () => {
    const user = userEvent.setup();
    let resolveFn!: (value: ConversionResult) => void;
    mockConvertCurrency.mockImplementation(
      () => new Promise((r) => { resolveFn = r; }),
    );

    render(<CurrencyConverter />);
    await waitForCurrencies();

    await user.type(screen.getByLabelText('Cantidad'), '100');
    await user.click(screen.getByRole('button', { name: 'Convertir' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Convirtiendo…' })).toBeDisabled();
    });
    expect(screen.getByLabelText('Cantidad')).toBeDisabled();
    expect(screen.getByLabelText('De')).toBeDisabled();
    expect(screen.getByLabelText('A')).toBeDisabled();

    // Resolve to clean up pending promise
    resolveFn(MOCK_RESULT);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Convertir' })).not.toBeDisabled();
    });
  });

  it('displays converted amount, rate and description on success', async () => {
    const user = userEvent.setup();
    mockConvertCurrency.mockResolvedValue(MOCK_RESULT);

    render(<CurrencyConverter />);
    await waitForCurrencies();

    await user.type(screen.getByLabelText('Cantidad'), '100');
    await user.click(screen.getByRole('button', { name: 'Convertir' }));

    await waitFor(() => {
      expect(screen.getByText(/92\.50/)).toBeInTheDocument();
    });
    expect(screen.getByText('1 USD = 0.925 EUR')).toBeInTheDocument();
    expect(screen.getByText('Euro')).toBeInTheDocument();
  });

  it('displays error message on API failure', async () => {
    const user = userEvent.setup();
    mockConvertCurrency.mockRejectedValue(new Error('Only USD conversions supported'));

    render(<CurrencyConverter />);
    await waitForCurrencies();

    await user.type(screen.getByLabelText('Cantidad'), '100');
    await user.click(screen.getByRole('button', { name: 'Convertir' }));

    await waitFor(() => {
      expect(screen.getByText('Only USD conversions supported')).toBeInTheDocument();
    });
  });

  it('clears previous result when a new conversion starts', async () => {
    const user = userEvent.setup();
    mockConvertCurrency.mockResolvedValue(MOCK_RESULT);

    render(<CurrencyConverter />);
    await waitForCurrencies();

    // First conversion
    await user.type(screen.getByLabelText('Cantidad'), '100');
    await user.click(screen.getByRole('button', { name: 'Convertir' }));
    await waitFor(() => expect(screen.getByText(/92\.50/)).toBeInTheDocument());

    // Second conversion — previous result should be replaced
    const newResult = { ...MOCK_RESULT, convertedAmount: 185, to: 'GBP' };
    mockConvertCurrency.mockResolvedValue(newResult);

    await user.clear(screen.getByLabelText('Cantidad'));
    await user.type(screen.getByLabelText('Cantidad'), '200');
    await user.selectOptions(screen.getByLabelText('A'), 'GBP');
    await user.click(screen.getByRole('button', { name: 'Convertir' }));

    await waitFor(() => expect(screen.getByText(/185\.00/)).toBeInTheDocument());
    expect(screen.queryByText(/92\.50/)).not.toBeInTheDocument();
  });

  it('shows currencies fetch error with a Reintentar button', async () => {
    mockFetchCurrencies.mockRejectedValue(new Error('No se pudo conectar'));

    render(<CurrencyConverter />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar las divisas.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('Reintentar button re-fetches currencies and clears the error', async () => {
    const user = userEvent.setup();
    mockFetchCurrencies
      .mockRejectedValueOnce(new Error('No se pudo conectar'))
      .mockResolvedValue({ currencies: CURRENCIES });

    render(<CurrencyConverter />);
    await waitFor(() =>
      expect(screen.getByText('Error al cargar las divisas.')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => {
      expect(screen.queryByText('Error al cargar las divisas.')).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole('option', { name: 'EUR' })).toHaveLength(2);
  });
});
