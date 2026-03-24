"use client";

import { useState } from "react";

export function LikeButton({
  projectId, initialLiked, initialCount, isAuthenticated,
}: {
  projectId: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthenticated: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (!isAuthenticated) {
      window.location.href = "/?login=required";
      return;
    }
    if (pending) return;

    const prevLiked = liked;
    const prevCount = count;

    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setPending(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!res.ok) {
        setLiked(prevLiked);
        setCount(prevCount);
      }
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300
        ${liked
          ? "bg-violet-600/10 border-violet-500 text-violet-400"
          : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
    >
      <span className={liked ? "text-violet-400" : "text-zinc-500"}>
        {liked ? "♥" : "♡"}
      </span>
      {count}
    </button>
  );
}
