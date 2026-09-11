import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { parseExportApiError } from "./api";
import { notifyCourseStatusChanged } from "./export-status";

describe("parseExportApiError", () => {
  it("extracts machine codes from FastAPI 409 responses", () => {
    const parsed = parseExportApiError(
      new Error('409: {"detail":{"code":"content_not_ready","message":"Not ready."}}')
    );
    expect(parsed).toEqual({ status: 409, code: "content_not_ready", message: "Not ready." });
  });

  it("falls back safely for unstructured failures", () => {
    expect(parseExportApiError(new Error("boom")).message).toBe("boom");
    expect(parseExportApiError(null).status).toBe(0);
  });
});

describe("notifyCourseStatusChanged", () => {
  it("invalidates export, generation, readiness, and course queries", () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockImplementation(async () => {});
    notifyCourseStatusChanged(queryClient, "course-slug");
    expect(invalidate).toHaveBeenCalledTimes(5);
    expect(invalidate).toHaveBeenNthCalledWith(1, { queryKey: ["export-jobs", "course-slug"] });
  });
});
