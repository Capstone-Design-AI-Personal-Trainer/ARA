import React from "react";
import "./Workout3DReaction.css";

export default function Workout3DReaction({
  reaction,
  message = "자세 좋아요!",
  label = "PERFECT",
  avatarImage,
  motion = "clap",
  persistent = false,
  showSpeech = true,
}) {
  if (!reaction) return null;

  return (
    <div
      className={`jy-3d-reaction jy-3d-reaction-${reaction.side || "right"}${persistent ? " jy-3d-reaction-persistent" : ""}`}
      key={reaction.id}
    >
      <div className={`jy-3d-stage jy-3d-motion-${motion}`} aria-hidden="true">
        <div className="jy-3d-character">
          <div className="jy-3d-head">
            {avatarImage ? (
              <img src={avatarImage} alt="" />
            ) : (
              <>
                <span className="jy-3d-eye left" />
                <span className="jy-3d-eye right" />
                <span className="jy-3d-smile" />
              </>
            )}
          </div>
          <div className="jy-3d-torso" />
          <div className="jy-3d-arm left" />
          <div className="jy-3d-arm right" />
          <div className="jy-3d-leg left" />
          <div className="jy-3d-leg right" />
        </div>
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
