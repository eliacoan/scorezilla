const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const JWT_SECRET = process.env.JWT_SECRET || 'scorezilla_default_secret';

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  // Generate anonymous user id
  const anonId = uuidv4();
  const token = jwt.sign({ anonId }, JWT_SECRET, { expiresIn: '2h' });
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, anonId })
  };
};
