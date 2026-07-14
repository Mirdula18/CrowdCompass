# AGENTS.md — Instructions for OpenCode

Read automatically by OpenCode. Your job is the **full build, Phases 1–6** in `task.md`.
Claude Code does a final enhancement/review pass after you're done — it is not going to
rebuild your work, so build for real, don't leave stubs "for later."

## Project
**StadiumPilot** — AI concierge for stadium fans (navigation + multilingual + accessibility).
Full scope in `task.md`, AI design (system prompt, JSON contract, edge cases) in
`PROMPT_DESIGN.md`. Follow both exactly.

## Your scope: Phases 1–6, in order, don't skip ahead
1. **Foundation** — scaffold frontend (React + Vite) + backend/serverless proxy. Stadium
   data model (gates, sections, crowd density per zone, amenities, accessibility features).
   Synthetic live-data generator updating every few seconds. `.env.example` with
   `GEMINI_API_KEY` placeholder.
2. **Core AI reasoning** — backend endpoint calling Google Gemini API (`gemini-2.5-flash`)
   using the exact system prompt and JSON schema from `PROMPT_DESIGN.md`. API key
   server-side only, read from `GEMINI_API_KEY` env var, never exposed to the client.
3. **Frontend integration** — chat/map UI wired to the real backend, no mock responses,
   route rendered on the map, "Why This Route" reasoning panel populated from the real
   response.
4. **UI polish** — no overlapping map labels/icons at any fan position, chip-style dietary
   selector (not native multi-select), clear visual hierarchy (current location + active
   route dominate), consistent spacing and type scale in the header.
5. **Edge cases** — test and handle every case in `PROMPT_DESIGN.md` section 5 (gate closes
   mid-session, medical/distress escalation, wheelchair+stairs conflict, gibberish input,
   no dietary match, unsupported language). Log results in `/tests` or `TESTING.md`.
6. **Deploy** — Vercel, Netlify, or Google Cloud Run (not GitHub Pages). Confirm the live
   link works end-to-end with no hard-coded responses anywhere.

## Rules
- Never hard-code/fake an AI response, even temporarily — every "smart" feature is a real
  Gemini API call from the start.
- Don't add personas or verticals beyond Fan + Navigation/Multilingual/Accessibility.
- Update `task.md`'s "Current status" checklist and phase checkboxes as you actually
  complete them — be honest, don't check things off that are half-working.
- Ask before installing any dependency outside a standard frontend + Node setup.

## Exit condition
All of Phases 1–6 in `task.md` checked off, live deployed link works end-to-end. At that
point, stop — Claude Code takes over for a final review/enhancement pass.

## How to run
```
# Install dependencies
cd server && npm install && cd ../client && npm install && cd ..

# Set up API key
cp .env.example server/.env
# Edit server/.env and add your GEMINI_API_KEY

# Start both server and client
npm run dev
```

Server runs on http://localhost:3001, client on http://localhost:5173 (proxies /api to server).
