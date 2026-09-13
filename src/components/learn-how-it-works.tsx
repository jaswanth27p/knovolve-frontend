import { GraduationCap, ListChecks, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    icon: ListChecks,
    title: "Pick a topic",
    description: "Type anything you want to learn, or start from one of the examples.",
  },
  {
    icon: Wand2,
    title: "We build the course",
    description: "Modules, chapters, and practice assignments are generated for you.",
  },
  {
    icon: GraduationCap,
    title: "Learn & practice",
    description: "Work through chapters, test yourself, and watch your progress grow.",
  },
];

export function LearnHowItWorks() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">How it works</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={step.title}>
              <CardContent className="space-y-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-accent">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground">{index + 1}. </span>
                    {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
