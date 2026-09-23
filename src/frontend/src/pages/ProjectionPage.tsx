import { OctaveCalculator } from "@/components/OctaveCalculator";
import { Plot, type PlotSeries } from "@/components/Plot";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  type Order,
  clamp,
  formatNumber,
  rankValue,
  sampleRank,
} from "@/lib/octave";
import { cn } from "@/lib/utils";
import { useOctaveStore } from "@/store/octave-store";
import { ArrowDownRight, ArrowUpRight, Layers } from "lucide-react";
import { useMemo, useState } from "react";

/** A first-order expression and its readings at higher layers. */
interface MetaphorEntry {
  expression: string;
  metaphor: string;
  higherModel: string;
  spiritual: string;
}

/** The metaphor table: one first-order expression, four readings. */
const METAPHORS: MetaphorEntry[] = [
  {
    expression: "x + y",
    metaphor: "Two people side by side — closeness as nearness.",
    higherModel:
      "The additive group: a first-order space where combination preserves the order.",
    spiritual:
      "Union without transformation — two remain two, held in one field.",
  },
  {
    expression: "x · y",
    metaphor: "Two people changed by each other — closeness as becoming.",
    higherModel:
      "The multiplicative next order: combination lifts both into a new layer.",
    spiritual:
      "Communion — the two are not added but multiplied into a third thing.",
  },
  {
    expression: "x²",
    metaphor: "A love that grows with its own size — self-amplifying.",
    higherModel: "Second order curvature: the rate of change itself changes.",
    spiritual:
      "Transcendence — the lower model is contained inside the higher one.",
  },
  {
    expression: "eˣ",
    metaphor: "A love that is its own derivative — always already growing.",
    higherModel:
      "The exponential: the fixed point of transcendence, unchanged by the lift.",
    spiritual:
      "The eternal — the same at every integral level, the ladder's own shape.",
  },
];

/** A row of the projection table. */
interface ProjectionRow {
  level: number;
  high: number;
  projected: number;
  residual: number;
}

/**
 * The projection & metaphor lab. Shows how low and high spaces project onto
 * each other, when they separate into distinct dimensions, and when they
 * intertangle like normal integral levels — then maps first-order
 * expressions onto their metaphor, higher-model, and spiritual readings.
 */
