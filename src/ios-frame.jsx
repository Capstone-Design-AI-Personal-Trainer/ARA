import React from "react";

export function IOSFrame({ children, dark = false }) {
  return (
    <div className={`ios-frame ${dark ? "ios-frame-dark" : ""}`}>
      <div className="ios-dynamic-island" />
      <div className="ios-status-bar">
        <span className="ios-time">9:41</span>
        <div className="ios-status-icons" aria-hidden="true">
          <span className="dot" />
          <span className="dot" />
          <span className="battery" />
        </div>
      </div>
      <div className="ios-content">{children}</div>
      <div className="home-indicator" />
    </div>
  );
}
