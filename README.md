# PerfKit — Local Performance Analyzer

A private, local GTmetrix-style website performance analyzer.  
Runs 100% on your machine. No API keys, no rate limits, no data sent anywhere.

---

## Features

| Feature | Details |
|---|---|
| Lighthouse scores | Performance, Accessibility, Best Practices, SEO (0–100, A–F grade) |
| Core Web Vitals | LCP, FCP, TBT, CLS, TTFB, Speed Index with Good/Needs Improvement/Poor ratings |
| Waterfall chart | Every network request with DNS/Connect/SSL/Wait/Receive timing breakdown |
| Filmstrip | Page load progression screenshots at key intervals |
| Full screenshot | Final rendered page capture |
| Audit recommendations | Prioritized list with estimated savings (ms / bytes) |
| History & trends | SQLite-stored runs, line charts per URL over time |

---

## Requirements

- **Node.js 20 LTS** — https://nodejs.org (LTS version)
- **Google Chrome** — already installed on most Windows machines
- **Windows 10/11**

---

## Quick Start

```
1. Double-click INSTALL.bat   ← installs all npm packages (one-time)
2. Double-click START.bat     ← starts both servers + opens browser
3. Open http://localhost:5173
```

---

## Manual Start

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd perfkit/backend
node index.js
# Server running at http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd perfkit/frontend
npm run dev
# UI running at http://localhost:5173
```

---

## Project Structure

```
perfkit/
├── backend/
│   ├── index.js          Express API server
│   ├── runner.js         Lighthouse + Puppeteer analysis engine
│   ├── db.js             SQLite database (better-sqlite3)
│   ├── package.json
│   └── perfkit.db        ← created automatically on first run
├── frontend/
│   ├── src/
│   │   ├── App.jsx            Router + nav
│   │   ├── pages/
│   │   │   ├── Home.jsx       URL input + recent runs
│   │   │   ├── Report.jsx     Full analysis report (tabs)
│   │   │   └── History.jsx    All runs + trend charts
│   │   └── components/
│   │       ├── ScoreGauge.jsx     Circular SVG score gauge
│   │       ├── WebVitals.jsx      CWV cards with ratings
│   │       ├── WaterfallChart.jsx Network request waterfall
│   │       ├── Filmstrip.jsx      Load progression frames
│   │       └── AuditList.jsx      Prioritized audit items
│   ├── vite.config.js
│   └── package.json
├── screenshots/           Auto-created, stores .jpg per run
├── INSTALL.bat
├── START.bat
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/analyze` | Submit URL for analysis `{ url }` |
| GET | `/api/runs/:id` | Get run result (poll until status=done) |
| GET | `/api/history` | All runs, optional `?url=&limit=` |
| GET | `/api/urls` | Unique URLs with run counts |
| GET | `/api/trend` | Trend data `?url=&limit=` |
| DELETE | `/api/runs/:id` | Delete a run |
| GET | `/api/health` | Server health + queue status |

---

## Analysis Configuration

Edit `backend/runner.js` to change test settings:

```js
// Change from desktop to mobile:
formFactor: 'mobile',
screenEmulation: { mobile: true, width: 375, height: 812, ... }

// Change throttling (simulate slower connections):
throttling: {
  rttMs: 150,          // 4G: 150ms RTT
  throughputKbps: 1638, // 4G: ~1.6 Mbps
  cpuSlowdownMultiplier: 4,
}

// Test localhost sites — just enter http://localhost:PORT in the UI
// No special config needed
```

---

## Tips

- **Testing localhost:** Enter `http://localhost:3000` (or any port) in the URL bar — works natively
- **Staging sites:** Any URL accessible from your machine works, including VPN-only URLs
- **Re-test:** Submit the same URL multiple times to build trend data
- **Delete old runs:** Click × in History to remove a run from the database
- **Database location:** `backend/perfkit.db` — back it up to keep your history

---

## Troubleshooting

**"Analysis Failed" / Chrome error:**
- Make sure Chrome is installed at the default location
- Try: `npx puppeteer browsers install chrome` in the backend folder

**Port already in use:**
- Backend uses 3001, frontend uses 5173
- Change in `backend/index.js` (PORT variable) and `frontend/vite.config.js`

**Very slow analysis:**
- Normal — Lighthouse runs a full browser session. Expect 15–45 seconds per URL.
- Complex SPAs or slow servers will take longer.

**No filmstrip frames:**
- Some pages don't trigger Lighthouse's screenshot audit. This is normal.

---

## Tech Stack

- **Backend:** Node.js, Express, Lighthouse 11, Puppeteer 21, better-sqlite3
- **Frontend:** React 18, Vite 5, Recharts, React Router
- **Database:** SQLite (zero-config, single file)
- **Fonts:** Syne + IBM Plex Mono

All open source. No telemetry. No external API calls.
