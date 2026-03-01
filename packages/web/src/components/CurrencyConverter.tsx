'use client';

import { useCallback, useEffect, useState } from 'react';
import { convertCurrency, fetchCurrencies } from '@/lib/api';
import type { ConversionResult } from '@repo/api/src/types';

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currenciesError, setCurrenciesError] = useState(false);

  const loadCurrencies = useCallback(async () => {
    setCurrenciesError(false);
    try {
      const data = await fetchCurrencies();
      setCurrencies(data.currencies);
      setFrom((prev) => prev || 'USD');
      setTo((prev) => prev || 'EUR');
    } catch {
      setCurrenciesError(true);
    }
  }, []);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  const amountNum = parseFloat(amount);
  const isValid =
    amount !== '' &&
    !isNaN(amountNum) &&
    amountNum > 0 &&
    from !== '' &&
    to !== '' &&
    from !== to;

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setResult(null);
    setError(null);
  };

  const handleConvert = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await convertCurrency(amountNum, from, to);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Currency Converter</h1>
      <p className="text-sm text-gray-500 mb-6">
        Convert between USD and 150+ world currencies
      </p>

      {currenciesError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700">Error loading currencies.</span>
          <button
            onClick={loadCurrencies}
            className="text-sm font-medium text-red-700 underline ml-3 hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            placeholder="0.00"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 items-end">
          <div>
            <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <select
              id="from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={loading || currencies.length === 0}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select...</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            disabled={loading || currencies.length === 0}
            aria-label="Swap currencies"
            className="mb-0.5 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 16l-4-4 4-4" />
              <path d="M17 8l4 4-4 4" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          </button>

          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <select
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={loading || currencies.length === 0}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select...</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {from !== '' && to !== '' && from === to && (
          <p className="text-sm text-red-600">Source and target currencies must differ.</p>
        )}

        <button
          onClick={handleConvert}
          disabled={!isValid || loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? 'Converting…' : 'Convert'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && !error && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-3xl font-bold text-blue-900">
            {result.convertedAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            {result.to}
          </p>
          <p className="mt-1 text-sm text-blue-700">
            1 {result.from} = {result.rate} {result.to}
          </p>
          <p className="mt-1 text-xs text-blue-500">{result.description}</p>
        </div>
      )}
    </div>
  );
}
