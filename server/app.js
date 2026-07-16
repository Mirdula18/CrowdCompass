import "dotenv/config";
import express from "express";
import cors from "cors";
import { stadiumLayout, gatesByName, amenitiesByName, sectionsByName } from "./stadium-data.js";
import { startLiveDataGenerator, getLiveData, buildStadiumStatePrompt } from "./live-data.js";

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.1-flash-lite";

// In production, restrict to the deployed frontend origin via FRONTEND_URL.
// Falls back to allowing all origins for local dev / same-origin deploys (Vercel/Netlify).
const FRONTEND_URL = process.env.FRONTEND_URL;
app.use(cors(FRONTEND_URL ? { origin: FRONTEND_URL } : {}));
// Requests are small (a chat message capped at 1000 chars + a fan profile);
// 16kb leaves generous headroom while rejecting oversized payloads early.
app.use(express.json({ limit: "16kb" }));

if (!GEMINI_API_KEY) {
  console.error("WARNING: GEMINI_API_KEY is not set. AI features will not work.");
}

const SYSTEM_PROMPT = `You are StadiumPilot, an AI concierge helping a fan navigate a stadium during a live event.

You will receive:
- The fan's message (in any language)
- The fan's profile: seat location, accessibility needs, dietary restrictions (if any)
- Live stadium state: gate status, crowd density per zone, amenity locations, medical/security points

Your job:
1. Detect the language the fan is writing in and respond in that same language.
2. Reason step by step over the live stadium state to produce the best route or answer.
3. If accessibility needs are set, they are a hard constraint, not a preference — never route
   through stairs-only paths for a wheelchair user.
4. If the message indicates a medical emergency or safety concern (dizziness, chest pain,
   can't find child, feeling unsafe), do NOT give a normal navigation answer. Set alert_level
   to "emergency" and route to the nearest medical/security point immediately.
5. If you don't have enough information to answer safely, ask ONE clarifying question instead
   of guessing.
6. Never invent an amenity, gate, or vendor that isn't in the provided stadium state.

Always respond ONLY in this JSON format, no extra text:

{
  "language_detected": "string",
  "answer": "string, in the fan's language",
  "reasoning": "string, plain-language explanation of why this answer/route was chosen",
  "route": ["array of waypoint labels, or empty array if not a navigation query"],
  "alert_level": "normal | caution | emergency",
  "clarifying_question": "string or null"
}`;

export function buildUserPrompt(message, profile) {
  const stadiumState = buildStadiumStatePrompt();
  return `Fan message: "${message}"

Fan profile:
- Accessibility needs: ${profile.accessibility || "none"}
- Dietary restrictions: ${profile.dietary ? profile.dietary.join(", ") : "none"}
- Current location: ${profile.location || "unknown"}

Live stadium state:
- Gate status: ${stadiumState.gateStatus}
- Crowd density by zone: ${stadiumState.crowdDensity}
- Nearby amenities: ${stadiumState.amenities}
- Nearest medical/security point: ${stadiumState.medicalPoints}`;
}

async function callGemini(userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if ((res.status === 429 || res.status === 503) && attempt < 2) {
        const delay = (attempt + 1) * 5000;
        console.log(`API ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(err)}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini API");
      return text;
    } catch (e) {
      if ((e.message?.includes("429") || e.message?.includes("503")) && attempt < 2) {
        const delay = (attempt + 1) * 5000;
        console.log(`Rate limited (catch), retrying in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
  throw new Error("All retries exhausted");
}

// POST /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, profile = {} } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: "Message is too long (max 1000 characters)" });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const userPrompt = buildUserPrompt(message, profile);
    const text = await callGemini(userPrompt);

    let parsed;
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        language_detected: "en",
        answer: text,
        reasoning: "Direct response from AI",
        route: [],
        alert_level: "normal",
        clarifying_question: null,
      };
    }

    if (parsed.route && parsed.route.length > 0) {
      parsed.route_coordinates = resolveRouteCoordinates(parsed.route);
    } else {
      parsed.route_coordinates = [];
    }

    res.json(parsed);
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "Failed to process request", detail: error.message });
  }
});

export function resolveRouteCoordinates(route) {
  const coordinates = [];
  for (const waypoint of route) {
    const lower = waypoint.toLowerCase();

    // Exact-name match first (O(1)) — covers the common case where the AI
    // echoes a real name verbatim. Falls back to a substring scan for fuzzier
    // labels the model might generate (e.g. "North Concourse").
    const gate = gatesByName.get(lower)
      || stadiumLayout.gates.find((g) => lower.includes(g.name.toLowerCase()) || lower.includes(g.zone));
    if (gate) { coordinates.push({ label: waypoint, lat: gate.lat, lng: gate.lng }); continue; }

    const amenity = amenitiesByName.get(lower)
      || stadiumLayout.amenities.find((a) => lower.includes(a.name.toLowerCase()) || lower.includes(a.type));
    if (amenity) { coordinates.push({ label: waypoint, lat: amenity.lat, lng: amenity.lng }); continue; }

    const section = sectionsByName.get(lower)
      || stadiumLayout.sections.find((s) => lower.includes(s.name.toLowerCase()) || lower.includes(s.id));
    if (section) {
      const z = stadiumLayout.zones[section.zone];
      coordinates.push({ label: waypoint, lat: z.lat, lng: z.lng });
      continue;
    }

    const zoneMatch = ["north", "east", "south", "west"].find((z) => lower.includes(z));
    if (zoneMatch) {
      const z = stadiumLayout.zones[zoneMatch];
      coordinates.push({ label: waypoint, lat: z.lat, lng: z.lng });
      continue;
    }

    coordinates.push({ label: waypoint, lat: stadiumLayout.zones.center.lat, lng: stadiumLayout.zones.center.lng });
  }
  return coordinates;
}

// Full payload: static layout + current live state. Clients need this once, on load.
app.get("/api/stadium-data", (req, res) => {
  res.json({ layout: stadiumLayout, live: getLiveData() });
});

// Light payload for polling: just the state that actually changes between ticks
// (gate status + crowd density, ~300 bytes vs ~5kb for the full layout).
app.get("/api/live-data", (req, res) => {
  res.json(getLiveData());
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

startLiveDataGenerator(5000);

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

// Exported (rather than listening here) so index.js can start the real server
// and tests can mount the app on an ephemeral port.
export default app;
