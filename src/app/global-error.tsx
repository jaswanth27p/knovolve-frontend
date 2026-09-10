"use client";
import { useEffect } from "react";

// Only catches errors thrown by the root layout itself (app/layout.tsx) —
// every other segment is covered by its own error.tsx. Next.js requires
// this to render its own <html>/<body> since it replaces the root layout
// when it triggers.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Please try again.</p>
        <button
          onClick={reset}
          className="rounded-md border border-black/10 px-4 py-2 text-sm dark:border-white/10"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
