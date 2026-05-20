# Bundesliga Live-Predict — Backend

Express REST API + WebSocket server for live match streaming and prediction markets.

## Quick start

```bash
cd backend
npm install
cp .env.example .env      # adjust DATA_DIR if needed
npm run dev               # ts-node-dev with hot reload
```

Server listens on **http://localhost:3001** (REST) and **ws://localhost:3001/live/:matchId** (WebSocket).

---

## REST API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/matches` | List available matches |
| GET | `/api/matches/:id` | Match detail + roster |
| GET | `/api/matches/:id/players` | Home/away squads |
| GET | `/api/matches/:id/events` | KPI events (`?type=Play&limit=50`) |
| GET | `/api/markets` | Open markets (`?matchId=xxx&status=open`) |
| GET | `/api/markets/:id` | Single market |
| POST | `/api/markets` | Create a custom market |
| POST | `/api/markets/next-goal` | Auto-generate "Nächstes Tor" market |
| PUT | `/api/markets/:id/settle` | Settle a market |
| PUT | `/api/markets/:id/cancel` | Cancel a market |
| GET | `/api/bets` | List bets (`?userId=xxx`) |
| GET | `/api/bets/:id` | Single bet |
| POST | `/api/bets` | Place a bet |
| GET | `/api/predictions/next-goal` | Next-goal prediction from XML tracking data |

Import `postman/Bundesliga_API.postman_collection.json` into Postman to get pre-built requests for all endpoints.

---

## WebSocket streaming

Connect to `ws://localhost:3001/live/DFL-MAT-111111`.

The server streams real player-tracking frames from `Positions_Bayern_Hamburg.xml` at 200 ms intervals. Each message is a JSON object:

```json
{
  "type": "frame",
  "payload": {
    "matchId": "DFL-MAT-111111",
    "frameN": 10001,
    "timestamp": 1747523412345,
    "players": [
      { "playerId": "DFL-OBJ-000028", "jerseyNumber": 8, "teamSide": "away",
        "x": 52.7, "y": 24.7, "speedKmh": 12.4 }
    ],
    "ball": { "x": 0.03, "y": 32.34, "z": 0 }
  }
}
```

---

## XML data files

All XML files are expected in `../bundes_data/` (configurable via `DATA_DIR` in `.env`):

| File | Purpose |
|------|---------|
| `MatchInformations_Anonym.xml` | Team rosters, formations, match metadata |
| `Positions_Bayern_Hamburg.xml` | Player tracking at 25 Hz (421 MB, streamed line-by-line) |
| `kpi_data_Bayern_Hamburg.xml` | Ball positions, passes, carries, xG/xP values |
| `Events_Anonym.xml` | Raw event timeline |

---

## Prediction algorithm (`GET /api/predictions/next-goal`)

Uses the last 10 tracking frames to estimate:

1. **Attacking pressure**: number of players in each team's attacking third.
2. **Possession proxy**: share of players in the centre third.
3. **Intensity**: average player speed per team.

These are combined into a goal-probability score and converted to fair-value decimal odds (no margin). The `reasoning` field in the response exposes all intermediate values.
