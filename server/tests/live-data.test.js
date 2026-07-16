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
  test("never closes all gates (at least 3 stay open, run 200x to cover the random branch)", () => {
    for (let i = 0; i < 200; i++) {
      const status = generateGateStatus();
      const openCount = Object.values(status).filter(Boolean).length;
      assert.ok(openCount >= 3, `only ${openCount} gates open in one run`);
    }
  });

  test("returns a status for every gate", () => {
    const status = generateGateStatus();
    for (const gate of stadiumLayout.gates) {
      assert.ok(gate.id in status);
    }
  });
});

describe("generateCrowdDensity", () => {
  test("returns a valid crowd level for every section", () => {
    const density = generateCrowdDensity();
    for (const section of stadiumLayout.sections) {
      assert.ok(VALID_CROWD_LEVELS.includes(density[section.id]));
    }
  });
});

describe("generateZoneCrowdDensity", () => {
  test("returns a valid crowd level for all four zones", () => {
    const density = generateZoneCrowdDensity();
    for (const zone of ["north", "east", "south", "west"]) {
      assert.ok(VALID_CROWD_LEVELS.includes(density[zone]));
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
