import { describe, expect, it } from "vitest";
import { buildActivitySeries, type ActivityEvent } from "./activity";

function ev(at: Date, score: number, passed: boolean): ActivityEvent {
  return { at: at.toISOString(), score, passed };
}

describe("buildActivitySeries", () => {
  // Fixed local clock: Sept 10, 2026, noon local.
  const now = new Date(2026, 8, 10, 12, 0, 0);

  it("produces exactly `days` buckets ending at now", () => {
    const out = buildActivitySeries([], 14, now);
    expect(out).toHaveLength(14);
    expect(out[13].key).toBe("2026-09-10");
    expect(out[0].key).toBe("2026-08-28");
    // Keys follow the *local* calendar: an event at local midnight Sep 8
    // must land in the 2026-09-08 bucket even though its UTC date may differ.
    const midnight = new Date(2026, 8, 8, 0, 0, 0);
    expect(buildActivitySeries([ev(midnight, 0.5, false)], 14, now)[11].key).toBe("2026-09-08");
  });

  it("buckets events into their local calendar day", () => {
    // 4 p.m. local Sep 9 -> local key 2026-09-09 (its UTC ISO may be Sep 9 or 10).
    const local = new Date(2026, 8, 9, 16, 0, 0);
    const out = buildActivitySeries([ev(local, 0.9, true)], 14, now);
    const bucket = out.find((b) => b.key === "2026-09-09");
    expect(bucket).toBeDefined();
    expect(bucket!.assignments).toBe(1);
  });

  it("counts passed and computes avg score per day", () => {
    const day = new Date(2026, 8, 5, 10, 0, 0);
    const out = buildActivitySeries(
      [ev(day, 0.8, true), ev(day, 0.6, false)],
      14, now
    );
    const b = out.find((x) => x.key === "2026-09-05")!;
    expect(b.assignments).toBe(2);
    expect(b.chaptersCompleted).toBe(1);
    expect(b.avgScore).toBeCloseTo(0.7);
  });

  it("leaves avgScore null on empty days and drops out-of-window events", () => {
    const inWindow = new Date(2026, 8, 10, 9, 0, 0);
    const tooOld = new Date(2026, 7, 20, 9, 0, 0); // > 14 local days back
    const out = buildActivitySeries([ev(inWindow, 0.5, false), ev(tooOld, 0.9, true)], 14, now);
    expect(out.find((b) => b.key === "2026-09-09")!.avgScore).toBeNull();
    expect(out.every((b) => b.assignments === 0)).toBe(false);
    expect(out[0].assignments).toBe(0);
    expect(out.reduce((s, b) => s + b.assignments, 0)).toBe(1);
  });
});
