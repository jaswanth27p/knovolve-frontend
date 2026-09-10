import { Skeleton } from "@/components/ui/skeleton";
import { CourseListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-8 px-6 py-10">
      <Skeleton className="h-8 w-28" />

      <div className="space-y-3">
        <Skeleton className="h-6 w-28" />
        <CourseListSkeleton />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <CourseListSkeleton count={3} />
      </div>
    </div>
  );
}
