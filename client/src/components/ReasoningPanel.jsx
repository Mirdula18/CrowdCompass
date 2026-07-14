import React from "react";

export default function ReasoningPanel({ reasoning }) {
  if (!reasoning) return null;

  const { text, alert_level, clarifying_question, route } = reasoning;

  return (
    <div className="reasoning-panel">
      <div className="reasoning-header">
        <h4>Why This Route</h4>
        {alert_level && (
          <span className={`alert-badge ${alert_level}`}>{alert_level}</span>
        )}
      </div>

      {text && <p className="reasoning-text">{text}</p>}

      {clarifying_question && (
        <div className="clarifying-question">
          <strong>Clarification needed:</strong> {clarifying_question}
        </div>
      )}

      {route && route.length > 0 && (
        <div className="reasoning-route">
          {route.map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="route-arrow">→</span>}
              <span className="route-step">{step}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
