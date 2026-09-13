"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { buildActivitySeries } from "@/lib/activity";

const DAYS = 14;

// The theme tokens are `oklch(...)` (Tailwind v4), so use them directly —
// wrapping them in `hsl(...)` makes the value invalid and the browser falls
// back to black (invisible on the dark background).
const activityConfig = {
  assignments: { label: "Assignments", color: "var(--foreground)" },
} satisfies ChartConfig;

const masteryConfig = {
  chaptersCompleted: { label: "Chapters", color: "var(--muted-foreground)" },
  avgScore: { label: "Avg score", color: "var(--foreground)" },
} satisfies ChartConfig;

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <div className="h-40 px-2 pb-3">{children}</div>
    </Card>
  );
}

export function ActivitySection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity", DAYS],
    queryFn: () => api.getActivity(DAYS),
  });

  const events = data?.events;
  const days = data?.days;
  const series = useMemo(
    () => (events && days != null ? buildActivitySeries(events, days) : []),
    [events, days],
  );

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <div className="px-2 pb-3"><Skeleton className="h-40 w-full" /></div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Failed to load activity.</p>;
  }

  const hasData = series.some((b) => b.assignments > 0);
  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardDescription>Activity</CardDescription></CardHeader>
        <div className="px-6 pb-5 text-sm text-zinc-600 dark:text-zinc-400">
          No activity in the last 14 days.
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ChartCard title="Activity · assignments per day">
        <ChartContainer config={activityConfig} style={{ aspectRatio: "auto", height: "100%" }}>
          <BarChart data={series}>
            <CartesianGrid vertical={false} className="stroke-black/10 dark:stroke-white/10" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
            <Bar dataKey="assignments" fill="var(--color-assignments)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Mastery · chapters + avg score">
        <ChartContainer config={masteryConfig} style={{ aspectRatio: "auto", height: "100%" }}>
          <ComposedChart data={series}>
            <CartesianGrid vertical={false} className="stroke-black/10 dark:stroke-white/10" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="score" orientation="right" domain={[0, 1]} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
            <Bar yAxisId={0} dataKey="chaptersCompleted" fill="var(--color-chaptersCompleted)" radius={[3, 3, 0, 0]} />
            <Line yAxisId="score" dataKey="avgScore" type="monotone"
                  stroke="var(--color-avgScore)" strokeWidth={2} dot={{ r: 2, strokeWidth: 0 }} />
          </ComposedChart>
        </ChartContainer>
      </ChartCard>
    </div>
  );
}
