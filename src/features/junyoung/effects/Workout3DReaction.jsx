import React from "react";
import "./Workout3DReaction.css";

export default function Workout3DReaction({
  reaction,
  message = "?먯꽭 醫뗭븘??",
  label = "PERFECT",
  motion = "clap",
  persistent = false,
  showSpeech = true,
}) {
  if (!reaction) return null;

  const spriteMotion = "jump";
  const isAnimated = !persistent && (motion === "jump" || motion === "clap");

  return (
    <div
      className={`jy-3d-reaction jy-3d-reaction-${reaction.side || "right"}${persistent ? " jy-3d-reaction-persistent" : ""}`}
      key={reaction.id}
    >
      <div className={`jy-3d-stage jy-3d-motion-${spriteMotion}`} aria-hidden="true">
        <div className={`jy-sprite jy-sprite-${spriteMotion}${isAnimated ? " is-animated" : ""}`} />
      </div>
      {showSpeech ? (
        <div className="jy-3d-speech">
          <strong>{label}</strong>
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}
