"use client";

import { useState } from "react";
import { MAX_TAGS_PER_PROJECT, MAX_TAG_LENGTH } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground ml-0.5">
              &times;
            </button>
          </Badge>
        ))}
      </div>
      {tags.length < MAX_TAGS_PER_PROJECT && (
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder={`태그 추가 (${tags.length}/${MAX_TAGS_PER_PROJECT})`}
          maxLength={MAX_TAG_LENGTH}
        />
      )}
    </div>
  );
}
