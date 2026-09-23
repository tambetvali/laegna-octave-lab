import { OctaveCalculator } from "@/components/OctaveCalculator";
import { Plot, type PlotSeries } from "@/components/Plot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ORDER_DESCRIPTIONS,
  ORDER_LABELS,
  type Order,
  formatNumber,
  rankValue,
  sampleRank,
  transcend,
} from "@/lib/octave";
import { cn } from "@/lib/utils";
import { useOctaveStore } from "@/store/octave-store";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

const ORDERS: Order[] = ["zeroeth", "first", "second"];

/** Static ramp classes so Tailwind sees them at build time. */
const ORDER_RAMP = ["text-octave-1", "text-octave-3", "text-octave-5"];

/** The preset theory cards for this room. */
const THEORY_CARDS = [
  {
    title: "Octave shift",
    body: "Climbing one integral level is an octave shift: the same shape, moved up a rung of the rank space. The curve is not replaced — it is lifted.",
  },
  {
    title: "Music / wave applied at the new layer",
    body: "A wave that was first order becomes second order when you transcend it. The same music is now played at the layer above, where it reads as curvature.",
  },
  {
    title: "Same theory, higher layer — not just bigger numbers",
    body: "Transcendence does not scale the value; it changes the order the value lives at. The numbers grow because the layer is higher, not because the theory changed.",
  },
] as const;

/** One row of the level-by-level sample table. */
interface LevelRow {
  level: number;
  base: number;
  lifted: number;
  delta: number;
  /** The next level's rank value, shown separately from the lift. */
  nextRank: number;
}

/**
 * The transcendence explorer. Lifts the current rank curve one integral
 * level up with the shared `transcend` map, overlays the result on the
 * original, and shows the shift numerically at every level.
 */
