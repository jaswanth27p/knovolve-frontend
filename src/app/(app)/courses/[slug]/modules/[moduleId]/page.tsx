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
      {isError && <p className="text-destructive">Failed to load module.</p>}
      {data && !mod && <p className="text-destructive">Module not found.</p>}
      {mod && (
        <>
          <Link
            href={`/courses/${params.slug}`}
            className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:underline dark:text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to course
          </Link>

          <div className="space-y-1">
            <h1 className="font-display text-3xl font-medium tracking-tight">{mod.title}</h1>
            <p className="text-sm text-muted-foreground">{mod.objective}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base font-medium">Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {mod.chapters.map((c, i) => (
                  <li key={c.id}>
                    <Link
                      href={`/courses/${params.slug}/chapters/${c.id}`}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="font-display text-brand-gradient shrink-0">{i + 1}.</span>
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
