import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { stadiumLayout } from "../stadium-data.js";
import {
  generateGateStatus,
  generateCrowdDensity,
  generateZoneCrowdDensity,
  getLiveData,
  buildStadiumStatePrompt,
} from "../live-data.js";

const VALID_CROWD_LEVELS = ["low", "medium", "high", "very_high"];

describe("generateGateStatus", () => {
  test("with no previous state, all gates start open", () => {
    const status = generateGateStatus();
    for (const gate of stadiumLayout.gates) {
      assert.equal(status[gate.id], true);
    }
  });

  test("never drops below 3 open gates, even evolving from a mostly-closed state (200 ticks)", () => {
    let status = generateGateStatus();
    for (let i = 0; i < 200; i++) {
      status = generateGateStatus(status);
      const openCount = Object.values(status).filter(Boolean).length;
      assert.ok(openCount >= 3, `only ${openCount} gates open after tick ${i}`);
    }
  });

  test("evolves from previous state rather than re-randomizing (most gates keep their state per tick)", () => {
    // With a 10% per-gate toggle chance, expected unchanged fraction per tick is 90%.
    // Over 300 ticks x 5 gates = 1500 samples; observing < 75% unchanged would be
    // a ~3-sigma-plus anomaly, so this is stable while still catching a
    // regenerate-from-scratch regression (which yields ~50-100% churn patterns).
    let status = generateGateStatus();
    let unchanged = 0;
    let total = 0;
    for (let i = 0; i < 300; i++) {
      const next = generateGateStatus(status);
      for (const gate of stadiumLayout.gates) {
        total++;
        if (next[gate.id] === status[gate.id]) unchanged++;
      }
      status = next;
    }
    assert.ok(unchanged / total > 0.75, `only ${(unchanged / total * 100).toFixed(1)}% of gate states carried over — generator is not stateful`);
  });

  test("returns a status for every gate", () => {
    const status = generateGateStatus();
    for (const gate of stadiumLayout.gates) {
      assert.ok(gate.id in status);
    }
  });
});

describe("crowd density generators", () => {
  test("generateCrowdDensity returns a valid crowd level for every section", () => {
    const density = generateCrowdDensity();
    for (const section of stadiumLayout.sections) {
      assert.ok(VALID_CROWD_LEVELS.includes(density[section.id]));
    }
  });

  test("generateZoneCrowdDensity returns a valid crowd level for all four zones", () => {
    const density = generateZoneCrowdDensity();
    for (const zone of ["north", "east", "south", "west"]) {
      assert.ok(VALID_CROWD_LEVELS.includes(density[zone]));
    }
  });

  test("crowd levels drift at most one step per tick — no low → very_high teleporting (200 ticks)", () => {
    let density = generateCrowdDensity();
    for (let i = 0; i < 200; i++) {
      const next = generateCrowdDensity(density);
      for (const section of stadiumLayout.sections) {
        const from = VALID_CROWD_LEVELS.indexOf(density[section.id]);
        const to = VALID_CROWD_LEVELS.indexOf(next[section.id]);
        assert.ok(Math.abs(to - from) <= 1, `${section.id} jumped ${density[section.id]} → ${next[section.id]} in one tick`);
      }
      density = next;
    }
  });
});

describe("getLiveData", () => {
  test("returns a fresh copy, not a reference to internal state", () => {
    const a = getLiveData();
    a.timestamp = 0;
    const b = getLiveData();
    assert.notEqual(b.timestamp, 0);
  });
});

describe("buildStadiumStatePrompt", () => {
  test("returns valid, parseable JSON for gate status, crowd density, and amenities", () => {
    const prompt = buildStadiumStatePrompt();
    assert.doesNotThrow(() => JSON.parse(prompt.gateStatus));
    assert.doesNotThrow(() => JSON.parse(prompt.crowdDensity));
    assert.doesNotThrow(() => JSON.parse(prompt.amenities));
  });

  test("gate status JSON is keyed by gate name with OPEN/CLOSED values", () => {
    const prompt = buildStadiumStatePrompt();
    const parsed = JSON.parse(prompt.gateStatus);
    for (const gate of stadiumLayout.gates) {
      assert.ok(["OPEN", "CLOSED"].includes(parsed[gate.name]));
    }
  });

  test("medical points string lists every first_aid/security amenity", () => {
    const prompt = buildStadiumStatePrompt();
    const medical = stadiumLayout.amenities.filter((a) => a.type === "first_aid" || a.type === "security");
    for (const point of medical) {
      assert.ok(prompt.medicalPoints.includes(point.name), `missing ${point.name} in medicalPoints`);
    }
  });

  test("never invents an amenity not present in stadiumLayout", () => {
    const prompt = buildStadiumStatePrompt();
    const listed = JSON.parse(prompt.amenities);
    assert.equal(listed.length, stadiumLayout.amenities.length);
    for (const item of listed) {
      assert.ok(stadiumLayout.amenities.some((a) => a.name === item.name));
    }
  });
});
