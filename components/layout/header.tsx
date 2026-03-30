"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const AuthButton = dynamic(
  () => import("@/components/auth/auth-button").then((m) => m.AuthButton),
  { ssr: false, loading: () => <Skeleton className="h-8 w-20" /> }
);

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">V</span>ibeCoding
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "ghost" })}
            >
              Dashboard
            </Link>
            <Link href="/upload" className={buttonVariants()}>
              + Upload
            </Link>
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