export function ProjectionPage() {
  const params = useOctaveStore((s) => s.params);
  const setIntegralLevel = useOctaveStore((s) => s.setIntegralLevel);

  const [coupling, setCoupling] = useState(0.5);
  const [metaphorIndex, setMetaphorIndex] = useState(0);

  const low = useMemo(
    () => sampleRank({ ...params, order: "first" as Order }),
    [params],
  );
  const high = useMemo(() => sampleRank(params), [params]);

  const projected = useMemo(() => {
    // Project the high space down onto the low space: keep the linear part
    // and let the coupling decide how much of the higher structure survives.
    const span = Math.max(1, params.L);
    const count = clamp(Math.round(120 * params.zoom), 8, 600);
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i += 1) {
      const x = -span + (2 * span * i) / (count - 1);
      const highValue = rankValue(x, params);
      const lowValue = rankValue(x, { ...params, order: "first" });
      points.push({
        x,
        y: lowValue + coupling * (highValue - lowValue),
      });
    }
    return points;
  }, [coupling, params]);

  const series = useMemo<PlotSeries[]>(
    () => [
      {
        id: "high",
        label: `High space — level ${params.integralLevel}`,
        points: high,
        colorClass: "text-concept-projection",
      },
      {
        id: "low",
        label: "Low space — first order",
        points: low,
        colorClass: "text-chart-2",
      },
      {
        id: "projected",
        label: `Projection — coupling ${formatNumber(coupling, 2)}`,
        points: projected,
        colorClass: "text-chart-5",
        dashed: true,
      },
    ],
    [coupling, high, low, params.integralLevel, projected],
  );

  const rows = useMemo<ProjectionRow[]>(() => {
    const levels = [0, 1, 2, 3, 4, 5];
    return levels.map((level) => {
      const highValue = rankValue(1, { ...params, integralLevel: level });
      const lowValue = rankValue(1, {
        ...params,
        integralLevel: level,
        order: "first",
      });
      return {
        level,
        high: highValue,
        projected: lowValue,
        residual: highValue - lowValue,
      };
    });
  }, [params]);

  const currentRow = rows[Math.min(5, Math.max(0, params.integralLevel))];
  const separated = coupling < 0.15;
  const intertangled = coupling > 0.85;
  const relationship = separated
    ? "Separate dimensions"
    : intertangled
      ? "Intertangled like normal integral levels"
      : "Partially projected";

  const metaphor = METAPHORS[metaphorIndex];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Theory page · projection
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Projection &amp; metaphor lab
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Higher-order theory leveraged down to first order is the guiding move.
          A high space can project onto a low one, the two can separate into
          distinct dimensions, or they can intertangle like normal integral
          levels. Set the coupling and watch which of the three happens — then
          read a first-order expression as metaphor, higher model, and spiritual
          view.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Controls */}
          <section
            className="surface-input p-5"
            aria-label="Projection controls"
            data-ocid="projection.controls"
          >
            <div className="flex items-center gap-2">
              <Layers
                className="h-4 w-4 text-concept-projection"
                aria-hidden="true"
              />
              <h2 className="font-display text-lg font-semibold">
                Projection controls
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Coupling decides how much of the high space survives the
              projection onto the low space.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <Label
                    htmlFor="projection-coupling"
                    className="text-xs uppercase tracking-widest"
                  >
                    Coupling
                  </Label>
                  <span
                    className="readout text-sm text-primary"
                    data-ocid="projection.coupling_value"
                  >
                    {formatNumber(coupling, 2)}
                  </span>
                </div>
                <Slider
                  id="projection-coupling"
                  value={[coupling]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([v]) => setCoupling(v)}
                  aria-label="Coupling between high and low spaces"
                  data-ocid="projection.coupling_slider"
                />
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <Label
                    htmlFor="projection-level"
                    className="text-xs uppercase tracking-widest"
                  >
                    High space level
                  </Label>
                  <span
                    className="readout text-sm text-primary"
                    data-ocid="projection.level_value"
                  >
                    {params.integralLevel}
                  </span>
                </div>
                <Slider
                  id="projection-level"
                  value={[params.integralLevel]}
                  min={0}
                  max={5}
                  step={1}
                  onValueChange={([v]) => setIntegralLevel(v)}
                  aria-label="High space integral level"
                  data-ocid="projection.level_slider"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge
                variant={separated ? "default" : "outline"}
                className="readout text-[10px]"
                data-ocid="projection.state_badge"
              >
                {relationship}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {separated
                  ? "At low coupling the two spaces are distinct dimensions."
                  : intertangled
                    ? "At high coupling the two spaces intertangle into one ladder."
                    : "Between the extremes the high space projects partially onto the low."}
              </span>
            </div>
          </section>

          {/* Projection plot */}
          <section
            className="surface-output p-5"
            aria-label="Projection diagram"
            data-ocid="projection.plot_panel"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">
                High, low, and the projection between
              </h2>
              <Badge variant="secondary" className="readout text-[10px]">
                level {params.integralLevel} → first order
              </Badge>
            </div>
            <Plot
              series={series}
              xLabel="x"
              yLabel="rank value"
              height={300}
              ariaLabel={`The high space at integral level ${params.integralLevel}, the low first-order space, and the projection between them at coupling ${formatNumber(coupling, 2)}.`}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The violet curve is the high space; the blue curve is the low
              first-order space. The dashed curve is the projection — at
              coupling{" "}
              <span className="readout text-foreground">
                {formatNumber(coupling, 2)}
              </span>{" "}
              it sits{" "}
              {separated
                ? "almost entirely on the low space, so the two are separate dimensions."
                : intertangled
                  ? "almost entirely on the high space, so the two intertangle like adjacent integral levels."
                  : "between the two, carrying part of the higher structure down."}
            </p>
          </section>

          {/* Projection table */}
          <section
            className="surface-output p-5"
            aria-label="Projection table"
            data-ocid="projection.table_panel"
          >
            <h2 className="font-display text-lg font-semibold">
              What survives the projection
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              At x = 1, the high value, its first-order projection, and the
              residual that does not survive.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm" data-ocid="projection.table">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Level
                    </th>
                    <th
                      scope="col"
                      className="py-2 pr-4 text-right font-medium"
                    >
                      High
                    </th>
                    <th
                      scope="col"
                      className="py-2 pr-4 text-right font-medium"
                    >
                      Projected
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      Residual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const active = row.level === params.integralLevel;
                    return (
                      <tr
                        key={row.level}
                        data-ocid={`projection.row.${row.level + 1}`}
                        className={cn(
                          "border-b border-border/60 last:border-0",
                          active && "bg-primary/10",
                        )}
                      >
                        <td className="readout py-2 pr-4 text-foreground">
                          {row.level}
                        </td>
                        <td className="readout py-2 pr-4 text-right text-concept-projection">
                          {formatNumber(row.high)}
                        </td>
                        <td className="readout py-2 pr-4 text-right text-muted-foreground">
                          {formatNumber(row.projected)}
                        </td>
                        <td className="readout py-2 text-right text-primary">
                          {formatNumber(row.residual)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              At level{" "}
              <span className="readout text-foreground">
                {params.integralLevel}
              </span>{" "}
              the high value is{" "}
              <span className="readout text-foreground">
                {formatNumber(currentRow.high)}
              </span>{" "}
              and its first-order projection is{" "}
              <span className="readout text-foreground">
                {formatNumber(currentRow.projected)}
              </span>
              . The residual —{" "}
              <span className="readout text-foreground">
                {formatNumber(currentRow.residual)}
              </span>{" "}
              — is the part of the higher order that the lower model cannot
              hold. Leveraging the theory down means deciding how much of that
              residual to keep.
            </p>
          </section>

          {/* Metaphor mapper */}
          <section
            className="surface-output p-5"
            aria-label="Metaphor mapper"
            data-ocid="projection.metaphor_panel"
          >
            <h2 className="font-display text-lg font-semibold">
              Metaphor mapper
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a first-order expression and read it at every layer.
            </p>

            <fieldset
              className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
              data-ocid="projection.metaphor_group"
            >
              <legend className="sr-only">First-order expression</legend>
              {METAPHORS.map((entry, i) => {
                const active = metaphorIndex === i;
                return (
                  <label
                    key={entry.expression}
                    data-ocid={`projection.metaphor.${i + 1}`}
                    className={cn(
                      "surface-input cursor-pointer px-3 py-2 text-center font-mono text-sm transition-smooth",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    <input
                      type="radio"
                      name="projection-metaphor"
                      value={entry.expression}
                      checked={active}
                      onChange={() => setMetaphorIndex(i)}
                      className="sr-only"
                    />
                    {entry.expression}
                  </label>
                );
              })}
            </fieldset>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <article
                className="surface-output p-4"
                data-ocid="projection.metaphor_metaphor"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Metaphor
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {metaphor.metaphor}
                </p>
              </article>
              <article
                className="surface-output p-4"
                data-ocid="projection.metaphor_model"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Higher model
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {metaphor.higherModel}
                </p>
              </article>
              <article
                className="surface-output p-4"
                data-ocid="projection.metaphor_spiritual"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Spiritual view
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {metaphor.spiritual}
                </p>
              </article>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The expression{" "}
              <span className="readout text-foreground">
                {metaphor.expression}
              </span>{" "}
              is first order, but it is read at every layer at once. That is the
              projection in words: the same expression, leveraged up into a
              higher model and down into a metaphor, without changing what it
              is.
            </p>
          </section>

          {/* Intertangling diagram */}
          <section
            className="surface-output p-5"
            aria-label="Intertangling relationship"
            data-ocid="projection.intertangle_panel"
          >
            <h2 className="font-display text-lg font-semibold">
              Adjacent orders, intertangled
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="surface-input flex flex-col items-center gap-2 p-4 text-center">
                <ArrowUpRight
                  className="h-5 w-5 text-concept-projection"
                  aria-hidden="true"
                />
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  High → low
                </p>
                <p className="text-sm text-foreground">
                  The higher order projects down, keeping its residual.
                </p>
              </div>
              <div className="surface-input flex flex-col items-center gap-2 p-4 text-center">
                <ArrowDownRight
                  className="h-5 w-5 text-chart-2"
                  aria-hidden="true"
                />
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Low → high
                </p>
                <p className="text-sm text-foreground">
                  The lower order is lifted back up by transcendence.
                </p>
              </div>
              <div className="surface-input flex flex-col items-center gap-2 p-4 text-center">
                <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Intertangled
                </p>
                <p className="text-sm text-foreground">
                  At full coupling the two are one ladder, not two spaces.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              When the coupling is high the two orders stop being separate
              dimensions and intertangle like normal integral levels: the low
              space is the high space seen from below, and the high space is the
              low space lifted. That is the relationship the whole lab is built
              to make visible.
            </p>
          </section>
        </div>

        <OctaveCalculator />
      </div>
    </div>
  );
}
