"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <Button
      variant={liked ? "default" : "outline"}
      onClick={toggle}
      disabled={pending}
      className={liked ? "bg-primary/10 text-primary border-primary hover:bg-primary/20" : ""}
    >
      <span>{liked ? "\u2665" : "\u2661"}</span>
      {count}
    </Button>
  );
}
