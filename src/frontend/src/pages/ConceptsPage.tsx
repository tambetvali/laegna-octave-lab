import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FlaskConical,
} from "lucide-react";

/** Where each concept's essay section lives, and the room that simulates it. */
interface ConceptContext {
  /** The essay section anchor on the essays page. */
  essayId: string;
  /** A one-line definition in the user's own framing. */
  definition: string;
  /** The simulator room, when the concept has one. */
  room?: { to: string; label: string };
}

/**
 * The static context for each backend concept id. The backend owns the
 * canonical id/name list; this map adds the essay anchor, the definition,
 * and the simulator room so theory and tools stay connected.
 */
const CONCEPT_CONTEXT: Record<string, ConceptContext> = {
  octave: {
    essayId: "octave-transcended",
    definition:
      "A doubling step — the natural unit of the rank space, written in the base-4 alphabet I, O, A, E.",
    room: { to: "/transcendence", label: "Transcendence explorer" },
  },
  "integral-level": {
    essayId: "octave-transcended",
    definition:
      "How many times a quantity has been lifted. Each level is the integral of the one below it.",
    room: { to: "/transcendence", label: "Transcendence explorer" },
  },
  love: {
    essayId: "love-multiplicative",
    definition:
      "The multiplicative combination on the next order — a weighted fusion that favours the higher rank.",
    room: { to: "/love", label: "Love model" },
  },
  transcendence: {
    essayId: "structurally-same",
    definition:
      "Lifting a function one integral level up, so the curve becomes its own slope.",
    room: { to: "/transcendence", label: "Transcendence explorer" },
  },
  "rank-space": {
    essayId: "structurally-same",
    definition:
      "The ladder of orders a quantity can occupy: zeroeth, first, second.",
    room: { to: "/transcendence", label: "Transcendence explorer" },
  },
  projection: {
    essayId: "projection-intertangling",
    definition:
      "Landing a higher-order structure in a lower space, keeping some relationships and dropping the rest.",
    room: { to: "/projection", label: "Projection & metaphor lab" },
  },
  fourier: {
    essayId: "fourier-gaussian",
    definition:
      "Componentization: taking a curve apart into pure frequency components on the differential-linear-exponential space.",
    room: { to: "/fourier", label: "Fourier & Gaussian playground" },
  },
  gaussian: {
    essayId: "fourier-gaussian",
    definition:
      "The simplification that smooths a decomposition without inventing new structure.",
    room: { to: "/fourier", label: "Fourier & Gaussian playground" },
  },
};

/** The concept index — every term, its essay, its room, and your notes. */
export function ConceptsPage() {
  const { actor, isFetching } = useActor(createActor);
  const { isAuthenticated } = useInternetIdentity();

  const conceptsQuery = useQuery({
    queryKey: ["concepts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listConcepts();
    },
    enabled: !!actor && !isFetching,
  });

  const entriesQuery = useQuery({
    queryKey: ["notebookEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listNotebookEntries();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const concepts = conceptsQuery.data ?? [];
  const entries = entriesQuery.data ?? [];

  const countFor = (conceptId: string) =>
    entries.filter((entry) => entry.conceptId === conceptId).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Concept index
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Every term, and where it lives
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Each concept links to the essay that explains it and the room that
          simulates it. When you are signed in, it also shows how many of your
          notebook entries attach to it.
        </p>
      </header>

      {conceptsQuery.isLoading ? (
        <div
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          data-ocid="concepts.loading_state"
        >
          {Array.from({ length: 6 }, (_, i) => `concept-skeleton-${i}`).map(
            (id) => (
              <div key={id} className="surface-output p-5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-3/4" />
              </div>
            ),
          )}
        </div>
      ) : conceptsQuery.isError ? (
        <div
          className="surface-output mt-10 flex flex-col items-start p-6"
          data-ocid="concepts.error_state"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/15 text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm text-foreground">
            The concept index could not be loaded.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void conceptsQuery.refetch()}
            data-ocid="concepts.retry_button"
          >
            Try again
          </Button>
        </div>
      ) : concepts.length === 0 ? (
        <div
          className="surface-output mt-10 flex flex-col items-start p-8"
          data-ocid="concepts.empty_state"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-base font-semibold">
            No concepts yet
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            The concept index is empty. Once the theory is published, every term
            will appear here.
          </p>
        </div>
      ) : (
        <ul
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-ocid="concepts.list"
        >
          {concepts.map((concept, i) => {
            const context = CONCEPT_CONTEXT[concept.id];
            const count = countFor(concept.id);
            return (
              <li
                key={concept.id}
                className="surface-output flex flex-col p-5"
                data-ocid={`concepts.item.${i + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-base font-semibold">
                    {concept.name}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="readout shrink-0 text-[10px]"
                  >
                    {concept.id}
                  </Badge>
                </div>

                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {context?.definition ??
                    "A term in the octave theory, defined in the essays."}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {context ? (
                    <Link
                      to="/essays"
                      hash={context.essayId}
                      className="inline-flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
                      data-ocid={`concepts.essay_link.${i + 1}`}
                    >
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      Read the essay
                    </Link>
                  ) : null}
                  {context?.room ? (
                    <Link
                      to={context.room.to}
                      className="inline-flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
                      data-ocid={`concepts.room_link.${i + 1}`}
                    >
                      <FlaskConical
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {context.room.label}
                    </Link>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  {isAuthenticated ? (
                    <Link
                      to="/notebook"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      data-ocid={`concepts.notebook_link.${i + 1}`}
                    >
                      <span className="readout">
                        {count} {count === 1 ? "entry" : "entries"}
                      </span>
                      in your notebook
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sign in to see your notebook entries for this concept.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
