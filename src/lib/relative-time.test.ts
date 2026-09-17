import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relative-time";

const NOW = new Date("2026-09-17T12:00:00.000Z").getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("reads recent timestamps as just now", () => {
    expect(formatRelativeTime(ago(0), NOW)).toBe("just now");
    expect(formatRelativeTime(ago(30 * SECOND), NOW)).toBe("just now");
  });

  it("formats minutes", () => {
    expect(formatRelativeTime(ago(MINUTE), NOW)).toBe("1m ago");
    expect(formatRelativeTime(ago(12 * MINUTE), NOW)).toBe("12m ago");
  });

  it("formats hours", () => {
    expect(formatRelativeTime(ago(HOUR), NOW)).toBe("1h ago");
    expect(formatRelativeTime(ago(5 * HOUR), NOW)).toBe("5h ago");
  });

  it("formats days", () => {
    expect(formatRelativeTime(ago(DAY), NOW)).toBe("1d ago");
    expect(formatRelativeTime(ago(6 * DAY), NOW)).toBe("6d ago");
  });

  it("formats weeks, months and years", () => {
    expect(formatRelativeTime(ago(14 * DAY), NOW)).toBe("2w ago");
    expect(formatRelativeTime(ago(60 * DAY), NOW)).toBe("2mo ago");
    expect(formatRelativeTime(ago(400 * DAY), NOW)).toBe("1y ago");
  });

  it("clamps future timestamps to just now and rejects invalid input", () => {
    expect(formatRelativeTime(new Date(NOW + HOUR).toISOString(), NOW)).toBe("just now");
    expect(formatRelativeTime("not-a-date", NOW)).toBe("");
    expect(formatRelativeTime(null, NOW)).toBe("");
  });
});
