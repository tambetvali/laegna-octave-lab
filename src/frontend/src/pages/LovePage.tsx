import { OctaveCalculator } from "@/components/OctaveCalculator";
import { Plot, type PlotSeries } from "@/components/Plot";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { clamp, formatNumber, love, sampleRank, transcend } from "@/lib/octave";
import { cn } from "@/lib/utils";
import { useOctaveStore } from "@/store/octave-store";
import { Heart, Users } from "lucide-react";
import { useMemo, useState } from "react";

/** A single row of the combination table. */
interface ComboRow {
  label: string;
  expression: string;
  value: number;
  note: string;
}

/**
 * The love & combination model. Two people each bring a number of
 * combinations; the page shows additive love (x + y) against
 * multiplicative love (x * y) on the next order, and how the exponent
 * level only becomes real when the whole multitude is done at that level.
 */
export function LovePage() {
  const params = useOctaveStore((s) => s.params);

  const [x, setX] = useState(3);
  const [y, setY] = useState(4);
  const [people, setPeople] = useState(2);

  const additive = x + y;
  const multiplicative = x * y;
  const societyAdditive = people * ((x + y) / 2);
  const societyMultiplicative = x * y ** Math.max(1, people - 1);

  const rows = useMemo<ComboRow[]>(
    () => [
      {
        label: "Additive love",
        expression: "x + y",
        value: additive,
        note: "Two ranks placed side by side — the lower model, where love is a sum.",
      },
      {
        label: "Multiplicative love",
        expression: "x · y",
        value: multiplicative,
        note: "The next order: the two ranks combine into a product, a genuinely higher layer.",
      },
      {
        label: "Blended (love operator)",
        expression: `love(x, y, ${params.integralLevel})`,
        value: love(x, y, params.integralLevel),
        note: "The weighted blend, favouring the higher rank as the integral level rises.",
      },
    ],
    [additive, multiplicative, params.integralLevel, x, y],
  );

  const series = useMemo<PlotSeries[]>(() => {
    const span = Math.max(1, params.L);
    const count = clamp(Math.round(120 * params.zoom), 8, 600);
    const additivePoints: Array<{ x: number; y: number }> = [];
    const multiplicativePoints: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i += 1) {
      const t = -span + (2 * span * i) / (count - 1);
      additivePoints.push({ x: t, y: x + t });
      multiplicativePoints.push({ x: t, y: x * t });
    }
    return [
      {
        id: "additive",
        label: `Additive — ${x} + y`,
        points: additivePoints,
        colorClass: "text-chart-2",
      },
      {
        id: "multiplicative",
        label: `Multiplicative — ${x} · y`,
        points: multiplicativePoints,
        colorClass: "text-concept-love",
      },
    ];
  }, [params.L, params.zoom, x]);

  const loverModel = useMemo(() => sampleRank(params), [params]);
  const completeLove = useMemo(() => transcend(loverModel), [loverModel]);

  const loverSeries = useMemo<PlotSeries[]>(
    () => [
      {
        id: "lover",
        label: "The lover's own linear space",
        points: loverModel,
        colorClass: "text-chart-1",
      },
      {
        id: "complete",
        label: "Complete love — the exponent space inside it",
        points: completeLove,
        colorClass: "text-concept-love",
        dashed: true,
      },
    ],
    [completeLove, loverModel],
  );

  const growthLimit = societyMultiplicative;
  const growthRatio = societyAdditive === 0 ? 0 : growthLimit / societyAdditive;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Theory page · love
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Love &amp; combination model
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Love is the combination operator: it fuses two ranks into one. Two
          people each bring a number of combinations. Added together they stay
          on the same order; multiplied they step up to the next. The exponent
          level only becomes real when the whole multitude is done at that level
          — that is complete love, superintegral over the superset of loves.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Two-person inputs */}
          <section
            className="surface-input p-5"
            aria-label="Two-person combination inputs"
            data-ocid="love.controls"
          >
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-concept-love" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold">
                Two-person combination
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter each person's number of combinations. The next order is
              computed live.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label
                  htmlFor="love-x"
                  className="text-xs uppercase tracking-widest"
                >
                  Person A — combinations x
                </Label>
                <Input
                  id="love-x"
                  type="number"
                  min={0}
                  max={99}
                  value={x}
                  onChange={(e) =>
                    setX(clamp(Number(e.target.value) || 0, 0, 99))
                  }
                  className="readout mt-2"
                  data-ocid="love.x_input"
                />
              </div>
              <div>
                <Label
                  htmlFor="love-y"
                  className="text-xs uppercase tracking-widest"
                >
                  Person B — combinations y
                </Label>
                <Input
                  id="love-y"
                  type="number"
                  min={0}
                  max={99}
                  value={y}
                  onChange={(e) =>
                    setY(clamp(Number(e.target.value) || 0, 0, 99))
                  }
                  className="readout mt-2"
                  data-ocid="love.y_input"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {rows.map((row, i) => (
                <div
                  key={row.label}
                  className="surface-output p-4"
                  data-ocid={`love.result.${i + 1}`}
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {row.label}
                  </p>
                  <p className="readout mt-2 text-2xl font-semibold text-foreground">
                    {formatNumber(row.value)}
                  </p>
                  <p className="readout mt-1 text-[11px] text-primary">
                    {row.expression}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {row.note}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Additive vs multiplicative plot */}
          <section
            className="surface-output p-5"
            aria-label="Additive versus multiplicative love"
            data-ocid="love.plot_panel"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">
                Additive vs multiplicative
              </h2>
              <Badge variant="secondary" className="readout text-[10px]">
                x = {x}
              </Badge>
            </div>
            <Plot
              series={series}
              xLabel="y"
              yLabel="love"
              height={280}
              ariaLabel={`Additive love ${x} plus y compared with multiplicative love ${x} times y.`}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The additive line stays on the first order — it grows steadily.
              The multiplicative line is the next order: it curves, because the
              combination is now a product rather than a sum. That curve is what
              "love on the next order" looks like.
            </p>
          </section>

          {/* Lover's model */}
          <section
            className="surface-output p-5"
            aria-label="The lover's model"
            data-ocid="love.lover_panel"
          >
            <h2 className="font-display text-lg font-semibold">
              The lover's model as its own linear space
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              The lover is a linear space in its own right. Inside it sits the
              exponent space — complete love, superintegral over the superset of
              loves.
            </p>
            <div className="mt-4">
              <Plot
                series={loverSeries}
                xLabel="x"
                yLabel="rank value"
                height={260}
                ariaLabel="The lover's linear space with the exponent space of complete love shown as its integral."
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The solid curve is the lover's own linear space at integral level{" "}
              <span className="readout text-foreground">
                {params.integralLevel}
              </span>
              . The dashed curve is complete love — the exponent space inside
              it, reached by transcending the lover's model one level. Love is a
              relative size: it can always be added back into the lower models
              without leaving them.
            </p>
          </section>

          {/* Multitude slider */}
          <section
            className="surface-input p-5"
            aria-label="Multitude growth"
            data-ocid="love.multitude_panel"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold">
                Multitude — when the exponent level becomes real
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              The exponent level is only real when the whole is done at that
              level. Add people and watch the growth limit open up.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex items-baseline justify-between">
                <Label
                  htmlFor="love-people"
                  className="text-xs uppercase tracking-widest"
                >
                  Number of people
                </Label>
                <span
                  className="readout text-sm text-primary"
                  data-ocid="love.people_value"
                >
                  {people}
                </span>
              </div>
              <Slider
                id="love-people"
                value={[people]}
                min={1}
                max={8}
                step={1}
                onValueChange={([v]) => setPeople(v)}
                aria-label="Number of people"
                data-ocid="love.people_slider"
              />
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="surface-output p-4">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Society, additive
                </dt>
                <dd
                  className="readout mt-2 text-xl text-foreground"
                  data-ocid="love.society_additive"
                >
                  {formatNumber(societyAdditive)}
                </dd>
              </div>
              <div className="surface-output p-4">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Society, multiplicative
                </dt>
                <dd
                  className="readout mt-2 text-xl text-concept-love"
                  data-ocid="love.society_multiplicative"
                >
                  {formatNumber(societyMultiplicative)}
                </dd>
              </div>
              <div className="surface-output p-4">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Growth limit
                </dt>
                <dd
                  className="readout mt-2 text-xl text-primary"
                  data-ocid="love.growth_limit"
                >
                  {formatNumber(growthRatio)}×
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              With <span className="readout text-foreground">{people}</span>{" "}
              {people === 1 ? "person" : "people"}, the multiplicative whole is{" "}
              <span className="readout text-foreground">
                {formatNumber(growthRatio)}×
              </span>{" "}
              the additive one. The exponent level is not a bigger sum — it is
              the whole done at the higher level, and its growth limit is set by
              how many people actually stand there.
            </p>
          </section>

          {/* Explanation */}
          <section
            className="surface-output p-5"
            aria-label="Love as relative size"
            data-ocid="love.explanation"
          >
            <h2 className="font-display text-lg font-semibold">
              Love as a relative size
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Love is not an absolute quantity; it is a relative size. The
              multiplicative product lives on the next order, but it can always
              be added back into the lower models — the sum, the linear space,
              the lover's own model — without contradiction. That is why the
              same theory holds at every layer: the higher order is leveraged
              back down to the first, and the first is understood as a
              projection of the higher.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="readout text-[10px]">
                additive · first order
              </Badge>
              <Badge variant="outline" className="readout text-[10px]">
                multiplicative · next order
              </Badge>
              <Badge variant="outline" className="readout text-[10px]">
                complete love · superintegral
              </Badge>
            </div>
          </section>
        </div>

        <OctaveCalculator />
      </div>
    </div>
  );
}
