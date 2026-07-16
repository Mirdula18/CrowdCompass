// HTTP integration tests — mount the real Express app on an ephemeral port and
// exercise the endpoints over actual HTTP. The /api/chat happy path needs a live
// Gemini key and is covered by tests/test-edge-cases.js at the repo root; here we
// cover everything that must work without one (health, data endpoints, and the
// chat endpoint's input validation).
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";
import { stadiumLayout } from "../stadium-data.js";

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

describe("GET /api/health", () => {
  test("returns 200 with status ok and a timestamp", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(typeof body.timestamp, "number");
  });
});

describe("GET /api/stadium-data", () => {
  test("returns the full layout plus current live state", async () => {
    const res = await fetch(`${baseUrl}/api/stadium-data`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.layout.sections.length, stadiumLayout.sections.length);
    assert.equal(body.layout.gates.length, stadiumLayout.gates.length);
    assert.ok(body.live.gateStatus);
    assert.ok(body.live.crowdDensity);
    assert.equal(typeof body.live.timestamp, "number");
  });
});

describe("GET /api/live-data", () => {
  test("returns only live state (no static layout) — the light polling payload", async () => {
    const res = await fetch(`${baseUrl}/api/live-data`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.gateStatus);
    assert.ok(body.crowdDensity);
    assert.ok(body.zoneCrowdDensity);
    assert.equal(typeof body.timestamp, "number");
    assert.equal(body.layout, undefined, "live-data payload should not include the static layout");
  });

  test("is dramatically smaller than the full stadium-data payload", async () => {
    const [liveRes, fullRes] = await Promise.all([
      fetch(`${baseUrl}/api/live-data`),
      fetch(`${baseUrl}/api/stadium-data`),
    ]);
    const liveSize = (await liveRes.text()).length;
    const fullSize = (await fullRes.text()).length;
    assert.ok(liveSize < fullSize / 4, `live payload (${liveSize}b) should be <25% of full payload (${fullSize}b)`);
  });
});

describe("POST /api/chat input validation", () => {
  async function postChat(body) {
    return fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  test("rejects a missing message with 400", async () => {
    const res = await postChat({ profile: {} });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  test("rejects an empty/whitespace message with 400", async () => {
    const res = await postChat({ message: "   ", profile: {} });
    assert.equal(res.status, 400);
  });

  test("rejects a non-string message with 400", async () => {
    const res = await postChat({ message: { evil: "object" }, profile: {} });
    assert.equal(res.status, 400);
  });

  test("rejects a message over 1000 characters with 400", async () => {
    const res = await postChat({ message: "a".repeat(1001), profile: {} });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /too long/i);
  });

  test("rejects an oversized body (over the 16kb json limit)", async () => {
    const res = await postChat({ message: "hi", profile: { padding: "x".repeat(20000) } });
    assert.equal(res.status, 413);
  });
});