export function TranscendencePage() {
  const params = useOctaveStore((s) => s.params);
  const setIntegralLevel = useOctaveStore((s) => s.setIntegralLevel);
  const setOrder = useOctaveStore((s) => s.setOrder);

  const [showLifted, setShowLifted] = useState(true);
  const [showDescended, setShowDescended] = useState(false);

  const base = useMemo(() => sampleRank(params), [params]);
  const lifted = useMemo(() => transcend(base), [base]);

  const series = useMemo<PlotSeries[]>(() => {
    const out: PlotSeries[] = [
      {
        id: "base",
        label: `Base — ${ORDER_LABELS[params.order]}`,
        points: base,
        colorClass: "text-chart-2",
      },
    ];
    if (showLifted) {
      out.push({
        id: "lifted",
        label: "Transcended — one integral level up",
        points: lifted,
        colorClass: "text-chart-3",
        dashed: true,
      });
    }
    return out;
  }, [base, lifted, params.order, showLifted]);

  const rows = useMemo<LevelRow[]>(() => {
    const levels = [0, 1, 2, 3, 4, 5];
    return levels.map((level) => {
      const atLevel = { ...params, integralLevel: level };
      // The lifted value is the same operation the plot draws: the
      // numerical integral of the sampled curve at this level, read at x = 1.
      const sampled = sampleRank(atLevel);
      const liftedCurve = transcend(sampled);
      const liftedValue =
        liftedCurve.find((p) => p.x >= 1)?.y ??
        liftedCurve[liftedCurve.length - 1]?.y ??
        0;
      const baseValue = rankValue(1, atLevel);
      const nextRank = rankValue(1, {
        ...atLevel,
        integralLevel: level + 1,
      });
      return {
        level,
        base: baseValue,
        lifted: liftedValue,
        delta: liftedValue - baseValue,
        nextRank,
      };
    });
  }, [params]);

  const currentRow = rows[Math.min(5, Math.max(0, params.integralLevel))];
  const nextLevel = Math.min(5, params.integralLevel + 1);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Theory page · transcendence
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Transcendence explorer
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Transcendence is the map that lifts a function one integral level up.
          The lifted curve is the one whose slope is the curve you started with
          — so a first-order line becomes a second-order curve, and a constant
          becomes a line. Set the level, choose an order, and watch the shift
          happen in the plot and in the table.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Controls */}
          <section
            className="surface-input p-5"
            aria-label="Transcendence controls"
            data-ocid="transcendence.controls"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Lift controls
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  The base curve comes from the shared calculator. These
                  controls decide what is lifted and what is shown.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLifted(true);
                  setShowDescended(false);
                }}
                data-ocid="transcendence.reset_button"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Reset view
              </Button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <Label
                    htmlFor="transcend-level"
                    className="text-xs uppercase tracking-widest"
                  >
                    Lift from level
                  </Label>
                  <span
                    className="readout text-sm text-primary"
                    data-ocid="transcendence.level_value"
                  >
                    {params.integralLevel} → {nextLevel}
                  </span>
                </div>
                <Slider
                  id="transcend-level"
                  value={[params.integralLevel]}
                  min={0}
                  max={5}
                  step={1}
                  onValueChange={([v]) => setIntegralLevel(v)}
                  aria-label="Lift from integral level"
                  data-ocid="transcendence.level_slider"
                />
              </div>

              <div>
                <span className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                  Base order
                </span>
                <fieldset
                  className="grid grid-cols-3 gap-2"
                  data-ocid="transcendence.order_group"
                >
                  <legend className="sr-only">Base order</legend>
                  {ORDERS.map((order, i) => {
                    const active = params.order === order;
                    return (
                      <label
                        key={order}
                        data-ocid={`transcendence.order.${i + 1}`}
                        className={cn(
                          "surface-input cursor-pointer px-2 py-2 text-center text-xs font-medium capitalize transition-smooth",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
                        )}
                      >
                        <input
                          type="radio"
                          name="transcendence-order"
                          value={order}
                          checked={active}
                          onChange={() => setOrder(order)}
                          className="sr-only"
                        />
                        {order}
                      </label>
                    );
                  })}
                </fieldset>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={showLifted ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLifted((v) => !v)}
                aria-pressed={showLifted}
                data-ocid="transcendence.toggle_lifted"
              >
                <ArrowUp className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {showLifted ? "Hide lifted curve" : "Show lifted curve"}
              </Button>
              <Button
                type="button"
                variant={showDescended ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDescended((v) => !v)}
                aria-pressed={showDescended}
                data-ocid="transcendence.toggle_descended"
              >
                <ArrowDown className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {showDescended ? "Hide slope readout" : "Show slope readout"}
              </Button>
            </div>
          </section>

          {/* Plot */}
          <section
            className="surface-output p-5"
            aria-label="Transcendence plot"
            data-ocid="transcendence.plot_panel"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">
                Base and transcended
              </h2>
              <Badge variant="secondary" className="readout text-[10px]">
                {ORDER_LABELS[params.order]}
              </Badge>
            </div>
            <Plot
              series={series}
              xLabel="x"
              yLabel="rank value"
              height={300}
              ariaLabel={`Base ${params.order} order curve at integral level ${params.integralLevel}, with its transcended counterpart one level up.`}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The solid curve is the base function at level{" "}
              <span className="readout text-foreground">
                {params.integralLevel}
              </span>
              . The dashed curve is the same function lifted one integral level:
              its slope at every point is the base curve's value.{" "}
              {ORDER_DESCRIPTIONS[params.order]}
            </p>
          </section>

          {/* Numeric table */}
          <section
            className="surface-output p-5"
            aria-label="Level sample table"
            data-ocid="transcendence.table_panel"
          >
            <h2 className="font-display text-lg font-semibold">
              The shift, level by level
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sample values at x = 1. The transcended column is the numerical
              integral of the sampled curve at that level — the same lift the
              plot draws. The next-level rank column is the rank value one
              integral level up, shown separately.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm" data-ocid="transcendence.table">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Level
                    </th>
                    <th
                      scope="col"
                      className="py-2 pr-4 text-right font-medium"
                    >
                      Base
                    </th>
                    <th
                      scope="col"
                      className="py-2 pr-4 text-right font-medium"
                    >
                      Transcended
                    </th>
                    <th
                      scope="col"
                      className="py-2 pr-4 text-right font-medium"
                    >
                      Next-level rank
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      Shift
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const active = row.level === params.integralLevel;
                    return (
                      <tr
                        key={row.level}
                        data-ocid={`transcendence.row.${row.level + 1}`}
                        className={cn(
                          "border-b border-border/60 last:border-0",
                          active && "bg-primary/10",
                        )}
                      >
                        <td className="py-2 pr-4">
                          <span
                            className={cn(
                              "readout",
                              active ? "text-primary" : "text-foreground",
                            )}
                          >
                            {row.level}
                          </span>
                        </td>
                        <td className="readout py-2 pr-4 text-right text-muted-foreground">
                          {formatNumber(row.base)}
                        </td>
                        <td className="readout py-2 pr-4 text-right text-foreground">
                          {formatNumber(row.lifted)}
                        </td>
                        <td className="readout py-2 pr-4 text-right text-muted-foreground">
                          {formatNumber(row.nextRank)}
                        </td>
                        <td className="readout py-2 text-right text-primary">
                          +{formatNumber(row.delta)}
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
              the base value is{" "}
              <span className="readout text-foreground">
                {formatNumber(currentRow.base)}
              </span>{" "}
              and the transcended value is{" "}
              <span className="readout text-foreground">
                {formatNumber(currentRow.lifted)}
              </span>
              . The shift is not a bigger number of the same kind — it is the
              same theory standing on a higher rung.
            </p>
          </section>

          {/* Preset theory cards */}
          <section aria-label="Preset theory" data-ocid="transcendence.theory">
            <h2 className="font-display text-lg font-semibold">
              Three ways to read the shift
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {THEORY_CARDS.map((card, i) => (
                <article
                  key={card.title}
                  className="surface-output p-5"
                  data-ocid={`transcendence.theory_card.${i + 1}`}
                >
                  <span
                    className={cn("readout text-xs", ORDER_RAMP[i])}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-base font-semibold">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <OctaveCalculator />
      </div>
    </div>
  );
}
