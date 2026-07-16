# StadiumPilot — Task Plan

**Persona:** Fan | **Verticals:** Navigation + Multilingual + Accessibility
**AI provider:** Google Gemini API (free tier) — see `PROMPT_DESIGN.md`
**Rule:** Don't start the next phase until the current one is checked off. No skipping ahead, no scope creep.

---

## Current status
- [x] Phase 1 done? (OpenCode)
- [x] Phase 2 done? (Claude Code)
- [x] Phase 3 done? (Claude Code)
- [x] Phase 4 done? (Claude Code)
- [x] Phase 5 done? (Claude Code)
- [x] Phase 6 done? (Claude Code)
- [ ] Phase 7 done? (Claude Code + you)

---

## Phase 1 — Foundation — **built with OpenCode**
- [x] Repo scaffolded: frontend + backend/serverless proxy
- [x] Stadium data model: gates, sections, seats, crowd density per zone, amenities, accessibility features
- [x] Synthetic live-data generator (crowd density + gate status update every few seconds)
- [x] `.env.example` present with `GEMINI_API_KEY` placeholder
- [x] `AGENTS.md` and `CLAUDE.md` both present in repo root
✅ **Exit condition:** app runs locally, shows a stadium map with fake live data. No AI calls yet.
**Handoff note:** once this exit condition is met, stop. Switch to Claude Code for Phase 2 onward.

## Phase 2 — Core AI reasoning engine — **Claude Code**
- [x] Backend endpoint calls Gemini API (`gemini-3.1-flash-lite`) with the system prompt + JSON schema from `PROMPT_DESIGN.md`
- [x] Returns `{answer, reasoning, route, language_detected, alert_level, clarifying_question}`
- [x] API key server-side only, confirmed never exposed to client
✅ **Exit condition:** a test query via curl/Postman returns a valid structured JSON response.

## Phase 3 — Frontend integration — **Claude Code**
- [x] Chat concierge UI wired to the real backend (no mock responses)
- [x] Route renders on the map
- [x] "Why This Route" reasoning panel populated from the real API response
✅ **Exit condition:** typing a question in the UI produces a real AI-generated answer + route + reasoning, end to end.

## Phase 4 — UI polish — **Claude Code**
- [x] Map labels/icons don't overlap at any fan position — fixed two root causes: three of four
      gate coordinates were identical to their zone center (guaranteed collision with section/
      amenity markers), and the per-section jitter offsets were too small (~9-13m) to separate
      labels at any usable zoom. Widened the jitter, pushed gates to the perimeter, aligned the
      "current location" marker to the same computed position as its section label, and set the
      map to a zoom range (17-19) where the fixed offsets read cleanly. Verified via screenshot
      at the default view, a gate location, and the mobile breakpoint.
- [x] Dietary selector uses chips, not a native multi-select (already true — `DietarySelector.jsx`)
- [x] Clear visual hierarchy: current location + active route dominate; other elements are quiet
- [x] Consistent spacing in header controls, clear type scale
✅ **Exit condition:** screenshot the full app — nothing overlaps, hierarchy is obvious at a glance.

## Phase 5 — Edge cases — **Claude Code** (scored explicitly — do not skip)
- [x] Gate closes mid-session → reroute + explanation
- [x] Medical/distress keywords → escalation, not normal chat
- [x] Wheelchair + stairs-only route → conflict flagged, alternate offered
- [x] Gibberish/ambiguous input → clarifying question, not a guess
- [x] Dietary restriction with no match → honest "not available," never invented
- [x] Unsupported/rare language → graceful fallback
✅ **Exit condition:** each case tested once, result logged in `/tests` or `TESTING.md`.

## Phase 6 — Deploy — **Claude Code**
- [x] Deployed to Render (Web Service backend + Static Site frontend, per `render.yaml`)
- [x] Live link tested end-to-end, no hard-coded/static responses anywhere — verified with a
      real emergency-case query against the live URL, got a genuine varying Gemini response
      with populated reasoning and the emergency alert badge
✅ **Exit condition:** live URL works exactly like local version.
Live: https://stadiumpilot-vzqn.onrender.com

## Phase 7 — Submission — **Claude Code** (+ you)
- [ ] `README.md` filled in completely (stack, how to run, live link, screenshot)
- [ ] LinkedIn post: tools used, prompt design decisions, AI vs. manual coding split
- [ ] Final rubric self-check (below)
- [ ] Submit — only your last submission counts, so don't submit until Phase 5 is solid

---

## Rubric self-check before submitting
| Dimension | Covered by |
|---|---|
| Genuine GenAI use | Phase 2/3 — every answer is a real model call, not templated |
| Code quality/efficiency | Phase 1/2 — clean data model, one model call per query |
| Security | Phase 2 — API key server-side only |
| Testing incl. edge cases | Phase 5 |
| Accessibility | Phase 2/4 — baked into reasoning + UI, not bolted on |
| Alignment to problem statement | Stays Fan + Navigation/Multilingual/Accessibility throughout |
| Explainability (XAI) | Phase 3 — reasoning panel always populated |
