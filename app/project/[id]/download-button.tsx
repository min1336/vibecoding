"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

export function DownloadButton({ projectId }: { projectId: string }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, [supabase.auth]);

  if (!loggedIn) {
    return (
      <button
        onClick={() =>
          supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          })
        }
        className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
      >
        로그인하고 다운로드
      </button>
    );
  }

  return (
    <a
      href={`/api/download/${projectId}`}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
    >
      다운로드
    </a>
  );
}
