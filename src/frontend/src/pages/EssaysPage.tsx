import { HOME_SITES } from "@/lib/octave";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink } from "lucide-react";

/** One guided essay section, anchored so the concept index can link to it. */
interface EssaySection {
  id: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  /** The simulator room this section hands off to. */
  room?: { to: string; label: string };
}

const ESSAYS: EssaySection[] = [
  {
    id: "octave-transcended",
    eyebrow: "The octave, one level up",
    title: "Transcendence is the octave taken one integral level higher",
    paragraphs: [
      "Start with the octave: a doubling step, the natural unit of the rank space. On its own it is a ruler — it tells you how far apart two things are, not what they are. Transcendence is what happens when you stop measuring along the ruler and start measuring the ruler itself. You lift the whole structure one integral level up, and the thing you were studying becomes the slope of the thing you are now studying.",
      "This is why the lift is not a bigger number. When you integrate a function, you do not get a larger version of the same curve — you get the curve whose rate of change is the original. The information has moved from the value to the change. The octave ladder is exactly this move applied repeatedly: each rung is the integral of the rung below it, and the base-4 digits I, O, A, E are the letters you write the rungs in.",
      "The practical consequence is that a quantity at level n and a quantity at level n+1 are not comparable by size. They are comparable by relationship. Asking which is larger is a category error; asking which is the derivative of which is the real question.",
    ],
    room: { to: "/transcendence", label: "Open the transcendence explorer" },
  },
  {
    id: "structurally-same",
    eyebrow: "Why the new level is not just bigger",
    title: "The theories on the new level are structurally the same",
    paragraphs: [
      "If transcendence only produced bigger numbers, it would be arithmetic. What it actually produces is the same theory, re-expressed. The relationships survive the lift: addition becomes integration, multiplication becomes convolution, and the shape of the argument is preserved even though every symbol has changed meaning.",
      "This is the reason the lab can show you one curve and let you read three orders off it. The zeroeth order is the constant — the value held still. The first order is the linear term — steady drift, the tangent at a point. The second order is the curvature — how the drift itself bends. They are not three different theories; they are three readings of one structure, taken at different integral levels.",
      "So when a result looks unfamiliar one level up, the right move is not to re-derive it from scratch. It is to ask which familiar relationship it is the lift of. The structure is the invariant; the numbers are the costume.",
    ],
    room: { to: "/transcendence", label: "Compare the orders side by side" },
  },
  {
    id: "love-multiplicative",
    eyebrow: "Love as combination",
    title: "Love is the multiplicative combination on the next order",
    paragraphs: [
      "Addition combines things that already share a level: two values on the same rung, summed. Love is the operator that combines across the lift. It is multiplicative in character — it does not place two quantities side by side, it fuses them into a single quantity that carries both, the way a product carries its factors.",
      "The blend is weighted, and the weight moves with the integral level. At level zero the two ranks are held evenly. As the level rises, the weight shifts toward the higher rank, because the higher rank is the one that has absorbed the structure of the lower. This is the sense in which love is not symmetric: it is a fusion that respects which side has been lifted further.",
      "Read this against the octave. Two octaves apart is a factor of four; love is what you get when you stop treating that factor as a distance and start treating it as a relationship. The product is the new object, and it lives on the next order.",
    ],
    room: { to: "/love", label: "Open the love model" },
  },
  {
    id: "first-order-metaphor",
    eyebrow: "First order as expression",
    title: "First-order math is metaphor, poetry, and the spiritual view",
    paragraphs: [
      "First-order mathematics is linear: a constant rate, a straight line, a tangent. It is the level at which a thing can be said in one sentence. That is exactly what metaphor is — a projection of something complex onto a single linear claim that a person can hold in mind.",
      "This is not a weakness. Poetry and spiritual language are first-order instruments, and they are the right instruments for the job they do. They compress a higher-order structure into a form that can be carried, repeated, and felt. The compression loses detail by design; what it preserves is the direction of the change.",
      "The guiding philosophy of this lab follows from that: higher-order theory leveraged down to first order. You do the hard work on the upper rungs, then you project it down into a linear statement someone can actually use. The metaphor is the delivery mechanism, not the mathematics.",
    ],
    room: { to: "/projection", label: "Open the projection lab" },
  },
  {
    id: "projection-intertangling",
    eyebrow: "Projection and intertangling",
    title: "Low and high spaces are projected into each other",
    paragraphs: [
      "A projection takes a structure from a higher space and lands it in a lower one, keeping some of the relationships and dropping the rest. The dropped part is not lost — it is the part that the lower space has no room to represent. Every projection is a choice about what to keep.",
      "Intertangling is the reverse traffic. The low space is not a passive recipient; its structure constrains what the high space can look like when it is read back down. The two spaces are woven together, and a change on one side shows up as a change on the other. This is why the same octave ladder can be read as arithmetic from below and as structure from above.",
      "In the lab this is the move that makes the theory usable. You set the integral level and the order, and the projection shows you what the higher structure looks like when it is forced through the lower space. The distortion you see is the information about what was dropped.",
    ],
    room: { to: "/projection", label: "Project a higher structure down" },
  },
  {
    id: "fourier-gaussian",
    eyebrow: "Componentization and smoothing",
    title: "Fourier componentization and Gaussian simplification",
    paragraphs: [
      "On the differential-linear-exponential space, a function can be taken apart into frequency components. Fourier componentization is the decomposition: any sufficiently well-behaved curve is a sum of pure oscillations, and the decomposition tells you how much of each frequency is present. This is the octave ladder read as a spectrum — each component is a rung, and the amplitudes are how loudly each rung is speaking.",
      "The Gaussian is the simplification that keeps the decomposition honest. Convolving with a Gaussian smooths the curve without inventing new structure: it damps the high frequencies and leaves the low ones, which is exactly the projection from a noisy high space down to a clean low one. It is the mathematical form of saying the same thing more simply.",
      "Together they give the working method of the lab. Decompose to see what is there; smooth to see what matters. The differential, the linear, and the exponential are the three faces of the same space, and Fourier plus Gaussian is how you move between them without losing the thread.",
    ],
    room: { to: "/fourier", label: "Open the Fourier & Gaussian playground" },
  },
];

