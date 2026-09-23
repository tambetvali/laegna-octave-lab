/**
 * octave.ts — the canonical math core for the Laegna Octave Lab.
 *
 * Every page imports its mathematics from here; no page re-implements it.
 * All functions are pure and side-effect free.
 *
 * Vocabulary (the user's own framing):
 *   - octave        a doubling step; the natural unit of the rank space
 *   - integral level  how many times a quantity has been integrated (lifted)
 *   - order         the local behaviour of a function: zeroeth (frozen),
 *                   first (linear), second (curvature / frequency)
 *   - transcendence lifting a function one integral level up
 *   - rank space    the ladder of orders a quantity can occupy
 *   - love          the combination operator that fuses two ranks
 *   - base-4 digit  I / O / A / E — the four letters of the octave alphabet
 */

/** The four base-4 digits of the octave alphabet, in canonical order. */
export const BASE4_DIGITS = ["I", "O", "A", "E"] as const;

/** A single base-4 digit of the octave alphabet. */
export type Base4Digit = (typeof BASE4_DIGITS)[number];

/** The three local orders a quantity can occupy. */
export type Order = "zeroeth" | "first" | "second";

/** Human-readable labels for each order. */
export const ORDER_LABELS: Record<Order, string> = {
  zeroeth: "Zeroeth — frozen",
  first: "First — linear",
  second: "Second — curvature / frequency",
};

/** One-line descriptions of what each order means. */
export const ORDER_DESCRIPTIONS: Record<Order, string> = {
  zeroeth: "The constant term: the value held still, before any change.",
  first: "The linear term: steady drift, the tangent at a point.",
  second: "The curvature term: how the drift itself bends — frequency.",
};

/** The three home sites the theory is anchored to. */
export interface HomeSite {
  label: string;
  url: string;
  note: string;
}

export const HOME_SITES: HomeSite[] = [
  {
    label: "spireason.neocities.org",
    url: "https://spireason.neocities.org",
    note: "The spire — where the octave ladder is climbed.",
  },
  {
    label: "laegna.notaku.site",
    url: "https://laegna.notaku.site",
    note: "The notebook — where the theory is written down.",
  },
  {
    label: "github.com/tambetvali",
    url: "https://github.com/tambetvali",
    note: "The source — where the implementations live.",
  },
];

/** A point in the rank space: an integral level plus a local order. */
export interface RankPoint {
  /** How many times the quantity has been integrated (lifted). */
  integralLevel: number;
  /** The local behaviour at this level. */
  order: Order;
}

/** The full parameter set shared by the calculator and every page. */
export interface OctaveParams {
  /** Integral order / level — how far up the ladder we have climbed. */
  integralLevel: number;
  /** Base-4 digit currently selected in the I/O/A/E alphabet. */
  digit: Base4Digit;
  /** Scan index k — the discrete step along the octave. */
  k: number;
  /** Scan length L — how many octaves the scan spans. */
  L: number;
  /** Zoom — the resolution of the scan. */
  zoom: number;
  /** The local order under inspection. */
  order: Order;
}

/** The default parameter set the app opens with. */
export const DEFAULT_PARAMS: OctaveParams = {
  integralLevel: 0,
  digit: "I",
  k: 0,
  L: 4,
  zoom: 1,
  order: "first",
};

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ------------------------------------------------------------------ *
 * Base-4 digit encode / decode
 * ------------------------------------------------------------------ */

/** Encode a base-4 digit to its numeric value (I=0, O=1, A=2, E=3). */
export function digitToValue(digit: Base4Digit): number {
  return BASE4_DIGITS.indexOf(digit);
}

/** Decode a numeric value (0–3) back to its base-4 digit. */
export function valueToDigit(value: number): Base4Digit {
  const index = ((Math.round(value) % 4) + 4) % 4;
  return BASE4_DIGITS[index];
}

/**
 * Encode a non-negative integer as a base-4 string of I/O/A/E digits.
 * `0` encodes to `"I"`.
 */
export function encodeBase4(value: number): string {
  let n = Math.max(0, Math.floor(value));
  if (n === 0) return BASE4_DIGITS[0];
  let out = "";
  while (n > 0) {
    out = BASE4_DIGITS[n % 4] + out;
    n = Math.floor(n / 4);
  }
  return out;
}

/** Decode a base-4 string of I/O/A/E digits back to an integer. */
export function decodeBase4(text: string): number {
  let value = 0;
  for (const char of text.toUpperCase()) {
    const index = BASE4_DIGITS.indexOf(char as Base4Digit);
    if (index < 0) continue;
    value = value * 4 + index;
  }
  return value;
}

/* ------------------------------------------------------------------ *
 * The rank-space ladder
 * ------------------------------------------------------------------ */

