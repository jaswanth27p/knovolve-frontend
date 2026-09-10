import { Skeleton } from "@/components/ui/skeleton";
import { ChapterContentSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-8 px-6 py-10 pb-20">
      <Skeleton className="h-4 w-32" />
      <ChapterContentSkeleton />
    </div>
  );
}
