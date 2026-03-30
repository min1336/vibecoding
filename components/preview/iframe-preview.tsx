"use client";

import { useState } from "react";

export function IframePreview({ previewUrl }: { previewUrl: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex items-center justify-center aspect-video bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-500">
        프리뷰를 로드할 수 없습니다
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <iframe
        sandbox="allow-scripts"
        src={previewUrl}
        title="프로젝트 프리뷰"
        className="w-full h-full"
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
