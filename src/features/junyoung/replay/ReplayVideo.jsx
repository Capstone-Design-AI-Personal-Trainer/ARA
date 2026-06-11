import React from "react";

export default function ReplayVideo({ src }) {
  if (!src) {
    return <p className="junyoung-replay-empty">다시보기 영상이 없습니다.</p>;
  }

  return (
    <video className="junyoung-replay-video" src={src} controls playsInline />
  );
}
