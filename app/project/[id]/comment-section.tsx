"use client";

import { useState, useEffect } from "react";
import type { Comment } from "@/lib/types";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";

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
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-zinc-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-zinc-800 rounded" />
              <div className="h-3 w-full bg-zinc-800 rounded" />
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
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {comments.length === 0 && !error && (
        <p className="text-zinc-500 text-sm mb-4">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
      )}

      <div className="space-y-0">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 py-3 border-b border-zinc-800/50">
            {comment.profiles?.avatar_url && (
              <img src={comment.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.profiles?.display_name || "Anonymous"}</span>
                <span className="text-xs text-zinc-600">
                  {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                </span>
                {userId === comment.user_id && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="ml-auto text-xs text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {userId ? (
        <div className="mt-6 flex gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 남겨보세요"
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none resize-none"
          />
          <button
            onClick={submit}
            disabled={!content.trim() || submitting}
            className="self-end px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "..." : "작성"}
          </button>
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">
          댓글을 남기려면 <a href="/?login=required" className="text-violet-400 hover:underline">로그인</a>해주세요
        </p>
      )}
    </div>
  );
}
