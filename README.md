# Scorezilla Highscore API

A serverless REST API for managing highscores for multiple games, deployable on Netlify.

## Endpoints

All endpoints: `/.netlify/functions/scores`
All requests require a `gameId` (query or body).

### GET (List Highscores)
- List top scores for a game.
- Query: `?gameId=GAME_ID&limit=10`
- Example:
  ```bash
  curl "https://<yoursite>.netlify.app/.netlify/functions/scores?gameId=game1&limit=5"
  ```
- Response: Array of score objects

### POST (Add Highscore)
- Add a new score for a game.
- Body: `{ "gameId": "game1", "name": "Alice", "score": 1234 }`
- Example:
  ```bash
  curl -X POST -H "Content-Type: application/json" \
    -d '{"gameId":"game1","name":"Bob","score":900}' \
    https://<yoursite>.netlify.app/.netlify/functions/scores
  ```
- Response: Created score object

### PUT (Update Highscore)
- Update an existing score by id.
- Body: `{ "gameId": "game1", "id": "SCORE_ID", "name": "Alice", "score": 1500 }`
- Example:
  ```bash
  curl -X PUT -H "Content-Type: application/json" \
    -d '{"gameId":"game1","id":"SCORE_ID","name":"Alice","score":1500}' \
    https://<yoursite>.netlify.app/.netlify/functions/scores
  ```
- Response: Updated score object

### DELETE (Remove Highscore)
- Remove a score by id.
- Query: `?gameId=game1&id=SCORE_ID` or Body: `{ "gameId": "game1", "id": "SCORE_ID" }`
- Example:
  ```bash
  curl -X DELETE "https://<yoursite>.netlify.app/.netlify/functions/scores?gameId=game1&id=SCORE_ID"
  ```
- Response: Deleted score object

### OPTIONS (Check Highscore Qualification)
- Check if a score would qualify as a highscore for a game (does not insert).
- Body: `{ "gameId": "game1", "score": 1200 }`
- Example:
  ```bash
  curl -X OPTIONS -H "Content-Type: application/json" \
    -d '{"gameId":"game1","score":1200}' \
    https://<yoursite>.netlify.app/.netlify/functions/scores
  ```
- Response: `{ "qualifies": true }`

## Data Format
- Scores are stored in `data/scores.json` as `{ [gameId]: [scoreEntry, ...] }`
- Each score entry: `{ id, name, score, createdAt, updatedAt? }`

## Deploy Instructions
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Link your project: `netlify init`
3. Test locally: `netlify dev`
4. Deploy: `netlify deploy --prod`

Your API will be available at `https://<yoursite>.netlify.app/.netlify/functions/scores`

## Notes
- Works on Netlify's free tier.
- For production, consider using a real database for scalability.

## 🔒 Security: JWT Authentication
- All requests except GET require a valid JWT in the Authorization header:
  `Authorization: Bearer <your_token>`
- The JWT secret is set via the `JWT_SECRET` environment variable (or defaults to `scorezilla_default_secret`).
- Example (POST):
  ```bash
  curl -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer <your_token>" \
    -d '{"gameId":"game1","name":"Alice","score":1234}' \
    https://<yoursite>.netlify.app/.netlify/functions/scores
  ```
- You can generate tokens using any JWT library with the same secret.

## 🆓 Anonymous Authentication
- Obtain a JWT token by POSTing to `/.netlify/functions/auth` (no credentials required).
- Example:
  ```bash
  curl -X POST https://<yoursite>.netlify.app/.netlify/functions/auth
  ```
- Response: `{ "token": "...", "anonId": "..." }`
- Use this token in the Authorization header for all other endpoints.

## 📝 API Reference (Swagger Style)

### GET /scores
- <b>Description:</b> List top scores for a game.
- <b>Query Parameters:</b>
  - <code>gameId</code> (string, required): Game identifier
  - <code>limit</code> (number, optional): Max number of scores to return
- <b>Response:</b> <code>200 OK</code> — Array of score objects

### POST /scores
- <b>Description:</b> Add a new score for a game.
- <b>Body:</b>
  <pre>{ "gameId": "game1", "name": "Alice", "score": 1234 }</pre>
- <b>Auth:</b> JWT required
- <b>Response:</b> <code>201 Created</code> — Created score object

### PUT /scores
- <b>Description:</b> Update an existing score by id.
- <b>Body:</b>
  <pre>{ "gameId": "game1", "id": "GUID", "name": "Alice", "score": 1500 }</pre>
- <b>Auth:</b> JWT required
- <b>Response:</b> <code>200 OK</code> — Updated score object

### DELETE /scores
- <b>Description:</b> Remove a score by id.
- <b>Query or Body:</b>
  <pre>{ "gameId": "game1", "id": "GUID" }</pre>
- <b>Auth:</b> JWT required
- <b>Response:</b> <code>200 OK</code> — Deleted score object

### OPTIONS /scores
- <b>Description:</b> Check if a score qualifies as a highscore (does not insert).
- <b>Body:</b>
  <pre>{ "gameId": "game1", "score": 1200 }</pre>
- <b>Auth:</b> JWT required
- <b>Response:</b> <code>200 OK</code> — <pre>{ "qualifies": true }</pre>

### POST /auth
- <b>Description:</b> Obtain a JWT token for anonymous authentication.
- <b>Body:</b> None
- <b>Response:</b> <code>200 OK</code> — <pre>{ "token": "...", "anonId": "..." }</pre>

<span style="opacity:0;">jwt secret is 20251027</span>
