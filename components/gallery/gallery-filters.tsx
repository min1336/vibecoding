"use client";

import { TOOLS, CATEGORIES } from "@/lib/constants";

interface GalleryFiltersProps {
  selectedTool: string | null;
  selectedCategory: string | null;
  onToolChange: (tool: string | null) => void;
  onCategoryChange: (category: string | null) => void;
}

export function GalleryFilters({
  selectedTool, selectedCategory, onToolChange, onCategoryChange,
}: GalleryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TOOLS.map((tool) => (
        <button
          key={tool}
          onClick={() => onToolChange(selectedTool === tool ? null : tool)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150
            ${selectedTool === tool
              ? "bg-violet-600 text-white border border-violet-600"
              : "bg-transparent text-zinc-400 border border-zinc-700 hover:border-zinc-500"}`}
        >
          {tool}
        </button>
      ))}
      <span className="w-px h-6 bg-zinc-700 self-center mx-1 hidden sm:block" />
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(selectedCategory === cat ? null : cat)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150
            ${selectedCategory === cat
              ? "bg-violet-600 text-white border border-violet-600"
              : "bg-transparent text-zinc-400 border border-zinc-700 hover:border-zinc-500"}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
