const fs = require('fs').promises;
const path = require('path');
const { signJWT } = require('./_auth');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'accounts.json');

async function loadAccounts() {
	try {
		const raw = await fs.readFile(DATA_FILE, 'utf8');
		return JSON.parse(raw || '[]');
	} catch (e) {
		return [];
	}
}

exports.handler = async function (event) {
	// CORS preflight
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
			body: '',
		};
	}

	if (event.httpMethod !== 'POST') {
		return {
			statusCode: 405,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
		};
	}

	let body;
	try {
		body = event.body ? JSON.parse(event.body) : {};
	} catch (err) {
		return {
			statusCode: 400,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Invalid JSON body' }),
		};
	}

	const { id, secret } = body || {};
	if (!id || !secret) {
		return {
			statusCode: 400,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Missing id or secret' }),
		};
	}

	try {
		const accounts = await loadAccounts();
		const account = accounts.find(a => a.id === id && a.secret === secret);

		if (!account) {
			return {
				statusCode: 401,
				headers: { 'Access-Control-Allow-Origin': '*' },
				body: JSON.stringify({ authenticated: false, error: 'Invalid credentials' }),
			};
		}

		// Sign JWT using shared helper
		const token = signJWT({ sub: id }, 60 * 60); // 1 hour

		const now = Math.floor(Date.now() / 1000);
		const expiresAt = new Date((now + 60 * 60) * 1000).toISOString();

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
			body: JSON.stringify({
				authenticated: true,
				id,
				token,
				expiresAt,
				note: 'Store the token securely. It expires in 1 hour.',
			}),
		};
	} catch (err) {
		return {
			statusCode: 500,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Internal error', details: err.message }),
		};
	}
};
