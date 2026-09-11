"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleDetailSkeleton } from "@/components/skeletons";
import { api } from "@/lib/api";

export default function ModuleDetailPage() {
  const params = useParams<{ slug: string; moduleId: string }>();
  const moduleId = Number(params.moduleId);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["course", params.slug],
    queryFn: () => api.getCourse(params.slug),
  });

  const mod = data?.modules.find((m) => m.id === moduleId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 px-6 py-10">
      {isLoading && <ModuleDetailSkeleton />}
      {isError && <p className="text-red-600">Failed to load module.</p>}
      {data && !mod && <p className="text-red-600">Module not found.</p>}
      {mod && (
        <>
          <Link
            href={`/courses/${params.slug}`}
            className="flex w-fit items-center gap-1 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            <ArrowLeft className="size-4" />
            Back to course
          </Link>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{mod.title}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{mod.objective}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mod.chapters.map((c, i) => (
                  <li key={c.id}>
                    <Link
                      href={`/courses/${params.slug}/chapters/${c.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <span className="text-zinc-400 dark:text-zinc-500">{i + 1}.</span>
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {!mod.is_additional && (
            <Button className="w-fit" nativeButton={false} render={<Link href={`/courses/${params.slug}/modules/${mod.id}/assignment`} />}>
              Module assignment
            </Button>
          )}
        </>
      )}
    </div>
  );
}
