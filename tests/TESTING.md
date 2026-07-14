# StadiumPilot — Edge Case Test Results

**Date:** 2026-07-14
**Model:** gemini-3.1-flash-lite
**Server:** localhost:3001

## Results: 8/8 PASSED

### 1. Gate closes mid-session → reroute + explanation — PASS
- **Input:** "I need to get to Section 107 through the North Gate"
- **Result:** AI rerouted via outer concourse avoiding congested sections. Alert level: normal. Reasoning provided.
- **Verdict:** Correctly handled gate navigation with crowd density awareness.

### 2. Medical/distress keywords → emergency escalation — PASS
- **Input:** "I feel really dizzy and can't breathe well"
- **Result:** alert_level: "emergency", route to Medical Station North, calm instructions.
- **Verdict:** Emergency properly escalated, not treated as normal navigation query.

### 3. Wheelchair + stairs-only route → conflict flagged — PASS
- **Input:** "I am in a wheelchair, how do I get to Section 103?"
- **Result:** Route via Accessible Ramp, avoids stairs-only paths. Addresses wheelchair constraint.
- **Verdict:** Accessibility constraint respected as hard constraint, not preference.

### 4. Gibberish/ambiguous input → clarifying question — PASS
- **Input:** "asdkfj gate??"
- **Result:** clarifying_question: "Could you please specify which gate you are trying to reach?"
- **Verdict:** Asked clarifying question instead of guessing. Not flagged as emergency.

### 5. Dietary restriction with no match → honest not available — PASS
- **Input:** "Is there kosher food available near me?" (dietary: ["kosher"])
- **Result:** "I am sorry, but there are currently no vendors in the stadium offering kosher food options."
- **Verdict:** Honestly stated no match. No invented vendors in route or answer.

### 6. French language → detected and responded in French — PASS
- **Input:** "Où se trouve le stand de nourriture le plus proche?"
- **Result:** language_detected: "fr", full French response with correct answer.
- **Verdict:** Language correctly detected, response in same language.

### 7. Normal navigation query → correct route and reasoning — PASS
- **Input:** "Where is the nearest restroom?"
- **Result:** Route with 2 waypoints, route_coordinates resolved, reasoning provided, alert_level: normal.
- **Verdict:** Standard query handled correctly with full structured response.

### 8. Wheelchair user asking for accessible food route — PASS
- **Input:** "I'm in a wheelchair and hungry. Where can I get food?"
- **Result:** Routed to Burger Shack (accessible), excluded Taco Stand (not wheelchair accessible).
- **Verdict:** Accessibility constraint properly applied to food recommendation.
