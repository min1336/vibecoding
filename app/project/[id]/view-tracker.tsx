"use client";

import { useEffect } from "react";

export function ViewTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    const key = `viewed_${projectId}`;
    if (sessionStorage.getItem(key)) return;

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });

    sessionStorage.setItem(key, "1");
  }, [projectId]);

  return null;
}
