"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { CourseListSkeleton } from "@/components/skeletons";
import { CourseFilterBar } from "@/components/course-filter-bar";
import { Pagination } from "@/components/pagination";
import { BookOpen, Globe } from "lucide-react";
import { api, CourseSortField, SortOrder, TrackedCourse } from "@/lib/api";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const PAGE_SIZE = 10;

function CourseLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <Link href={`/courses/${slug}`}>{children}</Link>;
}

const MY_SORT_OPTIONS = [
  { value: "date" as const, label: "Recently opened", order: "desc" as const },
  { value: "name" as const, label: "Name (A-Z)", order: "asc" as const },
  { value: "progress" as const, label: "Progress (high to low)", order: "desc" as const },
];

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [removeErrors, setRemoveErrors] = useState<Record<number, string>>({});

  // My courses filters — independent from Public courses below.
  const [mySearchInput, setMySearchInput] = useState("");
  const mySearch = useDebouncedValue(mySearchInput, 300);
  const [myStatus, setMyStatus] = useState<"all" | "in_progress" | "completed">("all");
  const [mySort, setMySort] = useState<CourseSortField>("date");
  const [myOrder, setMyOrder] = useState<SortOrder>("desc");
  const [myPage, setMyPage] = useState(1);
  // Reset to page 1 whenever a filter changes — done during render (React's
  // documented "adjusting state" pattern) rather than in an effect, so it
  // doesn't cost an extra commit.
  const myFiltersKey = `${mySearch}|${myStatus}|${mySort}|${myOrder}`;
  const [myPrevFiltersKey, setMyPrevFiltersKey] = useState(myFiltersKey);
  if (myFiltersKey !== myPrevFiltersKey) {
    setMyPrevFiltersKey(myFiltersKey);
    setMyPage(1);
  }

  // Public courses filters — independent from My courses above. Public
  // courses have no progress field, so "progress" sort never applies here.
  const [pubSearchInput, setPubSearchInput] = useState("");
  const pubSearch = useDebouncedValue(pubSearchInput, 300);
  const [pubSort, setPubSort] = useState<Exclude<CourseSortField, "progress">>("date");
  const [pubOrder, setPubOrder] = useState<SortOrder>("desc");
  const [pubPage, setPubPage] = useState(1);
  const pubFiltersKey = `${pubSearch}|${pubSort}|${pubOrder}`;
  const [pubPrevFiltersKey, setPubPrevFiltersKey] = useState(pubFiltersKey);
  if (pubFiltersKey !== pubPrevFiltersKey) {
    setPubPrevFiltersKey(pubFiltersKey);
    setPubPage(1);
  }

  const myParams = {
    search: mySearch || undefined,
    status: myStatus === "all" ? undefined : myStatus,
    sort: mySort,
    order: myOrder,
    page: myPage,
    limit: PAGE_SIZE,
  };
  const myCourses = useQuery({
    queryKey: ["myCourses", myParams],
    queryFn: () => api.getMyCourses(myParams),
  });

  const pubParams = {
    search: pubSearch || undefined,
    sort: pubSort,
    order: pubOrder,
    page: pubPage,
    limit: PAGE_SIZE,
  };
  const publicCourses = useQuery({
    queryKey: ["publicCourses", pubParams],
    queryFn: () => api.getPublicCourses(pubParams),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteMyCourse(id),
    onMutate: (id) => {
      setPendingIds((prev) => new Set(prev).add(id));
      setRemoveErrors((prev) => {
        const { [id]: _omit, ...rest } = prev;
        return rest;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myCourses"] });
      queryClient.invalidateQueries({ queryKey: ["publicCourses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err, id) => {
      setRemoveErrors((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "Failed to remove course.",
      }));
    },
    onSettled: (_data, _err, id) => {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  });

  function MyCard({ c }: { c: TrackedCourse }) {
    const isPending = pendingIds.has(c.id);
    const error = removeErrors[c.id];
    return (
      <Card>
        <CardHeader className="pb-2">
          <CourseLink slug={c.topic_slug}>
            <CardTitle className="text-base hover:underline">{c.topic_raw}</CardTitle>
          </CourseLink>
          <CardDescription>
            {c.module_count} modules · {c.chapter_count} chapters
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Badge variant={c.status === "completed" ? "secondary" : "default"}>{c.status}</Badge>
          {c.content_ready && <span className="text-xs text-zinc-500">content ready</span>}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-zinc-500"
            disabled={isPending}
            onClick={() => remove.mutate(c.id)}
          >
            Remove
          </Button>
        </CardContent>
        {error && <p className="px-6 pb-3 text-sm text-red-600">Failed to remove course: {error}</p>}
      </Card>
    );
  }

  const myHasFilters = mySearch !== "" || myStatus !== "all";
  const pubHasFilters = pubSearch !== "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-8 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My courses</h2>
        <CourseFilterBar
          searchPlaceholder="Search my courses…"
          search={mySearchInput}
          onSearchChange={setMySearchInput}
          sort={mySort}
          order={myOrder}
          onSortChange={(sort, order) => {
            setMySort(sort);
            setMyOrder(order);
          }}
          sortOptions={MY_SORT_OPTIONS}
          statusFilter={myStatus}
          onStatusFilterChange={setMyStatus}
        />
        {myCourses.isLoading && <CourseListSkeleton />}
        {myCourses.isError && <p className="text-red-600">Failed to load courses.</p>}
        {myCourses.data?.items.length === 0 && !myHasFilters && (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Generate your first course from any topic you want to learn."
            actionLabel="Create a course"
            actionHref="/learn"
            compact
          />
        )}
        {myCourses.data?.items.length === 0 && myHasFilters && (
          <EmptyState
            icon={BookOpen}
            title="No matching courses"
            description="Try a different search term or clear the status filter."
            compact
          />
        )}
        <div className="space-y-2">
          {myCourses.data?.items.map((c) => <MyCard key={c.id} c={c} />)}
        </div>
        {myCourses.data && (
          <Pagination page={myCourses.data.page} totalPages={myCourses.data.total_pages} onPageChange={setMyPage} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Public courses</h2>
        <CourseFilterBar
          searchPlaceholder="Search public courses…"
          search={pubSearchInput}
          onSearchChange={setPubSearchInput}
          sort={pubSort}
          order={pubOrder}
          onSortChange={(sort, order) => {
            setPubSort(sort as Exclude<CourseSortField, "progress">);
            setPubOrder(order);
          }}
        />
        {publicCourses.isLoading && <CourseListSkeleton count={3} />}
        {publicCourses.isError && <p className="text-red-600">Failed to load public courses.</p>}
        {publicCourses.data?.items.length === 0 && !pubHasFilters && (
          <EmptyState
            icon={Globe}
            title="No public courses available"
            description="Courses become public here once they're generated."
            compact
          />
        )}
        {publicCourses.data?.items.length === 0 && pubHasFilters && (
          <EmptyState
            icon={Globe}
            title="No matching courses"
            description="Try a different search term."
            compact
          />
        )}
        <div className="space-y-2">
          {publicCourses.data?.items.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <CourseLink slug={c.topic_slug}>
                  <CardTitle className="text-base hover:underline">{c.topic_raw}</CardTitle>
                </CourseLink>
                <CardDescription>
                  {c.module_count} modules · {c.chapter_count} chapters
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        {publicCourses.data && (
          <Pagination
            page={publicCourses.data.page}
            totalPages={publicCourses.data.total_pages}
            onPageChange={setPubPage}
          />
        )}
      </section>
    </div>
  );
}
