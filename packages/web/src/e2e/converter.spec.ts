import { test, expect } from '@playwright/test';
import type { ConversionResult, CurrenciesResponse } from '@repo/api/src/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

const MOCK_CURRENCIES: CurrenciesResponse = {
  currencies: ['EUR', 'GBP', 'JPY', 'USD'],
};

const MOCK_RESULT: ConversionResult = {
  from: 'USD',
  to: 'EUR',
  amount: 100,
  convertedAmount: 92.5,
  rate: 0.925,
  description: 'Euro',
  availableCurrencies: 4,
};

test.beforeEach(async ({ page }) => {
  await page.route(`${API_BASE}/currencies`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CURRENCIES),
    }),
  );

  await page.route(/\/convert/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RESULT),
    }),
  );
});

test('full conversion flow — enters amount, clicks Convert, shows result', async ({ page }) => {
  await page.goto('/');

  // Wait for currencies to load (From defaults to USD)
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('USD');
  await expect(page.getByLabel('To', { exact: true })).toHaveValue('EUR');

  await page.getByLabel('Amount').fill('100');
  await page.getByRole('button', { name: 'Convert' }).click();

  await expect(page.getByText(/92\.50/)).toBeVisible();
  await expect(page.getByText('1 USD = 0.925 EUR')).toBeVisible();
  await expect(page.getByText('Euro')).toBeVisible();
});

test('Convert button is disabled when no amount is entered', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('USD');

  await expect(page.getByRole('button', { name: 'Convert' })).toBeDisabled();
});

test('Convert button is disabled when From equals To', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('USD');

  await page.getByLabel('Amount').fill('100');
  await page.getByLabel('To', { exact: true }).selectOption('USD');

  await expect(page.getByRole('button', { name: 'Convert' })).toBeDisabled();
  await expect(page.getByText('Source and target currencies must differ.')).toBeVisible();
});

test('swap button swaps currencies and clears conversion result', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('USD');
  await expect(page.getByLabel('To', { exact: true })).toHaveValue('EUR');

  // Perform a conversion first
  await page.getByLabel('Amount').fill('100');
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.getByText(/92\.50/)).toBeVisible();

  // Click swap
  await page.getByRole('button', { name: 'Swap currencies' }).click();

  // Values should be swapped
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('EUR');
  await expect(page.getByLabel('To', { exact: true })).toHaveValue('USD');

  // Conversion result should be cleared
  await expect(page.getByText(/92\.50/)).not.toBeVisible();
});

test('shows API error message when conversion fails', async ({ page }) => {
  // Override default convert mock with an error response
  await page.route(/\/convert/, (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Only USD conversions supported' }),
    }),
  );

  await page.goto('/');
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('USD');

  await page.getByLabel('Amount').fill('100');
  await page.getByRole('button', { name: 'Convert' }).click();

  await expect(page.getByText('Only USD conversions supported')).toBeVisible();
});
