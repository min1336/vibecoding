"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-4xl mb-4 text-muted-foreground font-mono">!</div>
      <h2 className="text-xl font-semibold mb-2">문제가 발생했어요</h2>
      <p className="text-muted-foreground mb-6">잠시 후 다시 시도해주세요</p>
      <Button size="lg" onClick={reset}>다시 시도</Button>
    </div>
  );
}
