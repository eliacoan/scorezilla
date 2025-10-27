# scorezilla
Highscore system to be used in games with REST protocol

Scorezilla - simple highscores API for Netlify

Endpoints (Netlify Function: /.netlify/functions/scores)

GET - list top scores
  Query: ?limit=10
  Response: JSON array of { id, name, score, createdAt }

POST - submit a score
  Body: JSON { name: string, score: number }
  Response: 201 created with the entry

Notes:
- Storage is a local JSON file (data/scores.json). For production, replace with a proper DB or an external storage provider.
- Run locally with: npm install && npm run start (requires netlify-cli)

---

LiteDB backend (C#)

- Requires .NET and LiteDB NuGet package.
- Netlify function: netlify/functions/scores.cs
- Database file: data/scores.db

Endpoints:
- GET /.netlify/functions/scores?limit=10 — returns top scores
- POST /.netlify/functions/scores — JSON body { name, score }

Setup:
- Install .NET SDK and LiteDB NuGet package
- Deploy to Netlify with C# function support

Note: For local dev, run with Netlify CLI and .NET installed