/**
 * Evaluate the canonical rank-space function at a point.
 *
 * The ladder is built from one base function, `f(x) = x`, lifted by the
 * integral level:
 *   - zeroeth order  → the constant term, `level`
 *   - first order    → the linear term, `level + x`
 *   - second order   → the curvature term, `level + x + x²/2`
 *
 * Higher integral levels scale the whole expression, so climbing the
 * ladder visibly lifts the curve without changing its shape.
 */
export function rankValue(x: number, params: OctaveParams): number {
  const level = params.integralLevel;
  const lift = 1 + level * 0.5;
  switch (params.order) {
    case "zeroeth":
      return level;
    case "first":
      return (level + x) * lift;
    case "second":
      return (level + x + (x * x) / 2) * lift;
  }
}

/** Sample the rank-space function across `[-L, L]` at `zoom` resolution. */
export function sampleRank(
  params: OctaveParams,
  samples = 120,
): Array<{ x: number; y: number }> {
  const span = Math.max(1, params.L);
  const count = clamp(Math.round(samples * params.zoom), 8, 600);
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i += 1) {
    const x = -span + (2 * span * i) / (count - 1);
    points.push({ x, y: rankValue(x, params) });
  }
  return points;
}

/* ------------------------------------------------------------------ *
 * Transcendence — lifting a function one integral level up
 * ------------------------------------------------------------------ */

/**
 * Lift a sampled function one integral level up by numerical integration
 * (the trapezoid rule). This is the transcendence map: it turns a curve
 * into the curve whose slope is that curve.
 *
 * The result is normalised so it starts at zero, which keeps the lifted
 * curve comparable to the original on the same axes.
 */
export function transcend(
  points: Array<{ x: number; y: number }>,
): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];
  const out: Array<{ x: number; y: number }> = [{ x: points[0].x, y: 0 }];
  let acc = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    acc += ((points[i].y + points[i - 1].y) / 2) * dx;
    out.push({ x: points[i].x, y: acc });
  }
  return out;
}

/** Descend one integral level by numerical differentiation (central difference). */
export function descend(
  points: Array<{ x: number; y: number }>,
): Array<{ x: number; y: number }> {
  if (points.length < 2) return points.map((p) => ({ x: p.x, y: 0 }));
  return points.map((point, i) => {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next.x - prev.x;
    return { x: point.x, y: dx === 0 ? 0 : (next.y - prev.y) / dx };
  });
}

/* ------------------------------------------------------------------ *
 * Love — the combination operator
 * ------------------------------------------------------------------ */

/**
 * Combine two rank values with the love operator: a weighted blend that
 * favours the higher rank as the integral level rises. At level 0 the
 * blend is even; each level shifts weight toward `b`.
 */
export function love(a: number, b: number, integralLevel: number): number {
  const w = clamp(0.5 + integralLevel * 0.1, 0, 1);
  return a * (1 - w) + b * w;
}

/* ------------------------------------------------------------------ *
 * The k / L / zoom scan readout
 * ------------------------------------------------------------------ */

/** A single row of the scan readout. */
export interface ScanRow {
  /** The octave index along the scan. */
  k: number;
  /** The octave value, `2^k`. */
  octave: number;
  /** The rank value at this octave. */
  value: number;
  /** The base-4 encoding of the octave index. */
  base4: string;
}

/** The full scan readout for the current parameters. */
export interface ScanReadout {
  rows: ScanRow[];
  /** The step between adjacent octaves, `1 / zoom`. */
  step: number;
  /** The total span covered, `L` octaves. */
  span: number;
  /** The value at the current scan index k. */
  current: ScanRow;
}

/**
 * Build the k / L / zoom scan readout: `L` octaves sampled at `zoom`
 * resolution, each row carrying its octave value, rank value, and base-4
 * encoding. `k` selects the current row.
 */
export function scanReadout(params: OctaveParams): ScanReadout {
  const span = Math.max(1, Math.round(params.L));
  const step = 1 / Math.max(1, params.zoom);
  const rows: ScanRow[] = [];
  for (let i = 0; i <= span; i += step) {
    const k = Math.round(i);
    const octave = 2 ** k;
    rows.push({
      k,
      octave,
      value: rankValue(k, params),
      base4: encodeBase4(k),
    });
  }
  const currentIndex = clamp(Math.round(params.k), 0, rows.length - 1);
  return { rows, step, span, current: rows[currentIndex] };
}

/** The octave value `2^k` for a scan index. */
export function octaveValue(k: number): number {
  return 2 ** k;
}

/** Format a number for a readout: compact, fixed precision, no trailing noise. */
export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1000 || abs < 0.001) return value.toExponential(2);
  return value.toFixed(digits).replace(/\.?0+$/, "");
}
