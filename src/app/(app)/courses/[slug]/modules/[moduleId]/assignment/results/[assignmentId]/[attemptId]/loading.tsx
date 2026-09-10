import { Skeleton } from "@/components/ui/skeleton";
import { ResultsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      <Skeleton className="h-8 w-28" />
      <ResultsSkeleton />
      <Skeleton className="h-9 w-32" />
    </div>
  );
}
