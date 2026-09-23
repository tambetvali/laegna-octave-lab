import { OctaveCalculator } from "@/components/OctaveCalculator";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  blurb: string;
  /** What this room will eventually let the user do. */
  plans: string[];
}

/**
 * A placeholder room. The router and navigation are complete, so every
 * route resolves; the individual theory pages are filled by later tasks.
 */
export function PlaceholderPage({ title, blurb, plans }: PlaceholderPageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Theory page
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {blurb}
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section
          className="surface-output flex flex-col items-start p-8"
          data-ocid="page.placeholder"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <Construction className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">
            This room is being built
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            The shared calculator on the right already drives this page. When
            the room is finished it will:
          </p>
          <ul className="mt-4 space-y-2">
            {plans.map((plan) => (
              <li
                key={plan}
                className="flex gap-2 text-sm text-muted-foreground"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                {plan}
              </li>
            ))}
          </ul>
        </section>

        <OctaveCalculator />
      </div>
    </div>
  );
}
