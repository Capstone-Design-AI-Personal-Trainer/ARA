import React from "react";

function isYoutubeUrl(url = "") {
  return url.includes("youtube.com/embed/") || url.includes("youtube.com/watch") || url.includes("youtu.be/");
}

function toYoutubeEmbedUrl(url = "") {
  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }
    const videoId = parsed.searchParams.get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
}

export default function GuideVideo({ src, title = "운동 가이드 영상", onError }) {
  if (!src) {
    return null;
  }

  if (isYoutubeUrl(src)) {
    return (
      <iframe
        className="exercise-guide-video"
        title={title}
        src={toYoutubeEmbedUrl(src)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ width: "100%", aspectRatio: "16 / 9", border: 0, borderRadius: 18, background: "#000" }}
      />
    );
  }

  return (
    <video
      className="exercise-guide-video"
      src={src}
      controls
      playsInline
      preload="metadata"
      poster="https://via.placeholder.com/640x360/111111/ffffff?text=Guide+Video"
      onError={onError}
      style={{ width: "100%", borderRadius: 18, background: "#000" }}
    />
  );
}
