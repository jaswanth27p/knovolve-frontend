export interface ActivityEvent {
  at: string;
  score: number;
  passed: boolean;
}

export interface ActivityBucket {
  key: string;        // YYYY-MM-DD (local)
  label: string;      // e.g. "Mon 8"
  assignments: number;
  chaptersCompleted: number;
  avgScore: number | null;
}

function toLocalKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DEFAULT_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
});

export function buildActivitySeries(
  events: ActivityEvent[],
  days: number,
  now: Date = new Date(),
): ActivityBucket[] {
  const buckets = new Map<string, ActivityBucket & { sum: number; count: number }>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = toLocalKey(d);
    buckets.set(key, {
      key,
      label: DEFAULT_LABEL.format(d),
      assignments: 0,
      chaptersCompleted: 0,
      avgScore: null,
      sum: 0,
      count: 0,
    });
  }

  for (const event of events) {
    const bucket = buckets.get(toLocalKey(new Date(event.at)));
    if (!bucket) continue;
    bucket.assignments += 1;
    if (event.passed) bucket.chaptersCompleted += 1;
    bucket.sum += event.score;
    bucket.count += 1;
  }

  return [...buckets.values()].map(({ sum, count, ...b }) => ({
    ...b,
    avgScore: count > 0 ? sum / count : null,
  }));
}
