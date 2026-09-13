import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-10 px-6 py-10">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-muted" />
        <div className="space-y-2">
          <Skeleton className="mx-auto h-9 w-72" />
          <Skeleton className="mx-auto h-4 w-80" />
        </div>
        <Card className="mx-auto w-full max-w-xl">
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-7 w-28 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-52" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="size-9 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
