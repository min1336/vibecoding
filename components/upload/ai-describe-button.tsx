"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AiDescribeButtonProps {
  title: string;
  tool: string;
  category: string;
  onGenerated: (text: string) => void;
}

export function AiDescribeButton({ title, tool, category, onGenerated }: AiDescribeButtonProps) {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, tool: tool || undefined, category: category || undefined }),
      });

      if (!res.ok || !res.body) {
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        onGenerated(text);
      }
    } catch {
      // 실패 시 무시
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={generate}
      disabled={loading || !title.trim()}
    >
      {loading ? "AI 생성 중..." : "AI로 설명 생성"}
    </Button>
  );
}
