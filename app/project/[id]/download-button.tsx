"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

export function DownloadButton({ projectId }: { projectId: string }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, [supabase.auth]);

  if (!loggedIn) {
    return (
      <Button
        variant="secondary"
        onClick={() =>
          supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          })
        }
      >
        로그인하고 다운로드
      </Button>
    );
  }

  return (
    <a href={`/api/download/${projectId}`} className={buttonVariants()}>
      다운로드
    </a>
  );
}
