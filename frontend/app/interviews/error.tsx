"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function InterviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Interview page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-bg px-6 font-sans text-text">
      <div className="w-full max-w-md rounded-3xl border border-border bg-bg-surface p-10 text-center shadow-sm">
        <h1 className="font-display text-2xl font-black text-text">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm font-medium text-text-muted">
          We couldn&apos;t load your interview session. Your previous answers are
          safe — try again in a moment.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-accent px-6 py-3 text-xs font-bold uppercase tracking-widest text-bg-surface transition hover:brightness-110"
          >
            Try again
          </button>
          <Link
            href="/resume"
            className="rounded-xl border border-border px-6 py-3 text-xs font-bold uppercase tracking-widest text-text-muted transition hover:text-text"
          >
            Resume Optimizer
          </Link>
        </div>
      </div>
    </div>
  );
}
