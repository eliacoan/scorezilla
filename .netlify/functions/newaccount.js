const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'accounts.json');

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
	// prefer crypto.randomUUID if available
	if (crypto.randomUUID) return crypto.randomUUID();
	return crypto.randomBytes(16).toString('hex');
}

function genSecret64() {
	// 32 bytes -> 64 hex chars
	return crypto.randomBytes(32).toString('hex');
}

exports.handler = async function (event) {
	// Allow CORS and accept POST only (simple handling)
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
			body: JSON.stringify({ error: 'Method not allowed. Use POST to create a new account.' }),
		};
	}

	try {
		await ensureDataFile();

		const raw = await fs.readFile(DATA_FILE, 'utf8');
		const accounts = JSON.parse(raw || '[]');

		const id = genId();
		const secret = genSecret64();
		const createdAt = new Date().toISOString();

		const account = { id, secret, createdAt };

		accounts.push(account);
		await fs.writeFile(DATA_FILE, JSON.stringify(accounts, null, 2), 'utf8');

		return {
			statusCode: 201,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
			body: JSON.stringify({
				id,
				secret,
				note: 'Save these values securely — the secret is shown only once and is required to authenticate/manage this account.',
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
