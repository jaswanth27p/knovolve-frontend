import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("formats seconds under a minute", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(1_000)).toBe("1s");
    expect(formatDuration(59_999)).toBe("59s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(60_000)).toBe("1m 0s");
    expect(formatDuration(192_000)).toBe("3m 12s");
    expect(formatDuration(3_599_000)).toBe("59m 59s");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3_600_000)).toBe("1h 0m");
    expect(formatDuration(7_860_000)).toBe("2h 11m");
  });

  it("clamps negative input to zero", () => {
    expect(formatDuration(-5_000)).toBe("0s");
  });
});
