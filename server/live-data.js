// Synthetic live-data generator — crowd density + gate status evolve every few seconds.
// Both generators are stateful: each tick derives from the previous tick instead of
// re-randomizing from scratch, so the simulation behaves like a real venue (gates
// mostly stay as they are, crowds build and drain gradually) rather than teleporting
// between unrelated states every update.

import { stadiumLayout } from "./stadium-data.js";

const CROWD_LEVELS = ["low", "medium", "high", "very_high"];
const GATE_TOGGLE_PROBABILITY = 0.1; // per tick, per gate
const MIN_OPEN_GATES = 3; // never strand fans: at least this many gates stay open
const CROWD_DRIFT_PROBABILITY = 0.5; // per tick, per zone/section

function randomCrowdLevel() {
  return CROWD_LEVELS[Math.floor(Math.random() * CROWD_LEVELS.length)];
}

// Crowds change one level at a time — a zone at "low" can't jump straight to
// "very_high" in a single 5s tick.
function driftCrowdLevel(current) {
  const idx = CROWD_LEVELS.indexOf(current);
  if (idx === -1) return randomCrowdLevel();
  if (Math.random() >= CROWD_DRIFT_PROBABILITY) return current;
  const step = Math.random() < 0.5 ? -1 : 1;
  const next = Math.min(CROWD_LEVELS.length - 1, Math.max(0, idx + step));
  return CROWD_LEVELS[next];
}

export function generateCrowdDensity(previous = null) {
  const density = {};
  for (const section of stadiumLayout.sections) {
    density[section.id] = previous
      ? driftCrowdLevel(previous[section.id])
      : randomCrowdLevel();
  }
  return density;
}

export function generateZoneCrowdDensity(previous = null) {
  const density = {};
  const zones = ["north", "east", "south", "west"];
  for (const zone of zones) {
    density[zone] = previous ? driftCrowdLevel(previous[zone]) : randomCrowdLevel();
  }
  return density;
}

// Each gate keeps its current state with 90% probability and toggles with 10%,
// but the stadium never drops below MIN_OPEN_GATES open gates. With no previous
// state (first tick), all gates start open.
export function generateGateStatus(previous = null) {
  const status = {};
  for (const gate of stadiumLayout.gates) {
    const wasOpen = previous ? previous[gate.id] !== false : true;
    status[gate.id] = previous && Math.random() < GATE_TOGGLE_PROBABILITY ? !wasOpen : wasOpen;
  }

  const closedIds = Object.keys(status).filter((id) => !status[id]);
  let openCount = stadiumLayout.gates.length - closedIds.length;
  while (openCount < MIN_OPEN_GATES && closedIds.length > 0) {
    const reopenIdx = Math.floor(Math.random() * closedIds.length);
    status[closedIds[reopenIdx]] = true;
    closedIds.splice(reopenIdx, 1);
    openCount++;
  }
  return status;
}

// Live data store
let liveData = {
  timestamp: Date.now(),
  gateStatus: generateGateStatus(),
  crowdDensity: generateCrowdDensity(),
  zoneCrowdDensity: generateZoneCrowdDensity(),
};

// Update live data periodically
let updateInterval = null;

export function startLiveDataGenerator(intervalMs = 5000) {
  if (updateInterval) return;
  updateInterval = setInterval(() => {
    liveData = {
      timestamp: Date.now(),
      gateStatus: generateGateStatus(liveData.gateStatus),
      crowdDensity: generateCrowdDensity(liveData.crowdDensity),
      zoneCrowdDensity: generateZoneCrowdDensity(liveData.zoneCrowdDensity),
    };
  }, intervalMs);
  // Don't let this timer hold the process open on its own — app.listen()'s
  // socket already does that for a real server. Without this, importing
  // app.js (e.g. in tests) hangs the process forever after tests complete.
  updateInterval.unref();
}

export function stopLiveDataGenerator() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

export function getLiveData() {
  return { ...liveData };
}

// Amenities and medical points never change at runtime — only gate status and
// crowd density do. Build these once at module load instead of re-mapping/
// re-stringifying the same static arrays on every single /api/chat request.
const amenitiesStr = JSON.stringify(
  stadiumLayout.amenities.map((a) => ({
    type: a.type,
    name: a.name,
    location: a.zone,
    tags: a.tags,
    wheelchair_accessible: a.wheelchair_accessible,
  }))
);

const medicalPointsStr = stadiumLayout.amenities
  .filter((a) => a.type === "first_aid" || a.type === "security")
  .map((a) => `${a.name} (${a.zone})`)
  .join(", ");

// Build the live stadium state string for the AI prompt
export function buildStadiumStatePrompt() {
  const data = getLiveData();

  const gateStatusStr = JSON.stringify(
    Object.fromEntries(
      stadiumLayout.gates.map((g) => [g.name, data.gateStatus[g.id] ? "OPEN" : "CLOSED"])
    )
  );

  const crowdStr = JSON.stringify(
    Object.fromEntries(
      stadiumLayout.sections.map((s) => [s.name, data.crowdDensity[s.id]])
    )
  );

  return {
    gateStatus: gateStatusStr,
    crowdDensity: crowdStr,
    amenities: amenitiesStr,
    medicalPoints: medicalPointsStr,
    raw: data,
  };
}
