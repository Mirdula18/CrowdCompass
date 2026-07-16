import { useState, useEffect, useCallback, useRef } from "react";
import Header from "./components/Header.jsx";
import StadiumMap from "./components/StadiumMap.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import ReasoningPanel from "./components/ReasoningPanel.jsx";
import DietarySelector from "./components/DietarySelector.jsx";
import "./App.css";

// Same-origin "/api" for local dev (the Vite proxy forwards it to the server).
// Set VITE_API_BASE_URL at build time when frontend and backend are separate
// origins, as they are on Render.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

// Matches the server's live-data generator tick (5s). The static layout is
// fetched once; only the small live payload (gate status + crowd density) is
// polled at this cadence.
const LIVE_POLL_INTERVAL_MS = 5000;

let nextMessageId = 0;
function makeMessage(role, content, extra = {}) {
  return { id: nextMessageId++, role, content, timestamp: Date.now(), ...extra };
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [layout, setLayout] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    location: "Section 101",
    accessibility: "none",
    dietary: [],
  });
  const [activeRoute, setActiveRoute] = useState(null);
  const [reasoning, setReasoning] = useState(null);
  const [error, setError] = useState(null);
  const [liveOk, setLiveOk] = useState(true);

  // The layout never changes, so it's fetched once (retried on later ticks if
  // the first attempt failed); only the live state is polled. Skipping the
  // setLive call when the timestamp hasn't advanced keeps the object identity
  // stable, so the memoized map doesn't re-render for a no-op poll.
  const layoutRef = useRef(null);
  const inFlightRef = useRef(false);
  const refreshData = useCallback(async () => {
    // Never stack requests: if a slow response outlives the poll interval,
    // skip this tick rather than piling a second request on top of it.
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      if (!layoutRef.current) {
        const res = await fetch(`${API_BASE}/stadium-data`);
        if (!res.ok) throw new Error("Failed to fetch stadium data");
        const data = await res.json();
        layoutRef.current = data.layout;
        setLayout(data.layout);
        setLive(data.live);
      } else {
        const res = await fetch(`${API_BASE}/live-data`);
        if (!res.ok) throw new Error("Failed to fetch live data");
        const data = await res.json();
        setLive((prev) => (prev && prev.timestamp === data.timestamp ? prev : data));
      }
      setLiveOk(true);
    } catch (err) {
      console.error("Stadium data fetch error:", err);
      setLiveOk(false);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      // No point polling while the tab is hidden — the map isn't visible,
      // and the next visible tick will catch up.
      if (!document.hidden) refreshData();
    }, LIVE_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Send a chat message
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading) return;

      setMessages((prev) => [...prev, makeMessage("user", text)]);
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, profile }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get response");
        }

        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          makeMessage("assistant", data.answer, { language_detected: data.language_detected }),
        ]);

        if (data.route_coordinates && data.route_coordinates.length > 0) {
          setActiveRoute(data.route_coordinates);
        } else {
          setActiveRoute(null);
        }

        setReasoning({
          text: data.reasoning,
          alert_level: data.alert_level,
          clarifying_question: data.clarifying_question,
          route: data.route,
        });
      } catch (err) {
        setError(err.message);
        setMessages((prev) => [
          ...prev,
          makeMessage("assistant", "Sorry, I encountered an error. Please try again."),
        ]);
      } finally {
        setLoading(false);
      }
    },
    [profile, loading]
  );

  return (
    <>
      <a href="#chat-input" className="skip-link">Skip to chat</a>
      <div className="app">
        <Header liveOk={liveOk} />
        <main className="main-layout">
          <div className="map-area" role="region" aria-label="Stadium map">
            <StadiumMap
              layout={layout}
              live={live}
              activeRoute={activeRoute}
              profile={profile}
            />
          </div>
          <div className="sidebar">
            <div className="profile-section">
              <label className="field-label" htmlFor="location-select">Your Location</label>
              <select
                id="location-select"
                className="location-select"
                value={profile.location}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, location: e.target.value }))
                }
              >
                {layout?.sections?.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.zone} zone)
                  </option>
                ))}
                {layout?.gates?.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>

              <label className="field-label" htmlFor="accessibility-select">Accessibility</label>
              <select
                id="accessibility-select"
                className="location-select"
                value={profile.accessibility}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, accessibility: e.target.value }))
                }
              >
                <option value="none">None</option>
                <option value="wheelchair">Wheelchair</option>
                <option value="visual_impairment">Visual Impairment</option>
                <option value="hearing_impairment">Hearing Impairment</option>
              </select>

              <DietarySelector
                selected={profile.dietary}
                onChange={(dietary) =>
                  setProfile((p) => ({ ...p, dietary }))
                }
              />
            </div>

            <ChatPanel
              messages={messages}
              onSend={sendMessage}
              loading={loading}
              error={error}
            />

            {reasoning && <ReasoningPanel reasoning={reasoning} />}
          </div>
        </main>
      </div>
    </>
  );
}
