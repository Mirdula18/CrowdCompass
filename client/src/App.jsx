import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header.jsx";
import StadiumMap from "./components/StadiumMap.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import ReasoningPanel from "./components/ReasoningPanel.jsx";
import DietarySelector from "./components/DietarySelector.jsx";
import "./App.css";

const API_BASE = "/api";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [stadiumData, setStadiumData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    location: "Section 101",
    accessibility: "none",
    dietary: [],
  });
  const [activeRoute, setActiveRoute] = useState(null);
  const [reasoning, setReasoning] = useState(null);
  const [error, setError] = useState(null);

  // Fetch stadium data on mount and periodically
  const fetchStadiumData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stadium-data`);
      if (!res.ok) throw new Error("Failed to fetch stadium data");
      const data = await res.json();
      setStadiumData(data);
    } catch (err) {
      console.error("Stadium data fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchStadiumData();
    const interval = setInterval(fetchStadiumData, 5000);
    return () => clearInterval(interval);
  }, [fetchStadiumData]);

  // Send a chat message
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading) return;

      const userMsg = { role: "user", content: text, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
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

        const aiMsg = {
          role: "assistant",
          content: data.answer,
          language_detected: data.language_detected,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);

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
        const errMsg = {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [profile, loading]
  );

  return (
    <div className="app">
      <Header />
      <div className="main-layout">
        <div className="map-area">
          <StadiumMap
            stadiumData={stadiumData}
            activeRoute={activeRoute}
            profile={profile}
          />
        </div>
        <div className="sidebar">
          <div className="profile-section">
            <label className="field-label">Your Location</label>
            <select
              className="location-select"
              value={profile.location}
              onChange={(e) =>
                setProfile((p) => ({ ...p, location: e.target.value }))
              }
            >
              {stadiumData?.layout?.sections?.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.zone} zone)
                </option>
              ))}
              {stadiumData?.layout?.gates?.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>

            <label className="field-label">Accessibility</label>
            <select
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
      </div>
    </div>
  );
}
