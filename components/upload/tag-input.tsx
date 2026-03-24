"use client";

import { useState } from "react";
import { MAX_TAGS_PER_PROJECT, MAX_TAG_LENGTH } from "@/lib/constants";

export function TagInput({ name }: { name: string }) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addTag = () => {
    const normalized = input.toLowerCase().trim();
    if (!normalized || normalized.length > MAX_TAG_LENGTH) return;
    if (tags.includes(normalized) || tags.length >= MAX_TAGS_PER_PROJECT) return;
    setTags([...tags, normalized]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-zinc-500 hover:text-zinc-300">&times;</button>
          </span>
        ))}
      </div>
      {tags.length < MAX_TAGS_PER_PROJECT && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder={`태그 추가 (${tags.length}/${MAX_TAGS_PER_PROJECT})`}
          maxLength={MAX_TAG_LENGTH}
          className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      )}
    </div>
  );
}
