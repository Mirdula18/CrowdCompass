import React from "react";

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="13" stroke="white" strokeWidth="2" />
          <path d="M7 14 L14 7 L21 14 L14 21 Z" fill="white" opacity="0.9" />
          <circle cx="14" cy="14" r="3" fill="currentColor" />
        </svg>
        StadiumPilot
      </div>
      <div className="header-status">
        <span className="status-dot"></span>
        Live Data Active
      </div>
    </header>
  );
}
