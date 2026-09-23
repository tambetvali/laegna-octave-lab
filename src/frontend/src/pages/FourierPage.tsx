import { OctaveCalculator } from "@/components/OctaveCalculator";
import { Plot, type PlotSeries } from "@/components/Plot";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { clamp, formatNumber, sampleRank } from "@/lib/octave";
import { cn } from "@/lib/utils";
import { useOctaveStore } from "@/store/octave-store";
import { useMemo, useState } from "react";

/** One frequency component of the decomposition. */
interface Component {
  /** Harmonic index, 1-based. */
  harmonic: number;
  /** Angular frequency. */
  omega: number;
  /** Amplitude of this component. */
  amplitude: number;
  /** Phase offset. */
  phase: number;
}

/** A single row of the dominant-frequency readout. */
interface FrequencyRow {
  harmonic: number;
  omega: number;
  amplitude: number;
  share: number;
}

/** Static series colours, cycled across components. */
const COMPONENT_COLORS = [
  "text-chart-1",
  "text-chart-2",
  "text-chart-3",
  "text-chart-4",
  "text-chart-5",
];

/** Static heatmap fill classes, low → high intensity. */
const HEATMAP_RAMP = [
  "fill-octave-0",
  "fill-octave-1",
  "fill-octave-2",
  "fill-octave-3",
  "fill-octave-4",
  "fill-octave-5",
];

/** Grid resolution of the 2D curvature field. */
const GRID = 21;

/** One principal-axis component of the 2D decomposition. */
interface AxisComponent {
  /** 1-based index, ordered by amplitude. */
  index: number;
  /** Principal-axis angle in radians. */
  angle: number;
  /** Width (standard deviation) along the principal axis. */
  width: number;
  /** Peak amplitude of this component. */
  amplitude: number;
  /** Share of the total amplitude. */
  share: number;
}

/** A single cell of the 2D curvature field. */
interface FieldCell {
  x: number;
  y: number;
  value: number;
}

/**
 * Build the 2D curvature field: an anisotropic (different width along each
 * axis) Gaussian rotated by `angle`, sampled on a square grid. This is the
 * genuinely non-symmetric two-dimensional curvature that the 1D envelope
 * cannot express.
 */
function buildField(
  span: number,
  widthX: number,
  widthY: number,
  angle: number,
): FieldCell[] {
  const cells: FieldCell[] = [];
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let iy = 0; iy < GRID; iy += 1) {
    const y = -span + (2 * span * iy) / (GRID - 1);
    for (let ix = 0; ix < GRID; ix += 1) {
      const x = -span + (2 * span * ix) / (GRID - 1);
      // Rotate the sample point into the Gaussian's principal frame.
      const u = x * cos + y * sin;
      const v = -x * sin + y * cos;
      const value = Math.exp(
        -(u * u) / (2 * widthX * widthX) - (v * v) / (2 * widthY * widthY),
      );
      cells.push({ x, y, value });
    }
  }
  return cells;
}

/**
 * Decompose the rotated anisotropic Gaussian into its principal-axis
 * components. The principal axes are the eigenvectors of the covariance
 * matrix, so the widths are the two standard deviations and the amplitudes
 * are the peak heights along each axis.
 */
function decomposeField(
  widthX: number,
  widthY: number,
  angle: number,
): AxisComponent[] {
  const raw = [
    { width: widthX, angle },
    { width: widthY, angle: angle + Math.PI / 2 },
  ];
  const total = raw.reduce((acc, c) => acc + c.width, 0) || 1;
  return raw
    .map((c, i) => ({
      index: i + 1,
      angle: c.angle,
      width: c.width,
      amplitude: 1 / (2 * Math.PI * c.width),
      share: c.width / total,
    }))
    .sort((a, b) => b.width - a.width)
    .map((c, i) => ({ ...c, index: i + 1 }));
}

/**
 * The Fourier & Gaussian decomposition playground. Decomposes the current
 * rank curve into simple frequency components, rebuilds it from those
 * components, and shows how a Gaussian envelope simplifies the curvature.
 */
