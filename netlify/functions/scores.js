// Serverless function providing a simple REST API for highscores.
// Supports GET (list top scores) and POST (submit a new score).

const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', '..', 'data', 'scores.json');
const MAX_ENTRIES = 100;

async function readScores() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeScores(scoresByGame) {
  const dir = path.dirname(DATA_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
  await fs.writeFile(DATA_FILE, JSON.stringify(scoresByGame, null, 2), 'utf8');
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

exports.handler = async function (event) {
  try {
    const method = event.httpMethod || event.method || 'GET';
    const params = event.queryStringParameters || {};
    const gameId = params.gameId || (event.body ? (JSON.parse(event.body).gameId || '') : '');
    if (!gameId) {
      return { statusCode: 400, body: 'Missing gameId' };
    }
    const scoresByGame = await readScores();
    scoresByGame[gameId] = scoresByGame[gameId] || [];

    if (method === 'GET') {
      const limit = Math.max(1, parseInt(params.limit || '10', 10));
      const scores = scoresByGame[gameId];
      scores.sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scores.slice(0, limit)),
      };
    }

    if (method === 'POST') {
      if (!event.body) {
        return { statusCode: 400, body: 'Missing body' };
      }
      let payload;
      try {
        payload = JSON.parse(event.body);
      } catch (e) {
        return { statusCode: 400, body: 'Invalid JSON' };
      }
      const name = String(payload.name || '').trim();
      const score = Number(payload.score);
      if (!name || Number.isNaN(score)) {
        return { statusCode: 400, body: 'Invalid payload: require name and numeric score' };
      }
      const entry = { id: uuidv4(), name, score, createdAt: new Date().toISOString() };
      scoresByGame[gameId].push(entry);
      scoresByGame[gameId].sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt));
      scoresByGame[gameId] = scoresByGame[gameId].slice(0, MAX_ENTRIES);
      await writeScores(scoresByGame);
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      };
    }

    if (method === 'PUT') {
      if (!event.body) {
        return { statusCode: 400, body: 'Missing body' };
      }
      let payload;
      try {
        payload = JSON.parse(event.body);
      } catch (e) {
        return { statusCode: 400, body: 'Invalid JSON' };
      }
      const { id, name, score } = payload;
      if (!id || !name || Number.isNaN(Number(score))) {
        return { statusCode: 400, body: 'Invalid payload: require id, name, score' };
      }
      const scores = scoresByGame[gameId];
      const idx = scores.findIndex(s => s.id === id);
      if (idx === -1) {
        return { statusCode: 404, body: 'Score not found' };
      }
      scores[idx] = { ...scores[idx], name, score, updatedAt: new Date().toISOString() };
      await writeScores(scoresByGame);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scores[idx]),
      };
    }

    if (method === 'DELETE') {
      const id = params.id || (event.body ? (JSON.parse(event.body).id || '') : '');
      if (!id) {
        return { statusCode: 400, body: 'Missing id' };
      }
      const scores = scoresByGame[gameId];
      const idx = scores.findIndex(s => s.id === id);
      if (idx === -1) {
        return { statusCode: 404, body: 'Score not found' };
      }
      const removed = scores.splice(idx, 1)[0];
      await writeScores(scoresByGame);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(removed),
      };
    }

    if (method === 'OPTIONS') {
      let payload = {};
      if (event.body) {
        try {
          payload = JSON.parse(event.body);
        } catch (e) {}
      }
      const score = Number(payload.score || params.score);
      if (Number.isNaN(score)) {
        return { statusCode: 400, body: 'Missing or invalid score' };
      }
      const scores = scoresByGame[gameId];
      const qualifies =
        scores.length < MAX_ENTRIES ||
        scores.some(s => score > s.score);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualifies }),
      };
    }

    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Internal server error' };
  }
};
