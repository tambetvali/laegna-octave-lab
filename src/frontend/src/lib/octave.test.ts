import {
  BASE4_DIGITS,
  DEFAULT_PARAMS,
  type OctaveParams,
  decodeBase4,
  digitToValue,
  encodeBase4,
  formatNumber,
  love,
  octaveValue,
  rankValue,
  sampleRank,
  scanReadout,
  transcend,
  valueToDigit,
} from "@/lib/octave";
import { describe, expect, it } from "vitest";

/** Build params from the defaults with overrides. */
function params(overrides: Partial<OctaveParams> = {}): OctaveParams {
  return { ...DEFAULT_PARAMS, ...overrides };
}

describe("base-4 octave alphabet", () => {
  it("maps the four digits to 0..3 and back", () => {
    expect(BASE4_DIGITS).toEqual(["I", "O", "A", "E"]);
    expect(BASE4_DIGITS.map(digitToValue)).toEqual([0, 1, 2, 3]);
    expect([0, 1, 2, 3].map(valueToDigit)).toEqual(["I", "O", "A", "E"]);
  });

  it("encodes and decodes integers round-trip", () => {
    expect(encodeBase4(0)).toBe("I");
    expect(encodeBase4(4)).toBe("OI");
    expect(decodeBase4("OI")).toBe(4);
    for (const n of [0, 1, 3, 4, 15, 16, 255]) {
      expect(decodeBase4(encodeBase4(n))).toBe(n);
    }
  });
});

describe("rankValue — the order mapping", () => {
  it("holds the constant term still at zeroeth order", () => {
    // Constant → zero: the value does not depend on x.
    expect(rankValue(-3, params({ order: "zeroeth", integralLevel: 2 }))).toBe(
      2,
    );
    expect(rankValue(7, params({ order: "zeroeth", integralLevel: 2 }))).toBe(
      2,
    );
  });

  it("grows linearly at first order", () => {
    // Linear → linear: equal x steps give equal value steps.
    const p = params({ order: "first", integralLevel: 0 });
    expect(rankValue(0, p)).toBe(0);
    expect(rankValue(1, p)).toBe(1);
    expect(rankValue(2, p)).toBe(2);
    expect(rankValue(3, p) - rankValue(2, p)).toBe(
      rankValue(1, p) - rankValue(0, p),
    );
  });

  it("curves at second order", () => {
    // Exponential/curvature → exponential: the step itself grows.
    const p = params({ order: "second", integralLevel: 0 });
    const d1 = rankValue(1, p) - rankValue(0, p);
    const d2 = rankValue(2, p) - rankValue(1, p);
    expect(d2).toBeGreaterThan(d1);
  });

  it("lifts the whole expression as the integral level rises", () => {
    const low = rankValue(2, params({ order: "first", integralLevel: 0 }));
    const high = rankValue(2, params({ order: "first", integralLevel: 4 }));
    expect(high).toBeGreaterThan(low);
  });
});

describe("transcend — lifting one integral level", () => {
  it("returns an empty curve for empty input", () => {
    expect(transcend([])).toEqual([]);
  });

  it("starts the lifted curve at zero and accumulates the area", () => {
    const base = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ];
    const lifted = transcend(base);
    expect(lifted[0]).toEqual({ x: 0, y: 0 });
    // Trapezoid over a constant 1 gives the running x.
    expect(lifted[1].y).toBeCloseTo(1);
    expect(lifted[2].y).toBeCloseTo(2);
  });

  it("makes a constant base into a linear lift", () => {
    const base = sampleRank(params({ order: "zeroeth", integralLevel: 3 }));
    const lifted = transcend(base);
    const d1 = lifted[1].y - lifted[0].y;
    const d2 = lifted[2].y - lifted[1].y;
    expect(d2).toBeCloseTo(d1, 5);
  });
});

describe("love — the combination operator", () => {
  it("blends evenly at level zero", () => {
    expect(love(2, 8, 0)).toBeCloseTo(5);
  });

  it("favours the higher rank as the level rises", () => {
    expect(love(2, 8, 5)).toBeGreaterThan(love(2, 8, 0));
  });
});

describe("scanReadout", () => {
  it("builds L octaves with base-4 encodings and a current row", () => {
    const scan = scanReadout(params({ L: 4, k: 2, zoom: 1 }));
    expect(scan.span).toBe(4);
    expect(scan.rows).toHaveLength(5);
    expect(scan.rows[0].octave).toBe(1);
    expect(scan.rows[4].octave).toBe(16);
    expect(scan.current.k).toBe(2);
  });

  it("computes the octave value as 2^k", () => {
    expect(octaveValue(0)).toBe(1);
    expect(octaveValue(3)).toBe(8);
  });
});

describe("formatNumber", () => {
  it("formats finite values compactly and marks non-finite ones", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1.5)).toBe("1.5");
    expect(formatNumber(Number.NaN)).toBe("—");
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("—");
  });
});
