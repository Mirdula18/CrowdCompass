import React, { useState, useRef, useEffect } from "react";

const SAMPLE_QUERIES = [
  "Where is the nearest restroom?",
  "I'm in a wheelchair, how do I get to Section 104?",
  "Is there nut-free food near me?",
  "Je cherche le stand de nourriture le plus proche",
  "I feel dizzy and can't breathe well",
  "Which gate is least crowded?",
];

export default function ChatPanel({ messages, onSend, loading, error }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleSampleClick = (query) => {
    if (!loading) {
      onSend(query);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <h3>Welcome to StadiumPilot</h3>
            <p>Ask me anything about navigating the stadium — directions, food, accessibility, or safety.</p>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 280 }}>
              {SAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSampleClick(q)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #dadce0",
                    borderRadius: 8,
                    background: "white",
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "left",
                    color: "#5f6368",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.target.style.borderColor = "#1a73e8")}
                  onMouseLeave={(e) => (e.target.style.borderColor = "#dadce0")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              {msg.content}
              {msg.language_detected && msg.language_detected !== "en" && (
                <span className="lang-tag">Detected: {msg.language_detected}</span>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="chat-msg assistant" style={{ opacity: 0.6 }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about directions, food, accessibility..."
          disabled={loading}
        />
        <button className="chat-send" type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
