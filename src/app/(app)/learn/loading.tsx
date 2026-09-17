import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-10 px-6 py-10">
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-muted" />
        <div className="space-y-2">
          <Skeleton className="mx-auto h-9 w-72" />
          <Skeleton className="mx-auto h-4 w-80" />
        </div>
        <Card className="mx-auto w-full max-w-xl">
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-12 flex-1 rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl sm:w-28" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-28 rounded-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-8">
        <Skeleton className="h-5 w-28" />
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
