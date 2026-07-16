import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveRouteCoordinates, buildUserPrompt } from "../app.js";
import { stadiumLayout } from "../stadium-data.js";

describe("resolveRouteCoordinates", () => {
  test("resolves an exact gate name to that gate's coordinates", () => {
    const [point] = resolveRouteCoordinates(["North Gate"]);
    const gate = stadiumLayout.gates.find((g) => g.name === "North Gate");
    assert.equal(point.lat, gate.lat);
    assert.equal(point.lng, gate.lng);
    assert.equal(point.label, "North Gate");
  });

  test("resolves an exact amenity name to that amenity's coordinates", () => {
    const [point] = resolveRouteCoordinates(["Burger Shack"]);
    const amenity = stadiumLayout.amenities.find((a) => a.name === "Burger Shack");
    assert.equal(point.lat, amenity.lat);
    assert.equal(point.lng, amenity.lng);
  });

  test("resolves an exact section name to that section's zone center", () => {
    const [point] = resolveRouteCoordinates(["Section 104"]);
    const section = stadiumLayout.sections.find((s) => s.name === "Section 104");
    const zone = stadiumLayout.zones[section.zone];
    assert.equal(point.lat, zone.lat);
    assert.equal(point.lng, zone.lng);
  });

  test("a fuzzy label mentioning a zone name matches that zone's gate (checked before the plain zone fallback)", () => {
    const [point] = resolveRouteCoordinates(["North Concourse"]);
    const gate = stadiumLayout.gates.find((g) => g.name === "North Gate");
    assert.equal(point.lat, gate.lat);
    assert.equal(point.lng, gate.lng);
  });

  test("falls back to the stadium center for a completely unmatched label", () => {
    const [point] = resolveRouteCoordinates(["Somewhere Made Up"]);
    assert.equal(point.lat, stadiumLayout.zones.center.lat);
    assert.equal(point.lng, stadiumLayout.zones.center.lng);
  });

  test("resolves multiple waypoints in order, preserving each original label", () => {
    const route = ["Section 101", "North Gate"];
    const points = resolveRouteCoordinates(route);
    assert.equal(points.length, 2);
    assert.equal(points[0].label, "Section 101");
    assert.equal(points[1].label, "North Gate");
  });

  test("returns an empty array for an empty route", () => {
    assert.deepEqual(resolveRouteCoordinates([]), []);
  });
});

describe("buildUserPrompt", () => {
  test("includes the fan's message verbatim", () => {
    const prompt = buildUserPrompt("Where is the nearest restroom?", {});
    assert.ok(prompt.includes("Where is the nearest restroom?"));
  });

  test("defaults accessibility, dietary, and location when profile fields are missing", () => {
    const prompt = buildUserPrompt("hello", {});
    assert.ok(prompt.includes("Accessibility needs: none"));
    assert.ok(prompt.includes("Dietary restrictions: none"));
    assert.ok(prompt.includes("Current location: unknown"));
  });

  test("includes profile fields when present", () => {
    const prompt = buildUserPrompt("hello", {
      accessibility: "wheelchair",
      dietary: ["nut-free", "vegan"],
      location: "Section 108",
    });
    assert.ok(prompt.includes("Accessibility needs: wheelchair"));
    assert.ok(prompt.includes("Dietary restrictions: nut-free, vegan"));
    assert.ok(prompt.includes("Current location: Section 108"));
  });

  test("includes live stadium state (gate status, crowd density, amenities, medical points)", () => {
    const prompt = buildUserPrompt("hello", {});
    assert.match(prompt, /Gate status: /);
    assert.match(prompt, /Crowd density by zone: /);
    assert.match(prompt, /Nearby amenities: /);
    assert.match(prompt, /Nearest medical\/security point: /);
  });
});
