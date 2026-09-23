import { Button } from "@/components/ui/button";
import { HOME_SITES, ORDER_DESCRIPTIONS, type Order } from "@/lib/octave";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";

const ORDERS: Order[] = ["zeroeth", "first", "second"];

/** Static octave-ramp classes so Tailwind can see them at build time. */
const ORDER_RAMP = ["text-octave-0", "text-octave-2", "text-octave-4"];

const LAB_ENTRIES = [
  {
    to: "/transcendence",
    title: "Transcendence explorer",
    blurb:
      "Lift a function one integral level up and watch the curve become its own slope.",
  },
  {
    to: "/love",
    title: "Love model",
    blurb:
      "Fuse two ranks with the love operator and see how the blend shifts as the level rises.",
  },
  {
    to: "/fourier",
    title: "Fourier & Gaussian playground",
    blurb:
      "Decompose the octave into frequencies, and meet the Gaussian that keeps it smooth.",
  },
  {
    to: "/projection",
    title: "Projection & metaphor lab",
    blurb:
      "Project higher-order structure down to first order — the guiding move of the theory.",
  },
  {
    to: "/notebook",
    title: "Notebook",
    blurb: "Keep your own derivations and simulations alongside the theory.",
  },
  {
    to: "/essays",
    title: "Essays & context",
    blurb:
      "Long-form writing on the octave, the rank space, and the home sites.",
  },
  {
    to: "/concepts",
    title: "Concept index",
    blurb:
      "Every term in one place: octave, integral level, love, transcendence.",
  },
] as const;

/** The landing page — orients the user and links into the lab. */
export function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url(/assets/generated/octave-hero.dim_1536x1024.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="max-w-3xl animate-fade-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground backdrop-blur">
              <Compass
                className="h-3.5 w-3.5 text-primary"
                aria-hidden="true"
              />
              A working lab for the octave
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Climb the{" "}
              <span className="text-gradient-primary">octave ladder</span>, one
              integral level at a time.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              The Laegna Octave Lab explains, visualizes, and simulates the rank
              space — the ladder of orders a quantity can occupy. Set the
              integral level, pick a base-4 digit, and watch every page respond.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" data-ocid="landing.primary_button">
                <Link to="/transcendence">
                  Enter the lab
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                data-ocid="landing.secondary_button"
              >
                <Link to="/concepts">Read the concepts</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* The three orders */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            The three orders
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            One ladder, three ways to stand on it
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ORDERS.map((order, i) => (
              <article
                key={order}
                className="surface-output p-6"
                data-ocid={`landing.order_card.${i + 1}`}
              >
                <span
                  className={`readout text-xs ${ORDER_RAMP[i]}`}
                  aria-hidden="true"
                >
                  {String(i).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold capitalize">
                  {order}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {ORDER_DESCRIPTIONS[order]}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Lab entries */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Inside the lab
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Seven rooms, one shared calculator
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_ENTRIES.map((entry, i) => (
              <Link
                key={entry.to}
                to={entry.to}
                data-ocid={`landing.entry.${i + 1}`}
                className="surface-output group flex flex-col p-5 transition-smooth hover:border-primary/50"
              >
                <h3 className="font-display text-base font-semibold group-hover:text-primary">
                  {entry.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {entry.blurb}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-primary">
                  Open
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Home sites */}
      <section className="bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Where this comes from
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Three home sites
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {HOME_SITES.map((site, i) => (
              <a
                key={site.url}
                href={site.url}
                target="_blank"
                rel="noreferrer"
                data-ocid={`landing.site.${i + 1}`}
                className="surface-output block p-6 transition-smooth hover:border-primary/50"
              >
                <p className="readout text-sm text-primary">{site.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {site.note}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
