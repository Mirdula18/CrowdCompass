import { memo } from "react";

// The status pill reflects actual fetch health reported by App — it doesn't
// claim "live" unconditionally while requests are failing.
function Header({ liveOk = true }) {
  return (
    <header className="header">
      <div className="header-logo">
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="StadiumPilot logo">
          <circle cx="14" cy="14" r="13" stroke="white" strokeWidth="2" />
          <path d="M7 14 L14 7 L21 14 L14 21 Z" fill="white" opacity="0.9" />
          <circle cx="14" cy="14" r="3" fill="currentColor" />
        </svg>
        StadiumPilot
      </div>
      <div className="header-status" role="status">
        <span className={`status-dot ${liveOk ? "" : "status-dot--warn"}`} aria-hidden="true"></span>
        {liveOk ? "Live Data Active" : "Reconnecting…"}
      </div>
    </header>
  );
}

export default memo(Header);
