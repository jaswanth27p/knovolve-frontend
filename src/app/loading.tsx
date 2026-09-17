import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Skeleton className="h-7 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
        <div className="max-w-xl space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-4/5" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}
