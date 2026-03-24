"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const AuthButton = dynamic(
  () => import("@/components/auth/auth-button").then((m) => m.AuthButton),
  { ssr: false, loading: () => <div className="h-9 w-20 bg-zinc-800 animate-pulse rounded-lg" /> }
);

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            <span className="text-violet-500">V</span>ibeCoding
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="text-sm px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors duration-150"
            >
              + Upload
            </Link>
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
