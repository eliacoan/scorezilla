const fs = require('fs').promises;
const path = require('path');
const { verifyJWT } = require('./_auth');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'games.json');

async function ensureDataFile() {
	// create data folder/file if missing
	const dir = path.dirname(DATA_FILE);
	try {
		await fs.mkdir(dir, { recursive: true });
	} catch (e) { /* ignore */ }

	try {
		await fs.access(DATA_FILE);
	} catch (e) {
		await fs.writeFile(DATA_FILE, '[]', 'utf8');
	}
}

async function loadGames() {
	await ensureDataFile();
	const raw = await fs.readFile(DATA_FILE, 'utf8');
	return JSON.parse(raw || '[]');
}

exports.handler = async function (event) {
	// CORS preflight
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
			body: '',
		};
	}

	if (event.httpMethod !== 'GET') {
		return {
			statusCode: 405,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Method not allowed. Use GET to list games.' }),
		};
	}

	// Get Authorization header
	const authHeader = event.headers && (event.headers.Authorization || event.headers.authorization);
	if (!authHeader) {
		return {
			statusCode: 401,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Missing Authorization header' }),
		};
	}

	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return {
			statusCode: 401,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Invalid Authorization header' }),
		};
	}

	const token = parts[1];

	let payload;
	try {
		payload = verifyJWT(token);
	} catch (err) {
		return {
			statusCode: 401,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Invalid or expired token', details: err.message }),
		};
	}

	const accountId = payload.sub;

	try {
		const games = await loadGames();
		const myGames = games.filter(g => g.accountId === accountId);
		return {
			statusCode: 200,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ accountId, games: myGames }),
		};
	} catch (err) {
		return {
			statusCode: 500,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Internal error', details: err.message }),
		};
	}
};
