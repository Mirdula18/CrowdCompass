// Synthetic live-data generator — crowd density + gate status updates every few seconds

import { stadiumLayout } from "./stadium-data.js";

const crowdLevels = ["low", "medium", "high", "very_high"];

function randomCrowdLevel() {
  return crowdLevels[Math.floor(Math.random() * crowdLevels.length)];
}

export function generateCrowdDensity() {
  const density = {};
  for (const section of stadiumLayout.sections) {
    density[section.id] = randomCrowdLevel();
  }
  return density;
}

export function generateZoneCrowdDensity() {
  const density = {};
  const zones = ["north", "east", "south", "west"];
  for (const zone of zones) {
    density[zone] = randomCrowdLevel();
  }
  return density;
}

export function generateGateStatus() {
  const status = {};
  for (const gate of stadiumLayout.gates) {
    // 90% chance gate stays in current state, 10% chance it toggles (but never close all)
    const openCount = Object.values(status).filter((s) => s).length;
    if (openCount < 3) {
      status[gate.id] = true;
    } else {
      status[gate.id] = Math.random() > 0.1;
    }
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
      gateStatus: generateGateStatus(),
      crowdDensity: generateCrowdDensity(),
      zoneCrowdDensity: generateZoneCrowdDensity(),
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
