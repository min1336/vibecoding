"use client";

import { TOOLS, CATEGORIES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    <div className="flex flex-wrap items-center gap-2">
      {TOOLS.map((tool) => (
        <button key={tool} onClick={() => onToolChange(selectedTool === tool ? null : tool)}>
          <Badge variant={selectedTool === tool ? "default" : "outline"}>
            {tool}
          </Badge>
        </button>
      ))}
      <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
      {CATEGORIES.map((cat) => (
        <button key={cat} onClick={() => onCategoryChange(selectedCategory === cat ? null : cat)}>
          <Badge variant={selectedCategory === cat ? "default" : "outline"}>
            {cat}
          </Badge>
        </button>
      ))}
    </div>
  );
}
