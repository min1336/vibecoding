"use client";

import { useState, useCallback } from "react";
import { ProjectGrid } from "@/components/gallery/project-grid";
import { GalleryFilters } from "@/components/gallery/gallery-filters";
import { SearchBar } from "@/components/gallery/search-bar";
import { useRouter, useSearchParams } from "next/navigation";
import type { Project } from "@/lib/types";

export function GalleryClient({
  initialProjects,
  initialSort,
}: {
  initialProjects: Project[];
  initialSort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState(initialSort);
  const selectedTool = searchParams.get("tool");
  const selectedCategory = searchParams.get("category");

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Discover Projects</h1>
        <p className="mt-1 text-zinc-400 text-sm">
          AI로 만든 프로젝트들을 탐색하고, 체험하고, 영감을 받으세요
        </p>
      </div>

      {/* Sort tabs + Search */}
      <div className="flex items-center gap-6 mb-4">
        {["new", "popular"].map((s) => (
          <button
            key={s}
            onClick={() => { setSort(s); updateParams({ sort: s === "new" ? null : s }); }}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-150
              ${sort === s ? "text-white border-violet-500" : "text-zinc-400 border-transparent hover:text-zinc-200"}`}
          >
            {s === "new" ? "New" : "Popular"}
          </button>
        ))}
        <div className="ml-auto">
          <SearchBar onSearch={(q) => updateParams({ q: q || null })} />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <GalleryFilters
          selectedTool={selectedTool}
          selectedCategory={selectedCategory}
          onToolChange={(tool) => updateParams({ tool })}
          onCategoryChange={(category) => updateParams({ category })}
        />
      </div>

      {/* Grid */}
      <ProjectGrid projects={initialProjects} />
    </div>
  );
}
