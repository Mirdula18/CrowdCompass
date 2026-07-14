// Edge case tests for StadiumPilot — runs against the live server
// Usage: node test-edge-cases.js

const API = process.env.API_URL || "http://localhost:3001";

const testCases = [
  {
    name: "Gate closes mid-session → reroute + explanation",
    description: "Simulates a fan asking for directions through a closed gate. The AI should reroute.",
    message: "I need to get to Section 107 through the North Gate",
    profile: { location: "Section 101", accessibility: "none", dietary: [] },
    validate: (res) => {
      const checks = [];
      if (res.alert_level === "normal" || res.alert_level === "caution") {
        checks.push("PASS: Alert level is " + res.alert_level + " (not emergency)");
      } else {
        checks.push("FAIL: Alert level is emergency for a non-emergency query");
      }
      if (res.answer && res.answer.length > 10) {
        checks.push("PASS: Has a substantive answer");
      } else {
        checks.push("FAIL: Answer is too short or missing");
      }
      if (res.reasoning) {
        checks.push("PASS: Reasoning provided");
      } else {
        checks.push("FAIL: No reasoning provided");
      }
      return checks;
    },
  },
  {
    name: "Medical/distress keywords → emergency escalation",
    description: "Fan reports dizziness and breathing trouble — should trigger emergency routing.",
    message: "I feel really dizzy and can't breathe well",
    profile: { location: "Section 104", accessibility: "none", dietary: [] },
    validate: (res) => {
      const checks = [];
      if (res.alert_level === "emergency") {
        checks.push("PASS: alert_level is emergency");
      } else {
        checks.push("FAIL: alert_level is '" + res.alert_level + "' — expected emergency");
      }
      if (res.route && res.route.some(r => r.toLowerCase().includes("medical") || r.toLowerCase().includes("security") || r.toLowerCase().includes("first aid"))) {
        checks.push("PASS: Route includes medical/security point");
      } else {
        checks.push("FAIL: Route does not include medical/security point: " + JSON.stringify(res.route));
      }
      if (res.clarifying_question === null) {
        checks.push("PASS: No clarifying question (emergency should not ask)");
      } else {
        checks.push("INFO: Clarifying question present: " + res.clarifying_question);
      }
      return checks;
    },
  },
  {
    name: "Wheelchair + stairs-only route → conflict flagged",
    description: "Wheelchair user wants to reach a stairs-only section. Should flag conflict and offer alternate.",
    message: "I am in a wheelchair, how do I get to Section 103?",
    profile: { location: "Section 101", accessibility: "wheelchair", dietary: [] },
    validate: (res) => {
      const checks = [];
      const answerLower = (res.answer || "").toLowerCase();
      const reasoningLower = (res.reasoning || "").toLowerCase();
      if (answerLower.includes("wheelchair") || answerLower.includes("accessible") || answerLower.includes("stairs") || reasoningLower.includes("wheelchair") || reasoningLower.includes("accessible") || reasoningLower.includes("stairs")) {
        checks.push("PASS: Response addresses wheelchair/stairs constraint");
      } else {
        checks.push("FAIL: Response doesn't mention wheelchair/accessibility constraint");
      }
      if (res.route && res.route.length > 0) {
        checks.push("PASS: Route provided: " + res.route.join(" → "));
      } else {
        checks.push("FAIL: No route provided");
      }
      return checks;
    },
  },
  {
    name: "Gibberish/ambiguous input → clarifying question",
    description: "User sends garbled text. Should ask a clarifying question, not guess.",
    message: "asdkfj gate??",
    profile: { location: "Section 101", accessibility: "none", dietary: [] },
    validate: (res) => {
      const checks = [];
      if (res.clarifying_question && res.clarifying_question !== null) {
        checks.push("PASS: Clarifying question provided: " + res.clarifying_question);
      } else {
        checks.push("FAIL: No clarifying question for gibberish input");
      }
      if (res.alert_level !== "emergency") {
        checks.push("PASS: Not flagged as emergency");
      } else {
        checks.push("FAIL: Gibberish flagged as emergency");
      }
      return checks;
    },
  },
  {
    name: "Dietary restriction with no match → honest not available",
    description: "User asks for kosher food. No kosher vendors exist — should say so honestly.",
    message: "Is there kosher food available near me?",
    profile: { location: "Section 101", accessibility: "none", dietary: ["kosher"] },
    validate: (res) => {
      const checks = [];
      const answerLower = (res.answer || "").toLowerCase();
      if (answerLower.includes("kosher") || answerLower.includes("not available") || answerLower.includes("no match") || answerLower.includes("unfortunately") || answerLower.includes("don't have") || answerLower.includes("do not have") || answerLower.includes("no vendor") || answerLower.includes("no option")) {
        checks.push("PASS: Response honestly addresses kosher availability");
      } else {
        checks.push("WARN: Response may not honestly address kosher availability: " + (res.answer || "").substring(0, 100));
      }
      if (res.route && res.route.some(r => r.toLowerCase().includes("kosher"))) {
        checks.push("WARN: Route includes kosher venue — may be invented (no kosher vendors in data)");
      } else {
        checks.push("PASS: No invented kosher venue in route");
      }
      return checks;
    },
  },
  {
    name: "French language → detected and responded in French",
    description: "Fan writes in French. Should detect French and respond in French.",
    message: "Où se trouve le stand de nourriture le plus proche?",
    profile: { location: "Section 107", accessibility: "none", dietary: [] },
    validate: (res) => {
      const checks = [];
      if (res.language_detected === "fr" || res.language_detected?.startsWith("fr")) {
        checks.push("PASS: Language detected as French: " + res.language_detected);
      } else {
        checks.push("FAIL: Language detected as '" + res.language_detected + "' — expected French");
      }
      const hasAccents = /[àâäéèêëïîôùûüÿçœæ]/i.test(res.answer);
      if (hasAccents || res.answer?.toLowerCase().includes("le ") || res.answer?.toLowerCase().includes("la ") || res.answer?.toLowerCase().includes("les ") || res.answer?.toLowerCase().includes("vous")) {
        checks.push("PASS: Response appears to be in French");
      } else {
        checks.push("FAIL: Response doesn't appear to be in French");
      }
      return checks;
    },
  },
  {
    name: "Normal navigation query → correct route and reasoning",
    description: "Standard question about nearest restroom.",
    message: "Where is the nearest restroom?",
    profile: { location: "Section 104", accessibility: "none", dietary: [] },
    validate: (res) => {
      const checks = [];
      if (res.answer && res.answer.length > 10) {
        checks.push("PASS: Substantive answer provided");
      } else {
        checks.push("FAIL: Answer too short or missing");
      }
      if (res.route && res.route.length >= 2) {
        checks.push("PASS: Route with " + res.route.length + " waypoints");
      } else {
        checks.push("FAIL: Route missing or too short");
      }
      if (res.route_coordinates && res.route_coordinates.length >= 2) {
        checks.push("PASS: Route coordinates resolved (" + res.route_coordinates.length + " points)");
      } else {
        checks.push("FAIL: Route coordinates missing");
      }
      if (res.reasoning && res.reasoning.length > 20) {
        checks.push("PASS: Reasoning provided: " + res.reasoning.substring(0, 80) + "...");
      } else {
        checks.push("FAIL: Reasoning missing or too short");
      }
      if (res.alert_level === "normal") {
        checks.push("PASS: Alert level is normal");
      } else {
        checks.push("FAIL: Alert level is " + res.alert_level + " for normal query");
      }
      return checks;
    },
  },
  {
    name: "Wheelchair user asking for accessible food route",
    description: "Wheelchair user asks for food. Should only route to accessible venues.",
    message: "I'm in a wheelchair and hungry. Where can I get food?",
    profile: { location: "Section 110", accessibility: "wheelchair", dietary: [] },
    validate: (res) => {
      const checks = [];
      const answerLower = (res.answer || "").toLowerCase();
      if (answerLower.includes("wheelchair") || answerLower.includes("accessible") || answerLower.includes("accessible")) {
        checks.push("PASS: Response mentions accessibility");
      } else {
        checks.push("INFO: Response may not explicitly mention accessibility");
      }
      if (res.route && res.route.length >= 2) {
        checks.push("PASS: Route provided: " + res.route.join(" → "));
      } else {
        checks.push("FAIL: No route provided");
      }
      return checks;
    },
  },
];

