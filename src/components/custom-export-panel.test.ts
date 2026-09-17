import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/button", () => ({ Button: () => null }));
vi.mock("@/components/ui/badge", () => ({ Badge: () => null }));
vi.mock("@/lib/api", () => ({}));
vi.mock("@/lib/export-status", () => ({ notifyCourseStatusChanged: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useMutation: vi.fn(), useQueryClient: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("lucide-react", () => ({ Loader2: () => null, Send: () => null, Sparkles: () => null }));

import { buildCustomBrief, formatAssistantReply } from "./custom-export-panel";

describe("formatAssistantReply", () => {
  it("appends questions as a bulleted list under the reply", () => {
    expect(formatAssistantReply("I need a couple details.", ["How long should it be?", "How many questions?"])).toBe(
      "I need a couple details.\n- How long should it be?\n- How many questions?"
    );
  });

  it("returns the reply unchanged when there are no questions", () => {
    expect(formatAssistantReply("Sounds good, here is the plan.", [])).toBe("Sounds good, here is the plan.");
  });

  it("falls back to the bulleted questions when reply is empty", () => {
    expect(formatAssistantReply("", ["How long should it be?"])).toBe("- How long should it be?");
  });
});

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
