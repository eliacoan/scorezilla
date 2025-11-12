const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
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

function genId() {
	if (crypto.randomUUID) return crypto.randomUUID();
	return crypto.randomBytes(16).toString('hex');
}

exports.handler = async function (event) {
	// CORS preflight
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
			body: '',
		};
	}

	if (event.httpMethod !== 'POST') {
		return {
			statusCode: 405,
			headers: { 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({ error: 'Method not allowed. Use POST to create a game.' }),
		};
	}

	// Check Authorization header
	const authHeader = event.headers && (event.headers.Authorization || event.headers.authorization);
	if (!authHeader) {
		return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Missing Authorization header' }) };
	}
	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid Authorization header' }) };
	}
	const token = parts[1];

	let payload;
	try {
		payload = verifyJWT(token);
	} catch (err) {
		return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid or expired token', details: err.message }) };
	}

	const accountId = payload.sub;

	// Parse body
	let body;
	try {
		body = event.body ? JSON.parse(event.body) : {};
	} catch (err) {
		return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid JSON body' }) };
	}

	const { shortcode, name } = body || {};
	if (!shortcode || !name) {
		return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Missing required fields: shortcode and name' }) };
	}

	try {
		await ensureDataFile();
		const raw = await fs.readFile(DATA_FILE, 'utf8');
		const games = JSON.parse(raw || '[]');

		// prevent duplicate shortcode for the same account
		const exists = games.find(g => g.accountId === accountId && g.shortcode.toLowerCase() === shortcode.toLowerCase());
		if (exists) {
			return { statusCode: 409, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Shortcode already used for this account' }) };
		}

		const id = genId();
		const createdAt = new Date().toISOString();
		const game = { id, shortcode, name, accountId, createdAt };

		games.push(game);
		await fs.writeFile(DATA_FILE, JSON.stringify(games, null, 2), 'utf8');

		return {
			statusCode: 201,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
			body: JSON.stringify({
				...game,
				note: 'Save the game id and shortcode; they are required to manage this game.',
			}),
		};
	} catch (err) {
		return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Internal error', details: err.message }) };
	}
};
