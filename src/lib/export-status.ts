import type { QueryClient } from "@tanstack/react-query";

export function notifyCourseStatusChanged(queryClient: QueryClient, slug: string): void {
  void queryClient.invalidateQueries({ queryKey: ["export-jobs", slug] });
  void queryClient.invalidateQueries({ queryKey: ["export-job", slug] });
  void queryClient.invalidateQueries({ queryKey: ["generation-run", slug] });
  void queryClient.invalidateQueries({ queryKey: ["readiness", slug] });
  void queryClient.invalidateQueries({ queryKey: ["course", slug] });
}
