import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  stadiumLayout,
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

  test("every amenity references a zone that actually exists", () => {
    for (const amenity of stadiumLayout.amenities) {
      assert.ok(
        stadiumLayout.zones[amenity.zone],
        `amenity ${amenity.id} references unknown zone "${amenity.zone}"`
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

  test("at least one first_aid and one security point exist (emergency routing depends on them)", () => {
    const types = new Set(stadiumLayout.amenities.map((a) => a.type));
    assert.ok(types.has("first_aid"), "no first_aid amenity in stadium data");
    assert.ok(types.has("security"), "no security amenity in stadium data");
  });

  test("all ids are unique across sections, gates, and amenities", () => {
    const ids = [
      ...stadiumLayout.sections.map((s) => s.id),
      ...stadiumLayout.gates.map((g) => g.id),
      ...stadiumLayout.amenities.map((a) => a.id),
    ];
    assert.equal(new Set(ids).size, ids.length, "duplicate id found in stadium layout");
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

  test("lookup maps cover every entity exactly once", () => {
    assert.equal(gatesByName.size, stadiumLayout.gates.length);
    assert.equal(amenitiesByName.size, stadiumLayout.amenities.length);
    assert.equal(sectionsByName.size, stadiumLayout.sections.length);
  });
});
