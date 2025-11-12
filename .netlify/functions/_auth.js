const crypto = require('crypto');

const SERVER_SECRET = process.env.SECRET_KEY || 'dev-server-secret-change-me';

function base64UrlEncode(input) {
	// input: string or Buffer
	const buf = Buffer.isBuffer(input) ? input : Buffer.from(typeof input === 'string' ? input : JSON.stringify(input));
	return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input) {
	const pad = 4 - (input.length % 4);
	const base64 = input.replace(/-/g, '+').replace(/_/g, '/') + (pad < 4 ? '='.repeat(pad) : '');
	return Buffer.from(base64, 'base64').toString('utf8');
}

function sign(data) {
	return crypto.createHmac('sha256', SERVER_SECRET).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJWT(payload, expiresInSeconds = 3600) {
	const now = Math.floor(Date.now() / 1000);
	const header = { alg: 'HS256', typ: 'JWT' };
	const body = Object.assign({}, payload, { iat: now, exp: now + expiresInSeconds });

	const headerB = base64UrlEncode(JSON.stringify(header));
	const payloadB = base64UrlEncode(JSON.stringify(body));
	const signature = sign(`${headerB}.${payloadB}`);

	return `${headerB}.${payloadB}.${signature}`;
}

function verifyJWT(token) {
	if (!token || typeof token !== 'string') throw new Error('Invalid token format');

	const parts = token.split('.');
	if (parts.length !== 3) throw new Error('Invalid token structure');

	const [headerB, payloadB, signature] = parts;
	const expected = sign(`${headerB}.${payloadB}`);
	if (signature !== expected) throw new Error('Invalid token signature');

	let payload;
	try {
		payload = JSON.parse(base64UrlDecode(payloadB));
	} catch (e) {
		throw new Error('Invalid token payload');
	}

	const now = Math.floor(Date.now() / 1000);
	if (payload.exp && now > payload.exp) throw new Error('Token expired');

	return payload; // returns decoded payload (includes sub, iat, exp, etc.)
}

module.exports = {
	signJWT,
	verifyJWT,
};
