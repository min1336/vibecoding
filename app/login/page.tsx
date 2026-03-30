"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Provider = "google";

const googleIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LoginPage() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, [supabase.auth, router]);

  const handleLogin = async (provider: Provider) => {
    setLoading(provider);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-primary">V</span>ibeCoding
          </h1>
          <p className="text-sm text-muted-foreground">
            소셜 계정으로 간편하게 시작하세요
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleLogin("google")}
            disabled={loading !== null}
            className="relative flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "google" ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-800 border-t-transparent" />
            ) : (
              googleIcon
            )}
            Google로 계속하기
          </button>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          계속 진행하면{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
            이용약관
          </Link>
          {" "}및{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
