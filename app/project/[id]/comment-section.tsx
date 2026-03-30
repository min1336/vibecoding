"use client";

import { useState, useEffect } from "react";
import type { Comment } from "@/lib/types";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function CommentSection({
  projectId, userId,
}: {
  projectId: string;
  userId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/comments?project_id=${projectId}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => setError("댓글을 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const submit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "댓글 작성 실패");
        return;
      }

      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setContent("");
    } catch {
      setError("댓글 작성 중 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: string) => {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold mb-4">Comments ({comments.length})</h3>

      {error && (
        <p className="text-destructive text-sm mb-4">{error}</p>
      )}

      {comments.length === 0 && !error && (
        <p className="text-muted-foreground text-sm mb-4">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
      )}

      <div className="space-y-0">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 py-3 border-b border-border/50">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={comment.profiles?.avatar_url || undefined} alt="" />
              <AvatarFallback className="text-xs">
                {comment.profiles?.display_name?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.profiles?.display_name || "Anonymous"}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                </span>
                {userId === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => deleteComment(comment.id)}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    삭제
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {userId ? (
        <div className="mt-6 flex gap-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 남겨보세요"
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            onClick={submit}
            disabled={!content.trim() || submitting}
            className="self-end"
          >
            {submitting ? "..." : "작성"}
          </Button>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          댓글을 남기려면 <a href="/?login=required" className="text-primary hover:underline">로그인</a>해주세요
        </p>
      )}
    </div>
  );
}
