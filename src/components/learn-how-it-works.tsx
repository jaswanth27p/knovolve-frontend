const STEPS = [
  {
    title: "Pick a topic",
    description: "Type anything you want to learn, or start from one of the examples.",
  },
  {
    title: "We build the course",
    description: "Modules, chapters, and practice assignments are generated for you.",
  },
  {
    title: "Learn & practice",
    description: "Work through chapters, test yourself, and watch your progress grow.",
  },
];

export function LearnHowItWorks() {
  return (
    <section className="space-y-4 border-t border-border pt-8">
      <h2 className="font-display text-lg font-medium">How it works</h2>
      <ol className="grid gap-x-6 gap-y-6 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="space-y-1">
            <span className="font-display text-brand-gradient text-xl font-medium">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-sm font-medium">{step.title}</p>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
