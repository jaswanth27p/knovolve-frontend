import { Skeleton } from "@/components/ui/skeleton";
import { ModuleDetailSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      <Skeleton className="h-4 w-32" />

      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <ModuleDetailSkeleton />

      <Skeleton className="h-4 w-40" />
    </div>
  );
}
