import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  stadiumLayout,
  getAmenitiesByType,
  getNearestEmergencyPoint,
  getGateByZone,
  gatesByName,
  amenitiesByName,
  sectionsByName,
} from "../stadium-data.js";

describe("stadium data integrity", () => {
  test("every section references a zone that actually exists", () => {
    for (const section of stadiumLayout.sections) {
      assert.ok(
        stadiumLayout.zones[section.zone],
        `section ${section.id} references unknown zone "${section.zone}"`
      );
    }
  });

  test("every gate references a zone that actually exists", () => {
    for (const gate of stadiumLayout.gates) {
      assert.ok(
        stadiumLayout.zones[gate.zone],
        `gate ${gate.id} references unknown zone "${gate.zone}"`
      );
    }
  });

  test("no gate sits on the exact same coordinates as any zone center (map overlap regression)", () => {
    // Root cause of a real overlap bug: 3 of 4 gates were identical to their
    // zone center, guaranteeing collision with section/amenity markers there.
    for (const gate of stadiumLayout.gates) {
      for (const [zoneName, zoneCoords] of Object.entries(stadiumLayout.zones)) {
        const same = gate.lat === zoneCoords.lat && gate.lng === zoneCoords.lng;
        assert.ok(!same, `${gate.name} sits exactly on zone "${zoneName}"'s center — will overlap on the map`);
      }
    }
  });

  test("no two gates share identical coordinates", () => {
    const seen = new Set();
    for (const gate of stadiumLayout.gates) {
      const key = `${gate.lat},${gate.lng}`;
      assert.ok(!seen.has(key), `${gate.name} shares coordinates with another gate`);
      seen.add(key);
    }
  });

  test("wheelchair-accessible sections are never stairs_only", () => {
    for (const section of stadiumLayout.sections) {
      if (section.wheelchair_accessible) {
        assert.equal(section.stairs_only, false, `${section.name} is marked accessible but also stairs_only`);
      }
    }
  });
});

describe("getAmenitiesByType", () => {
  test("returns only amenities of the requested type", () => {
    const food = getAmenitiesByType("food");
    assert.ok(food.length > 0);
    assert.ok(food.every((a) => a.type === "food"));
  });

  test("returns an empty array for a type with no matches", () => {
    assert.deepEqual(getAmenitiesByType("nonexistent_type"), []);
  });
});

describe("getNearestEmergencyPoint", () => {
  test("returns a first_aid or security amenity", () => {
    const point = getNearestEmergencyPoint("north");
    assert.ok(point);
    assert.ok(["first_aid", "security"].includes(point.type));
  });

  test("prefers a point in the requested zone when one exists", () => {
    const point = getNearestEmergencyPoint("south");
    assert.equal(point.zone, "south");
  });
});

describe("getGateByZone", () => {
  test("returns an open gate in the requested zone", () => {
    const gate = getGateByZone("east");
    assert.ok(gate);
    assert.equal(gate.zone, "east");
    assert.equal(gate.open, true);
  });
});

describe("name lookup maps", () => {
  test("gatesByName is keyed by lowercased gate name", () => {
    assert.equal(gatesByName.get("north gate")?.id, "gate_n");
  });

  test("amenitiesByName is keyed by lowercased amenity name", () => {
    assert.equal(amenitiesByName.get("burger shack")?.id, "am_1");
  });

  test("sectionsByName is keyed by lowercased section name", () => {
    assert.equal(sectionsByName.get("section 101")?.id, "sec_101");
  });
});
