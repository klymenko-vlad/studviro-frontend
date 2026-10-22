export interface HowItWorksStep {
  key: string;
  title: string;
  body: string;
}

export function HowItWorks({ steps }: { steps: readonly HowItWorksStep[] }) {
  return (
    <ol className="grid gap-8 sm:grid-cols-3">
      {steps.map(step => (
        <li
          key={step.key}
          className="border-primary/40 flex flex-col gap-2 border-l-2 pl-4"
        >
          <h3 className="font-semibold">{step.title}</h3>
          <p className="text-muted-foreground text-sm text-pretty">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
