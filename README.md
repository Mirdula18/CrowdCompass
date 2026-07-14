# StadiumPilot

AI concierge for stadium fans — built for the "Smart Stadiums and Tournament Operations"
GenAI hackathon challenge (2026 FIFA World Cup context).

## What it does
A fan asks a question in any language — "where's my seat," "nearest gate that isn't
crowded," "I'm in a wheelchair, how do I get to Section 214," "is there nut-free food near
me" — and StadiumPilot reasons over live stadium conditions (crowd density, gate status,
fan profile) to return a route **and** a plain-language explanation of why it recommended
that (explainable AI / XAI).

- **Persona:** Fan
- **Verticals:** Navigation + Multilingual Assistance + Accessibility
- **AI provider:** Google Gemini API (free tier) — see `PROMPT_DESIGN.md` for full prompt design
- **Built with:** OpenCode (Phases 1-6) — see `task.md`

## Project docs
| File | Purpose |
|---|---|
| `task.md` | Phased build plan — what's done, what's next |
| `PROMPT_DESIGN.md` | The AI agent's system prompt, JSON output contract, edge-case behavior |
| `AGENTS.md` | Instructions auto-read by OpenCode |
| `CLAUDE.md` | Instructions auto-read by Claude Code |
| `tests/TESTING.md` | Edge case test results |

## How to run
```bash
# Install dependencies
cd server && npm install && cd ../client && npm install && cd ..

# Set up API key
cp .env.example server/.env
# Edit server/.env and add your GEMINI_API_KEY

# Start both server and client
npm run dev
```

- **Server:** http://localhost:3001
- **Client:** http://localhost:5173 (proxies /api to server)

## Live demo
_(pending deployment)_

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 6, Leaflet (react-leaflet) for maps |
| Backend | Node.js + Express, direct Gemini REST API calls |
| AI | Google Gemini API (`gemini-3.1-flash-lite`), structured JSON output |
| Deployment | Vercel (or Netlify) — static frontend + serverless API |
| Data | Synthetic live stadium data (crowd density, gate status update every 5s) |
