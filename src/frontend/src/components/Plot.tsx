import { cn } from "@/lib/utils";
import { useId, useMemo } from "react";

/** One named series in a plot. */
export interface PlotSeries {
  /** Stable identity for the series, used as the React key. */
  id: string;
  /** Legend label. */
  label: string;
  /** The sampled points, in plot coordinates. */
  points: Array<{ x: number; y: number }>;
  /**
   * Series colour. Use a semantic class such as `text-chart-1` or
   * `text-octave-4`; the stroke inherits `currentColor`.
   */
  colorClass: string;
  /** Draw as a dashed line (e.g. a reference or lifted curve). */
  dashed?: boolean;
}

interface PlotProps {
  series: PlotSeries[];
  /** Axis labels. */
  xLabel?: string;
  yLabel?: string;
  /** Fixed y-range; when omitted the range is derived from the data. */
  yDomain?: [number, number];
  /** Height of the drawing area in pixels. */
  height?: number;
  className?: string;
  /** Accessible description of what the plot shows. */
  ariaLabel: string;
}

const PAD = { top: 16, right: 16, bottom: 32, left: 44 };
const WIDTH = 640;

/** Format an axis tick compactly. */
function tick(value: number): string {
  if (Math.abs(value) >= 1000 || (value !== 0 && Math.abs(value) < 0.01)) {
    return value.toExponential(1);
  }
  return Number(value.toFixed(2)).toString();
}

/**
 * The shared plot primitive. Renders an SVG line chart with consistent
 * axes, grid, and series colours across every simulator page.
 */
export function Plot({
  series,
  xLabel = "x",
  yLabel = "y",
  yDomain,
  height = 280,
  className,
  ariaLabel,
}: PlotProps) {
  const clipId = useId();

  const { xMin, xMax, yMin, yMax, paths, ticks } = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const xLo = xs.length ? Math.min(...xs) : -1;
    const xHi = xs.length ? Math.max(...xs) : 1;
    const yLo = yDomain ? yDomain[0] : ys.length ? Math.min(...ys) : -1;
    const yHi = yDomain ? yDomain[1] : ys.length ? Math.max(...ys) : 1;

    const xSpan = xHi - xLo || 1;
    const ySpan = yHi - yLo || 1;
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;

    const sx = (x: number) => PAD.left + ((x - xLo) / xSpan) * innerW;
    const sy = (y: number) => PAD.top + innerH - ((y - yLo) / ySpan) * innerH;

    const built = series.map((s) => ({
      ...s,
      d: s.points
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`,
        )
        .join(" "),
    }));

    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const value = yLo + (ySpan * i) / 4;
      return { value, y: sy(value) };
    });
    const xTicks = Array.from({ length: 5 }, (_, i) => {
      const value = xLo + (xSpan * i) / 4;
      return { value, x: sx(value) };
    });

    return {
      xMin: xLo,
      xMax: xHi,
      yMin: yLo,
      yMax: yHi,
      paths: built,
      ticks: { y: yTicks, x: xTicks },
    };
  }, [series, yDomain, height]);

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        role="img"
        aria-label={ariaLabel}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x={PAD.left}
              y={PAD.top}
              width={WIDTH - PAD.left - PAD.right}
              height={height - PAD.top - PAD.bottom}
            />
          </clipPath>
        </defs>

        {/* Grid */}
        <g className="text-border" stroke="currentColor" strokeWidth={1}>
          {ticks.y.map((t) => (
            <line
              key={`gy-${t.value}`}
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={t.y}
              y2={t.y}
              opacity={0.5}
            />
          ))}
          {ticks.x.map((t) => (
            <line
              key={`gx-${t.value}`}
              y1={PAD.top}
              y2={height - PAD.bottom}
              x1={t.x}
              x2={t.x}
              opacity={0.5}
            />
          ))}
        </g>

        {/* Axes */}
        <g
          className="text-muted-foreground"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={height - PAD.bottom}
            y2={height - PAD.bottom}
          />
          <line
            x1={PAD.left}
            x2={PAD.left}
            y1={PAD.top}
            y2={height - PAD.bottom}
          />
        </g>

        {/* Tick labels */}
        <g className="fill-muted-foreground font-mono text-[10px]">
          {ticks.y.map((t) => (
            <text
              key={`ty-${t.value}`}
              x={PAD.left - 6}
              y={t.y + 3}
              textAnchor="end"
            >
              {tick(t.value)}
            </text>
          ))}
          {ticks.x.map((t) => (
            <text
              key={`tx-${t.value}`}
              x={t.x}
              y={height - PAD.bottom + 14}
              textAnchor="middle"
            >
              {tick(t.value)}
            </text>
          ))}
        </g>

        {/* Series */}
        <g clipPath={`url(#${clipId})`}>
          {paths.map((s) => (
            <path
              key={s.id}
              d={s.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? "6 5" : undefined}
              className={s.colorClass}
            />
          ))}
        </g>

        {/* Axis titles */}
        <text
          x={WIDTH - PAD.right}
          y={height - 4}
          textAnchor="end"
          className="fill-muted-foreground font-mono text-[10px]"
        >
          {xLabel}
        </text>
        <text
          x={PAD.left - 34}
          y={PAD.top + 4}
          className="fill-muted-foreground font-mono text-[10px]"
        >
          {yLabel}
        </text>
      </svg>

      {series.length > 1 && (
        <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {series.map((s) => (
            <span
              key={s.id}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span
                className={cn(
                  "inline-block h-0.5 w-5 rounded-full bg-current",
                  s.colorClass,
                )}
                aria-hidden="true"
              />
              {s.label}
            </span>
          ))}
        </figcaption>
      )}
      <span className="sr-only">
        {`Plot from x=${tick(xMin)} to x=${tick(xMax)}, y=${tick(yMin)} to y=${tick(yMax)}.`}
      </span>
    </figure>
  );
}