export function FourierPage() {
  const params = useOctaveStore((s) => s.params);

  const [components, setComponents] = useState(4);
  const [gaussianWidth, setGaussianWidth] = useState(1.2);
  const [dimension, setDimension] = useState<"1d" | "2d">("1d");
  const [anisotropy, setAnisotropy] = useState(2.4);
  const [rotation, setRotation] = useState(35);

  const base = useMemo(() => sampleRank(params), [params]);

  const decomposition = useMemo(() => {
    const span = Math.max(1, params.L);
    const count = clamp(Math.round(120 * params.zoom), 8, 600);
    const xs: number[] = [];
    for (let i = 0; i < count; i += 1) {
      xs.push(-span + (2 * span * i) / (count - 1));
    }

    // Project the base curve onto the first `components` harmonics.
    const built: Component[] = [];
    for (let h = 1; h <= components; h += 1) {
      const omega = (h * Math.PI) / span;
      let cosSum = 0;
      let sinSum = 0;
      for (let i = 0; i < xs.length; i += 1) {
        cosSum += base[i].y * Math.cos(omega * xs[i]);
        sinSum += base[i].y * Math.sin(omega * xs[i]);
      }
      const a = (2 * cosSum) / xs.length;
      const b = (2 * sinSum) / xs.length;
      built.push({
        harmonic: h,
        omega,
        amplitude: Math.hypot(a, b),
        phase: Math.atan2(b, a),
      });
    }

    const componentSeries: PlotSeries[] = built.map((c, i) => ({
      id: `component-${c.harmonic}`,
      label: `ω${c.harmonic} = ${formatNumber(c.omega, 2)}`,
      points: xs.map((x) => ({
        x,
        y: c.amplitude * Math.cos(c.omega * x - c.phase),
      })),
      colorClass: COMPONENT_COLORS[i % COMPONENT_COLORS.length],
      dashed: true,
    }));

    const reconstruction = xs.map((x) => {
      let sum = 0;
      for (const c of built) {
        sum += c.amplitude * Math.cos(c.omega * x - c.phase);
      }
      return { x, y: sum };
    });

    const totalAmplitude = built.reduce((acc, c) => acc + c.amplitude, 0) || 1;
    const rows: FrequencyRow[] = built
      .map((c) => ({
        harmonic: c.harmonic,
        omega: c.omega,
        amplitude: c.amplitude,
        share: c.amplitude / totalAmplitude,
      }))
      .sort((a, b) => b.amplitude - a.amplitude);

    return { componentSeries, reconstruction, rows };
  }, [base, components, params.L, params.zoom]);

  const gaussian = useMemo(() => {
    const span = Math.max(1, params.L);
    const count = clamp(Math.round(120 * params.zoom), 8, 600);
    const width = Math.max(0.2, gaussianWidth);
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i += 1) {
      const x = -span + (2 * span * i) / (count - 1);
      points.push({ x, y: Math.exp(-(x * x) / (2 * width * width)) });
    }
    return points;
  }, [gaussianWidth, params.L, params.zoom]);

  const smoothed = useMemo(
    () =>
      base.map((p, i) => ({
        x: p.x,
        y: p.y * (gaussian[i]?.y ?? 1),
      })),
    [base, gaussian],
  );

  const mainSeries = useMemo<PlotSeries[]>(
    () => [
      {
        id: "original",
        label: "Original rank curve",
        points: base,
        colorClass: "text-foreground",
      },
      {
        id: "reconstruction",
        label: `Reconstruction — ${components} components`,
        points: decomposition.reconstruction,
        colorClass: "text-concept-frequency",
      },
      ...decomposition.componentSeries,
    ],
    [base, components, decomposition],
  );

  const gaussianSeries = useMemo<PlotSeries[]>(
    () => [
      {
        id: "smoothed",
        label: "Gaussian-smoothed curve",
        points: smoothed,
        colorClass: "text-concept-frequency",
      },
      {
        id: "envelope",
        label: `Gaussian envelope — width ${formatNumber(gaussianWidth, 2)}`,
        points: gaussian,
        colorClass: "text-chart-4",
        dashed: true,
      },
    ],
    [gaussian, gaussianWidth, smoothed],
  );

  const dominant = decomposition.rows[0];
  const topShare = decomposition.rows
    .slice(0, 3)
    .reduce((acc, r) => acc + r.share, 0);

  // --- 2D curvature: an anisotropic, rotated Gaussian field -------------
  const fieldSpan = Math.max(1, params.L);
  const widthX = Math.max(0.2, gaussianWidth);
  const widthY = Math.max(0.2, gaussianWidth * anisotropy);
  const angleRad = (rotation * Math.PI) / 180;

  const field = useMemo(
    () => buildField(fieldSpan, widthX, widthY, angleRad),
    [fieldSpan, widthX, widthY, angleRad],
  );

  const axes = useMemo(
    () => decomposeField(widthX, widthY, angleRad),
    [widthX, widthY, angleRad],
  );

  const fieldMax = useMemo(
    () => field.reduce((acc, c) => Math.max(acc, c.value), 0) || 1,
    [field],
  );

  const dominantAxis = axes[0];
  const minorAxis = axes[1];
  const aspect = widthY / widthX;

  // The 1D envelope sampled along the field's principal axis, so the two
  // views can be compared on the same footing.
  const axisProfile = useMemo(() => {
    const count = clamp(Math.round(120 * params.zoom), 8, 600);
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i += 1) {
      const t = -fieldSpan + (2 * fieldSpan * i) / (count - 1);
      points.push({
        x: t,
        y: Math.exp(-(t * t) / (2 * widthX * widthX)),
      });
    }
    return points;
  }, [fieldSpan, widthX, params.zoom]);

  const crossProfile = useMemo(() => {
    const count = clamp(Math.round(120 * params.zoom), 8, 600);
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i += 1) {
      const t = -fieldSpan + (2 * fieldSpan * i) / (count - 1);
      points.push({
        x: t,
        y: Math.exp(-(t * t) / (2 * widthY * widthY)),
      });
    }
    return points;
  }, [fieldSpan, widthY, params.zoom]);

  const profileSeries = useMemo<PlotSeries[]>(
    () => [
      {
        id: "major",
        label: `Principal axis — width ${formatNumber(widthX, 2)}`,
        points: axisProfile,
        colorClass: "text-concept-frequency",
      },
      {
        id: "minor",
        label: `Cross axis — width ${formatNumber(widthY, 2)}`,
        points: crossProfile,
        colorClass: "text-chart-4",
        dashed: true,
      },
    ],
    [axisProfile, crossProfile, widthX, widthY],
  );

  // Heatmap geometry: the field is drawn in the same coordinate frame as
  // the 1D plots so the two views share an axis.
  const heat = useMemo(() => {
    const size = 320;
    const pad = 28;
    const inner = size - pad * 2;
    const cell = inner / (GRID - 1);
    const sx = (x: number) => pad + ((x + fieldSpan) / (2 * fieldSpan)) * inner;
    const sy = (y: number) =>
      pad + inner - ((y + fieldSpan) / (2 * fieldSpan)) * inner;
    const cells = field.map((c) => {
      const level = clamp(
        Math.floor((c.value / fieldMax) * HEATMAP_RAMP.length),
        0,
        HEATMAP_RAMP.length - 1,
      );
      return {
        key: `${c.x.toFixed(3)}:${c.y.toFixed(3)}`,
        x: sx(c.x) - cell / 2,
        y: sy(c.y) - cell / 2,
        size: cell * 1.02,
        fill: HEATMAP_RAMP[level],
        value: c.value,
      };
    });
    // Principal axes drawn through the centre of the field.
    const cx = sx(0);
    const cy = sy(0);
    const reach = inner / 2;
    const axisLines = axes.map((a) => ({
      key: `axis-${a.index}`,
      x1: cx - Math.cos(a.angle) * reach,
      y1: cy + Math.sin(a.angle) * reach,
      x2: cx + Math.cos(a.angle) * reach,
      y2: cy - Math.sin(a.angle) * reach,
      colorClass: a.index === 1 ? "text-concept-frequency" : "text-chart-4",
    }));
    return { size, pad, inner, cells, axisLines, cx, cy };
  }, [field, fieldMax, fieldSpan, axes]);

  const fieldRows = useMemo(() => {
    const total = axes.reduce((acc, a) => acc + a.amplitude, 0) || 1;
    return axes.map((a) => ({
      ...a,
      share: a.amplitude / total,
    }));
  }, [axes]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Theory page · frequency
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Fourier &amp; Gaussian playground
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Second order is curvature, and curvature is frequency. Any curve on
          the differential-linear-exponential space can be componentized into
          simple frequencies. Here you decompose the current rank curve, rebuild
          it from its components, and simplify its non-symmetric curvature with
          a Gaussian.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Controls */}
          <section
            className="surface-input p-5"
            aria-label="Decomposition controls"
            data-ocid="fourier.controls"
          >
            <h2 className="font-display text-lg font-semibold">
              Decomposition controls
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              The signal is the rank curve from the shared calculator. Choose
              how many components to fit and how wide the Gaussian is.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <Label
                    htmlFor="fourier-components"
                    className="text-xs uppercase tracking-widest"
                  >
                    Components
                  </Label>
                  <span
                    className="readout text-sm text-primary"
                    data-ocid="fourier.components_value"
                  >
                    {components}
                  </span>
                </div>
                <Slider
                  id="fourier-components"
                  value={[components]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={([v]) => setComponents(v)}
                  aria-label="Number of components"
                  data-ocid="fourier.components_slider"
                />
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <Label
                    htmlFor="fourier-gaussian"
                    className="text-xs uppercase tracking-widest"
                  >
                    Gaussian width
                  </Label>
                  <span
                    className="readout text-sm text-primary"
                    data-ocid="fourier.gaussian_value"
                  >
                    {formatNumber(gaussianWidth, 2)}
                  </span>
                </div>
                <Slider
                  id="fourier-gaussian"
                  value={[gaussianWidth]}
                  min={0.2}
                  max={3}
                  step={0.1}
                  onValueChange={([v]) => setGaussianWidth(v)}
                  aria-label="Gaussian width"
                  data-ocid="fourier.gaussian_slider"
                />
              </div>
            </div>

            <div className="mt-5">
              <span className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                Curvature view
              </span>
              <fieldset
                className="grid grid-cols-2 gap-2"
                data-ocid="fourier.dimension_group"
              >
                <legend className="sr-only">Curvature view</legend>
                {(["1d", "2d"] as const).map((dim, i) => {
                  const active = dimension === dim;
                  return (
                    <label
                      key={dim}
                      data-ocid={`fourier.dimension.${i + 1}`}
                      className={cn(
                        "surface-input cursor-pointer px-3 py-2 text-center text-xs font-medium transition-smooth",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      <input
                        type="radio"
                        name="fourier-dimension"
                        value={dim}
                        checked={active}
                        onChange={() => setDimension(dim)}
                        className="sr-only"
                      />
                      {dim === "1d" ? "1D curvature" : "2D curvature"}
                    </label>
                  );
                })}
              </fieldset>
            </div>

            {dimension === "2d" && (
              <div
                className="mt-5 grid gap-5 md:grid-cols-2"
                data-ocid="fourier.2d_controls"
              >
                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <Label
                      htmlFor="fourier-anisotropy"
                      className="text-xs uppercase tracking-widest"
                    >
                      Anisotropy
                    </Label>
                    <span
                      className="readout text-sm text-primary"
                      data-ocid="fourier.anisotropy_value"
                    >
                      {formatNumber(anisotropy, 2)}×
                    </span>
                  </div>
                  <Slider
                    id="fourier-anisotropy"
                    value={[anisotropy]}
                    min={1}
                    max={4}
                    step={0.1}
                    onValueChange={([v]) => setAnisotropy(v)}
                    aria-label="Anisotropy — width ratio between the two axes"
                    data-ocid="fourier.anisotropy_slider"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <Label
                      htmlFor="fourier-rotation"
                      className="text-xs uppercase tracking-widest"
                    >
                      Rotation
                    </Label>
                    <span
                      className="readout text-sm text-primary"
                      data-ocid="fourier.rotation_value"
                    >
                      {rotation}°
                    </span>
                  </div>
                  <Slider
                    id="fourier-rotation"
                    value={[rotation]}
                    min={0}
                    max={90}
                    step={1}
                    onValueChange={([v]) => setRotation(v)}
                    aria-label="Rotation of the curvature field in degrees"
                    data-ocid="fourier.rotation_slider"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Reconstruction plot */}
          <section
            className="surface-output p-5"
            aria-label="Fourier reconstruction"
            data-ocid="fourier.plot_panel"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">
                Original vs reconstruction
              </h2>
              <Badge variant="secondary" className="readout text-[10px]">
                {components} component{components === 1 ? "" : "s"}
              </Badge>
            </div>
            <Plot
              series={mainSeries}
              xLabel="x"
              yLabel="rank value"
              height={300}
              ariaLabel={`The original rank curve with its reconstruction from ${components} frequency components and each component shown separately.`}
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The solid curve is the original signal; the cyan curve is the
              reconstruction from{" "}
              <span className="readout text-foreground">{components}</span>{" "}
              simple frequencies. The dashed curves are the individual
              components. Add components and the reconstruction tightens around
              the original — that is the decomposition becoming complete.
            </p>
          </section>

          {/* Gaussian plot */}
          <section
            className="surface-output p-5"
            aria-label="Gaussian simplification"
            data-ocid="fourier.gaussian_panel"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">
                Gaussian simplification
              </h2>
              <Badge variant="secondary" className="readout text-[10px]">
                {dimension === "1d" ? "1D curvature" : "2D curvature"}
              </Badge>
            </div>

            {dimension === "1d" ? (
              <>
                <Plot
                  series={gaussianSeries}
                  xLabel="x"
                  yLabel="amplitude"
                  height={260}
                  ariaLabel="The rank curve smoothed by a Gaussian envelope, with the envelope itself shown dashed."
                />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  In one dimension the Gaussian is a single smooth bump.
                  Multiplying the curve by it tames the sharp curvature at the
                  edges, leaving the simple frequency underneath.
                </p>
              </>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                  <figure className="w-full">
                    <svg
                      viewBox={`0 0 ${heat.size} ${heat.size}`}
                      className="w-full"
                      role="img"
                      aria-label={`A two-dimensional curvature field: an anisotropic Gaussian ${formatNumber(aspect, 2)} times wider along its cross axis than its principal axis, rotated ${rotation} degrees. The principal axis is drawn in cyan and the cross axis dashed.`}
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <g>
                        {heat.cells.map((c) => (
                          <rect
                            key={c.key}
                            x={c.x}
                            y={c.y}
                            width={c.size}
                            height={c.size}
                            className={c.fill}
                            opacity={0.15 + 0.85 * (c.value / fieldMax)}
                          />
                        ))}
                      </g>
                      <g
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                      >
                        {heat.axisLines.map((a) => (
                          <line
                            key={a.key}
                            x1={a.x1}
                            y1={a.y1}
                            x2={a.x2}
                            y2={a.y2}
                            className={a.colorClass}
                            strokeDasharray={
                              a.colorClass === "text-chart-4"
                                ? "6 5"
                                : undefined
                            }
                          />
                        ))}
                      </g>
                      <circle
                        cx={heat.cx}
                        cy={heat.cy}
                        r={3}
                        className="fill-foreground"
                      />
                      <text
                        x={heat.size - heat.pad}
                        y={heat.size - 6}
                        textAnchor="end"
                        className="fill-muted-foreground font-mono text-[10px]"
                      >
                        x
                      </text>
                      <text
                        x={6}
                        y={heat.pad - 10}
                        className="fill-muted-foreground font-mono text-[10px]"
                      >
                        y
                      </text>
                    </svg>
                    <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className="inline-block h-0.5 w-5 rounded-full bg-current text-concept-frequency"
                          aria-hidden="true"
                        />
                        Principal axis — width {formatNumber(widthX, 2)}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className="inline-block h-0.5 w-5 rounded-full bg-current text-chart-4"
                          aria-hidden="true"
                        />
                        Cross axis — width {formatNumber(widthY, 2)}
                      </span>
                    </figcaption>
                  </figure>

                  <div className="space-y-4">
                    <Plot
                      series={profileSeries}
                      xLabel="distance along axis"
                      yLabel="amplitude"
                      height={220}
                      ariaLabel="The two principal-axis profiles of the 2D field: a narrow principal axis and a wider cross axis."
                    />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      In two dimensions the same Gaussian becomes an anisotropic
                      field:{" "}
                      <span className="readout text-foreground">
                        {formatNumber(aspect, 2)}×
                      </span>{" "}
                      wider along its cross axis than its principal axis, and
                      rotated{" "}
                      <span className="readout text-foreground">
                        {rotation}°
                      </span>
                      . The non-symmetric curvature reduces to two simple
                      frequencies — one per principal axis — with widths{" "}
                      <span className="readout text-foreground">
                        {formatNumber(widthX, 2)}
                      </span>{" "}
                      and{" "}
                      <span className="readout text-foreground">
                        {formatNumber(widthY, 2)}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Dominant frequencies */}
          <section
            className="surface-output p-5"
            aria-label="Dominant frequencies"
            data-ocid="fourier.readout_panel"
          >
            <h2 className="font-display text-lg font-semibold">
              Dominant frequencies
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {dimension === "1d"
                ? "Components ordered by amplitude. Share is each component's portion of the total."
                : "Principal-axis components of the 2D field, ordered by amplitude. Share is each axis's portion of the total."}
            </p>
            <div className="mt-4 overflow-x-auto">
              {dimension === "1d" ? (
                <table className="w-full text-sm" data-ocid="fourier.table">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Harmonic
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-4 text-right font-medium"
                      >
                        ω
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-4 text-right font-medium"
                      >
                        Amplitude
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {decomposition.rows.map((row, i) => (
                      <tr
                        key={row.harmonic}
                        data-ocid={`fourier.row.${i + 1}`}
                        className={cn(
                          "border-b border-border/60 last:border-0",
                          i === 0 && "bg-primary/10",
                        )}
                      >
                        <td className="readout py-2 pr-4 text-foreground">
                          {row.harmonic}
                        </td>
                        <td className="readout py-2 pr-4 text-right text-muted-foreground">
                          {formatNumber(row.omega, 2)}
                        </td>
                        <td className="readout py-2 pr-4 text-right text-foreground">
                          {formatNumber(row.amplitude)}
                        </td>
                        <td className="readout py-2 text-right text-primary">
                          {(row.share * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm" data-ocid="fourier.table">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Axis
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-4 text-right font-medium"
                      >
                        Angle
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-4 text-right font-medium"
                      >
                        Width
                      </th>
                      <th
                        scope="col"
                        className="py-2 pr-4 text-right font-medium"
                      >
                        Amplitude
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldRows.map((row, i) => (
                      <tr
                        key={row.index}
                        data-ocid={`fourier.row.${i + 1}`}
                        className={cn(
                          "border-b border-border/60 last:border-0",
                          i === 0 && "bg-primary/10",
                        )}
                      >
                        <td className="readout py-2 pr-4 text-foreground">
                          {i === 0 ? "Principal" : "Cross"}
                        </td>
                        <td className="readout py-2 pr-4 text-right text-muted-foreground">
                          {formatNumber((row.angle * 180) / Math.PI, 1)}°
                        </td>
                        <td className="readout py-2 pr-4 text-right text-foreground">
                          {formatNumber(row.width, 2)}
                        </td>
                        <td className="readout py-2 pr-4 text-right text-foreground">
                          {formatNumber(row.amplitude)}
                        </td>
                        <td className="readout py-2 text-right text-primary">
                          {(row.share * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {dimension === "1d"
                ? dominant
                  ? `The dominant component is harmonic ${dominant.harmonic} at ω = ${formatNumber(dominant.omega, 2)}, carrying ${(dominant.share * 100).toFixed(0)}% of the amplitude. The top three components together account for ${(topShare * 100).toFixed(0)}% — so the curve is mostly a few simple frequencies, with the rest as fine detail.`
                  : "No components are fitted yet."
                : dominantAxis
                  ? `The 2D field reduces to two principal-axis frequencies. The dominant one runs at ${formatNumber((dominantAxis.angle * 180) / Math.PI, 1)}° with width ${formatNumber(dominantAxis.width, 2)}, carrying ${(dominantAxis.share * 100).toFixed(0)}% of the amplitude; the cross axis at ${formatNumber((minorAxis.angle * 180) / Math.PI, 1)}° is ${formatNumber(aspect, 2)}× wider. The non-symmetric, rotated curvature is exactly these two simple frequencies.`
                  : "No components are fitted yet."}
            </p>
          </section>
        </div>

        <OctaveCalculator />
      </div>
    </div>
  );
}
