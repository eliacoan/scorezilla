const { verifyJWT } = require('./_auth');

// ...existing code (your scores implementation) ...
exports.handler = async function (event) {
	// CORS preflight
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
			body: '',
		};
	}

	// Verify token for protected methods (POST, PUT, DELETE require auth)
	const protectedMethods = ['POST', 'PUT', 'DELETE'];
	if (protectedMethods.includes(event.httpMethod)) {
		const authHeader = event.headers && (event.headers.Authorization || event.headers.authorization);
		if (!authHeader) {
			return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Missing Authorization header' }) };
		}
		const parts = authHeader.split(' ');
		if (parts.length !== 2 || parts[0] !== 'Bearer') {
			return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid Authorization header' }) };
		}
		const token = parts[1];
		try {
			const payload = verifyJWT(token);
			// payload.sub contains the account id — you can use it for ownership checks / auditing
			// e.g. event.auth = { accountId: payload.sub };
			event.auth = { accountId: payload.sub };
		} catch (err) {
			return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid or expired token', details: err.message }) };
		}
	}

	// ...existing code continues: handle GET/POST/PUT/DELETE using event and event.auth ...
	// Example response for demonstration:
	return {
		statusCode: 200,
		headers: { 'Access-Control-Allow-Origin': '*' },
		body: JSON.stringify({ ok: true, method: event.httpMethod, auth: event.auth || null }),
	};
};
