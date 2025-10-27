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
