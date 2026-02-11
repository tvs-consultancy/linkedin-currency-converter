import { exchangeRates } from './csv-parser';
import { convert } from './converter';
import type { ErrorResponse } from './types';

function jsonResponse(body: object, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function errorResponse(error: string, status: number): Response {
	return jsonResponse({ error } satisfies ErrorResponse, status);
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname !== '/convert' || request.method !== 'GET') {
			return errorResponse('Not found. Use GET /convert', 404);
		}

		const amountStr = url.searchParams.get('amount');
		const from = url.searchParams.get('from')?.toUpperCase();
		const to = url.searchParams.get('to')?.toUpperCase();

		if (!amountStr || !from || !to) {
			return errorResponse('Missing required parameters: amount, from, to', 400);
		}

		const amount = Number(amountStr);
		if (isNaN(amount) || amount < 0) {
			return errorResponse('amount must be a non-negative number', 400);
		}

		if (from === to) {
			return errorResponse('from and to currencies must differ', 400);
		}

		if (from !== 'USD' && to !== 'USD') {
			return errorResponse('One of from/to must be USD. Only USD conversions supported', 400);
		}

		try {
			const result = convert(amount, from, to, exchangeRates);
			return jsonResponse(result);
		} catch (e) {
			return errorResponse((e as Error).message, 400);
		}
	},
} satisfies ExportedHandler;