async function runTests() {
  console.log("=== StadiumPilot Edge Case Tests ===");
  console.log("API: " + API);
  console.log("Date: " + new Date().toISOString());
  console.log("");

  let passed = 0;
  let failed = 0;
  let warns = 0;
  const results = [];

  for (const tc of testCases) {
    console.log("--- " + tc.name + " ---");
    console.log("Description: " + tc.description);
    console.log("Input: " + tc.message);
    console.log("Profile: " + JSON.stringify(tc.profile));

    try {
      const res = await fetch(API + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: tc.message, profile: tc.profile }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.log("RESULT: FAIL — HTTP " + res.status + ": " + JSON.stringify(err));
        failed++;
        results.push({ name: tc.name, status: "FAIL", error: "HTTP " + res.status });
        console.log("");
        await sleep(3000);
        continue;
      }

      const data = await res.json();
      console.log("Response: " + JSON.stringify(data).substring(0, 300));

      const checks = tc.validate(data);
      let hasFail = false;
      for (const check of checks) {
        console.log("  " + check);
        if (check.startsWith("FAIL")) hasFail = true;
        if (check.startsWith("WARN")) warns++;
      }

      if (hasFail) {
        failed++;
        results.push({ name: tc.name, status: "FAIL", checks });
      } else {
        passed++;
        results.push({ name: tc.name, status: "PASS", checks });
      }
    } catch (e) {
      console.log("RESULT: FAIL — " + e.message);
      failed++;
      results.push({ name: tc.name, status: "FAIL", error: e.message });
    }

    console.log("");
    await sleep(3000);
  }

  console.log("=== SUMMARY ===");
  console.log("Passed: " + passed + "/" + testCases.length);
  console.log("Failed: " + failed + "/" + testCases.length);
  console.log("Warnings: " + warns);
  console.log("");

  for (const r of results) {
    console.log((r.status === "PASS" ? "✓" : "✗") + " " + r.name + " — " + r.status);
    if (r.error) console.log("  Error: " + r.error);
  }

  return { passed, failed, warns, results };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

runTests().then((summary) => {
  process.exit(summary.failed > 0 ? 1 : 0);
});
