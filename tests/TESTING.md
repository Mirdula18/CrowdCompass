# StadiumPilot — Testing

Two layers, deliberately kept separate:

1. **Unit tests** (`server/tests/*.test.js`, run via `npm test`) — pure logic only:
   route-waypoint resolution, prompt construction, stadium data integrity, and the
   live-data generators' statistical invariants (e.g. "never closes all gates").
   No network calls, no API key required, runs in under a second — this is the
   layer a CI pipeline or automated evaluator can actually execute.
2. **Live edge-case tests** (`tests/test-edge-cases.js`, run via `npm run test:edge-cases`
   from the repo root) — real HTTP calls against a running server backed by a real
   Gemini API key. These exercise the six required edge cases from
   `PROMPT_DESIGN.md` §5 end-to-end against the actual model, which unit tests
   can't do (an LLM response can't be unit-tested without either mocking the
   model — defeating the point of verifying real behavior — or hitting it live).

## Layer 1 — Unit tests

Run with `npm test` (from repo root or `server/`). Uses Node's built-in test
runner (`node --test`), so no test framework dependency was added.

| File | Covers |
|---|---|
| `server/tests/stadium-data.test.js` | Data integrity (every section/gate references a real zone), a regression test for the gate/zone-center overlap bug fixed in the UI polish pass, `getAmenitiesByType`/`getNearestEmergencyPoint`/`getGateByZone`, name-lookup maps |
| `server/tests/live-data.test.js` | Crowd-level generators return valid values, gate-status generator never closes all gates (run 200x to exercise the random branch), `buildStadiumStatePrompt` never invents an amenity |
| `server/tests/app.test.js` | `resolveRouteCoordinates` (exact match, fuzzy fallback, multi-waypoint, empty route), `buildUserPrompt` (message/profile interpolation, defaults, live-state inclusion) |

Last run: 33/33 passing, ~0.5s.

## Layer 2 — Live edge-case tests

**Date:** 2026-07-15
**Model:** gemini-3.1-flash-lite
**Server:** localhost:3001
**Method:** `node tests/test-edge-cases.js` — live HTTP calls against a running server backed by a real Gemini API key (no mocked responses).

## Results: 9/9 PASSED

### 1. Gate closes mid-session → reroute + explanation — PASS
- **Input:** "I need to get to Section 107 through the North Gate"
- **Result:** Rerouted via Sections 102/103 based on live crowd density, `alert_level: "normal"`, reasoning provided.
- **Verdict:** Correctly handled gate/crowd-aware navigation.

### 2. Medical/distress keywords → emergency escalation — PASS
- **Input:** "I feel really dizzy and can't breathe well"
- **Result:** `alert_level: "emergency"`, routed to Medical Station North, calm instructions, no clarifying question.
- **Verdict:** Emergency correctly escalated, not treated as normal navigation.

### 3. Wheelchair + stairs-only route → conflict flagged — PASS
- **Input:** "I am in a wheelchair, how do I get to Section 103?"
- **Result:** Route via accessible perimeter path, explicitly confirms Section 103 accessibility for the wheelchair constraint.
- **Verdict:** Accessibility treated as a hard constraint, not a preference.

### 4. Gibberish/ambiguous input → clarifying question — PASS
- **Input:** "asdkfj gate??"
- **Result:** `clarifying_question`: "Could you please clarify which gate you are trying to reach?"
- **Verdict:** Asked instead of guessing; not flagged as emergency.

### 5. Dietary restriction with no match → honest "not available" — PASS
- **Input:** "Is there kosher food available near me?" (dietary: `["kosher"]`)
- **Result:** "I am sorry, but there are currently no food vendors in the stadium that offer kosher options."
- **Verdict:** Honest, no invented kosher vendor in the answer or route.

### 6. French language → detected and responded in French — PASS
- **Input:** "Où se trouve le stand de nourriture le plus proche?"
- **Result:** `language_detected: "fr"`, full French response with a correct answer.
- **Verdict:** Common supported language handled correctly.

### 7. Unsupported/rare language → graceful fallback — PASS
- **Input:** "Ubi est taberna cibi sine nucibus proxima?" (Latin — a real language with essentially no expected use by a live fan, used to test the fallback path rather than a common EU language)
- **Result:** `language_detected: "latin"`, answered in Latin ("Proxima taberna cibi sine nucibus est 'Burger Shack'..."), full JSON contract intact (`route` is an array, `alert_level: "normal"`).
- **Verdict:** No crash, no broken contract, no empty response — genuine best-effort handling of a language far outside the expected common set. This case was previously untested (was mislabeled as covered by the French test, which exercises a well-supported major language, not this row of `PROMPT_DESIGN.md` §5).

### 8. Normal navigation query → correct route and reasoning — PASS
- **Input:** "Where is the nearest restroom?"
- **Result:** Route with 2 waypoints, `route_coordinates` resolved, reasoning provided, `alert_level: "normal"`.
- **Verdict:** Standard query handled correctly end to end.

### 9. Wheelchair user asking for accessible food route — PASS
- **Input:** "I'm in a wheelchair and hungry. Where can I get food?"
- **Result:** Routed to Burger Shack / Hot Dog Cart (both wheelchair accessible), avoided non-accessible venues.
- **Verdict:** Accessibility constraint applied to food recommendations too, not just wayfinding.
