"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  compact = false,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/15 text-center dark:border-white/15",
        compact ? "px-6 py-8" : "px-6 py-14",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
        <Icon className="size-6 text-zinc-600 dark:text-zinc-300" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Button nativeButton={false} render={<Link href={actionHref} />}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}