/** Guided essays explaining the theory in the user's own framing. */
export function EssaysPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Essays & context
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          The theory, written out
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Six guided sections on the octave, the integral levels, love, and the
          projection between spaces. Each one ends at the room where you can
          simulate it.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {ESSAYS.map((essay, i) => (
            <article
              key={essay.id}
              id={essay.id}
              className="surface-output scroll-mt-24 p-6 md:p-8"
              data-ocid={`essays.section.${i + 1}`}
            >
              <p className="text-xs uppercase tracking-widest text-primary">
                {essay.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-xl font-semibold tracking-tight md:text-2xl">
                {essay.title}
              </h2>
              <div className="mt-4 space-y-4">
                {essay.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="text-sm leading-relaxed text-muted-foreground md:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {essay.room ? (
                <Link
                  to={essay.room.to}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                  data-ocid={`essays.room_link.${i + 1}`}
                >
                  {essay.room.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        <aside className="h-fit space-y-6 lg:sticky lg:top-24">
          <section
            className="surface-output p-5"
            aria-label="Sections"
            data-ocid="essays.toc"
          >
            <h2 className="font-display text-sm font-semibold">Sections</h2>
            <ol className="mt-3 space-y-2">
              {ESSAYS.map((essay, i) => (
                <li key={essay.id} className="flex gap-2.5">
                  <span
                    className="readout text-xs text-muted-foreground"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <a
                    href={`#${essay.id}`}
                    className="text-xs leading-relaxed text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    data-ocid={`essays.toc_link.${i + 1}`}
                  >
                    {essay.title}
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="surface-output p-5"
            aria-label="Home sites"
            data-ocid="essays.home_sites"
          >
            <h2 className="font-display text-sm font-semibold">
              Where this comes from
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              The theory is anchored to three home sites.
            </p>
            <ul className="mt-4 space-y-4">
              {HOME_SITES.map((site, i) => (
                <li key={site.url}>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
                    data-ocid={`essays.site_link.${i + 1}`}
                  >
                    <span className="readout">{site.label}</span>
                    <ExternalLink
                      className="h-3 w-3 shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {site.note}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
