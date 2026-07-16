import React, { useState, useRef, useEffect, memo } from "react";

const SAMPLE_QUERIES = [
  "Where is the nearest restroom?",
  "I'm in a wheelchair, how do I get to Section 104?",
  "Is there nut-free food near me?",
  "Je cherche le stand de nourriture le plus proche",
  "I feel dizzy and can't breathe well",
  "Which gate is least crowded?",
];

function ChatPanel({ messages, onSend, loading, error }) {
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
      <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat conversation">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <h3>Welcome to StadiumPilot</h3>
            <p>Ask me anything about navigating the stadium — directions, food, accessibility, or safety.</p>
            <div className="sample-queries">
              {SAMPLE_QUERIES.map((q, i) => (
                <button key={i} className="sample-query-btn" onClick={() => handleSampleClick(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`} lang={msg.language_detected || undefined}>
              {msg.content}
              {msg.language_detected && msg.language_detected !== "en" && (
                <span className="lang-tag">Detected: {msg.language_detected}</span>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="chat-msg assistant chat-msg-loading">
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <label htmlFor="chat-input" className="sr-only">
          Ask StadiumPilot a question
        </label>
        <input
          id="chat-input"
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

export default memo(ChatPanel);
