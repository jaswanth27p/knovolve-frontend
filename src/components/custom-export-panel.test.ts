import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/button", () => ({ Button: () => null }));
vi.mock("@/lib/api", () => ({}));
vi.mock("@/lib/export-status", () => ({ notifyCourseStatusChanged: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useMutation: vi.fn(), useQueryClient: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("lucide-react", () => ({ Loader2: () => null, Send: () => null, Sparkles: () => null }));

import { buildCustomBrief } from "./custom-export-panel";

describe("buildCustomBrief", () => {
  it("preserves the initial request and substantive turns", () => {
    const brief = buildCustomBrief("Interview questions", [
      { role: "user", content: "Interview questions" },
      { role: "assistant", content: "How many questions?" },
      { role: "assistant", content: "" },
      { role: "user", content: "Twelve, medium length." },
    ]);
    expect(brief).toBe(
      [
        "Initial request: Interview questions",
        "Learner: Interview questions",
        "Assistant: How many questions?",
        "Learner: Twelve, medium length.",
      ].join("\n")
    );
  });
});
