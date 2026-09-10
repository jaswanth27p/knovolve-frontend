import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <SearchX className="size-8 text-zinc-500" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The page you are looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Button variant="outline" render={<Link href="/" />}>
        Back home
      </Button>
    </div>
  );
}
