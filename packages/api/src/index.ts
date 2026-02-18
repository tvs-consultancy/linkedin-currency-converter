import { exchangeRates } from './csv-parser';
import { convert } from './converter';
import type { ErrorResponse } from './types';

function jsonResponse(body: object, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}

function errorResponse(error: string, status: number): Response {
	return jsonResponse({ error } satisfies ErrorResponse, status);
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		// Handle OPTIONS preflight requests
		if (method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		// All routes must be GET method
		if (method !== 'GET') {
			return errorResponse('Not found', 404);
		}

		// GET /currencies endpoint
		if (pathname === '/currencies') {
			const currencies = Array.from(exchangeRates.keys()).sort();
			return jsonResponse({ currencies });
		}

		// GET /convert endpoint
		if (pathname === '/convert') {
			const amountStr = url.searchParams.get('amount');
			const from = url.searchParams.get('from')?.toUpperCase();
			const to = url.searchParams.get('to')?.toUpperCase();

			if (!amountStr || !from || !to) {
				return errorResponse('Missing required parameters: amount, from, to', 400);
			}

			const amount = Number(amountStr);
			if (isNaN(amount) || amount < 0) {
				return errorResponse('amount must be greater than zero', 400);
			}

			if (from === to) {
				return errorResponse('from and to currencies must differ', 400);
			}

			if (from !== 'USD' && to !== 'USD') {
				return errorResponse('Only USD conversions supported', 400);
			}

			try {
				const result = convert(amount, from, to, exchangeRates);
				return jsonResponse(result);
			} catch (e) {
				return errorResponse((e as Error).message, 400);
			}
		}

		// Everything else is 404
		return errorResponse('Not found', 404);
	},
} satisfies ExportedHandler;
