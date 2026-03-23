"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PAGE_SIZE } from "@/lib/constants";
import type { Project } from "@/lib/types";
import { ProjectCard } from "./project-card";

export function LoadMoreButton({
  initialCount,
}: {
  initialCount: number;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [offset, setOffset] = useState(initialCount);
  const [hasMore, setHasMore] = useState(initialCount >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("projects")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data) {
      setProjects((prev) => [...prev, ...data]);
      setOffset((prev) => prev + data.length);
      setHasMore(data.length >= PAGE_SIZE);
    }
    setLoading(false);
  };

  return (
    <>
      {projects.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 mt-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "로딩 중..." : "더 보기"}
          </button>
        </div>
      )}
    </>
  );
}
