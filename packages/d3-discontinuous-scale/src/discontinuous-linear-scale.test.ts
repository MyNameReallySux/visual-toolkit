import { describe, expect, it } from "vitest";
import { makeDiscontinuousLinearScale } from "./discontinuous-linear-scale.js";

const numericDistance = (a: number, b: number) => a - b;
const relativeFromDistance = (value: number, distance: number) => value - distance;
const convertKey = (n: number) => String(n);

describe("makeDiscontinuousLinearScale — contiguous domain", () => {
  // values 0,1,2 with start=0, span=100 → last tick lands at 0+100=100
  const scale = makeDiscontinuousLinearScale([0, 1, 2], {
    range: { start: 0, span: 100 },
    selectValue: (d) => d,
    convertValueToKey: convertKey,
    calculateDistance: numericDistance,
    getRelativeValueFromDistance: relativeFromDistance,
  });

  it("getX(0) maps to 0", () => {
    expect(scale.getX(0)).toBeCloseTo(0);
  });

  it("getX(1) maps to 50", () => {
    expect(scale.getX(1)).toBeCloseTo(50);
  });

  it("getX(2) maps to start+span = 100", () => {
    expect(scale.getX(2)).toBeCloseTo(100);
  });

  it("callable form returns {x} object", () => {
    const out = scale(1);
    expect(out).toHaveProperty("x");
    expect(out?.x).toBeCloseTo(50);
  });

  it("getBin(1) is not a skip bin", () => {
    const bin = scale.getBin(1);
    expect(bin?.isSkip).toBe(false);
  });

  it("getTicks returns an array of arrays", () => {
    const ticks = scale.getTicks();
    expect(Array.isArray(ticks)).toBe(true);
    expect(ticks.length).toBeGreaterThan(0);
    expect(Array.isArray(ticks[0])).toBe(true);
  });

  it("getAllTicks returns a flat array of numbers", () => {
    const ticks = scale.getAllTicks();
    expect(Array.isArray(ticks)).toBe(true);
    ticks.forEach((t) => expect(typeof t).toBe("number"));
  });
});

describe("makeDiscontinuousLinearScale — gapped domain", () => {
  // [0,1,2] gap [100,101,102] — distance from 2→100 is 98 >> minToSkip=1
  const data = [0, 1, 2, 100, 101, 102];
  const scale = makeDiscontinuousLinearScale(data, {
    range: { start: 0, span: 300 },
    selectValue: (d) => d,
    convertValueToKey: convertKey,
    calculateDistance: numericDistance,
    getRelativeValueFromDistance: relativeFromDistance,
    minToSkip: 1,
  });

  it("produces 3 sub-scales: two continuous bins + one skip bin", () => {
    // [0,1,2] gap [100,101,102] → 3 bins total (continuous, skip, continuous)
    expect(scale._getAllSubScales().length).toBe(3);
  });

  it("getBin(0) is not a skip bin", () => {
    expect(scale.getBin(0)?.isSkip).toBe(false);
  });

  it("getBin(100) is not a skip bin (it is a real data point)", () => {
    // 100 is a real item — it lives in the second continuous bin
    expect(scale.getBin(100)?.isSkip).toBe(false);
  });

  it("x values across the gap are separated (not adjacent)", () => {
    const x2 = scale.getX(2);
    const x100 = scale.getX(100);
    // Both are defined and x100 > x2 (right of the gap)
    expect(x2).toBeDefined();
    expect(x100).toBeDefined();
    expect((x100 as number) > (x2 as number)).toBe(true);
  });

  it("getX for unknown key returns undefined (H2)", () => {
    expect(scale.getX(999)).toBeUndefined();
  });

  it("getBin for unknown key returns undefined (H2)", () => {
    expect(scale.getBin(999)).toBeUndefined();
  });
});

describe("makeDiscontinuousLinearScale — Date domain", () => {
  const d1 = new Date("2024-01-01T00:00:00Z");
  const d2 = new Date("2024-01-02T00:00:00Z");
  const d3 = new Date("2024-01-03T00:00:00Z");

  const msPerDay = 86_400_000;

  const scale = makeDiscontinuousLinearScale([d1, d2, d3], {
    range: { earliest: d1, latest: d3 } as any,
    selectValue: (d) => d,
    convertValueToKey: (d) => d.toISOString(),
    calculateDistance: (a, b) => a.valueOf() - b.valueOf(),
    getRelativeValueFromDistance: (v, dist) =>
      new Date(v.valueOf() - dist) as any,
    minToSkip: msPerDay * 2, // gaps smaller than 2 days are not skipped
  });

  it("scale is callable and returns {x}", () => {
    const out = scale(d1);
    expect(out).toHaveProperty("x");
  });

  it("getX(d1) returns a number", () => {
    const x = scale.getX(d1);
    expect(typeof x).toBe("number");
  });

  it("getX(d3) is greater than getX(d1)", () => {
    const x1 = scale.getX(d1) as number;
    const x3 = scale.getX(d3) as number;
    expect(x3).toBeGreaterThan(x1);
  });

  it("all three dates fall into the same (non-skip) bin", () => {
    // gap is 1 day ≤ minToSkip=2days so all go in one continuous bin
    expect(scale.getBin(d1)?.isSkip).toBe(false);
    expect(scale.getBin(d2)?.isSkip).toBe(false);
    expect(scale.getBin(d3)?.isSkip).toBe(false);
  });
});

describe("makeDiscontinuousLinearScale — edge cases", () => {
  it("single-item domain returns a value at getX", () => {
    const scale = makeDiscontinuousLinearScale([42], {
      range: { start: 0, span: 100 },
      selectValue: (d) => d,
      convertValueToKey: convertKey,
      calculateDistance: numericDistance,
      getRelativeValueFromDistance: relativeFromDistance,
    });
    // With a single item domain[0]===domain[last], scaleLinear maps it to range[0]
    expect(scale.getX(42)).toBeDefined();
  });

  it("getTicks with explicit count array cycles through counts", () => {
    const scale = makeDiscontinuousLinearScale([0, 1, 2], {
      range: { start: 0, span: 100 },
      selectValue: (d) => d,
      convertValueToKey: convertKey,
      calculateDistance: numericDistance,
      getRelativeValueFromDistance: relativeFromDistance,
    });
    const ticks = scale.getTicks([5]);
    expect(Array.isArray(ticks)).toBe(true);
  });

  it("empty data returns empty scale without crash (H2)", () => {
    const scale = makeDiscontinuousLinearScale([], {
      range: { start: 0, span: 100 },
      selectValue: (d: number) => d,
      convertValueToKey: convertKey,
      calculateDistance: numericDistance,
      getRelativeValueFromDistance: relativeFromDistance,
    });
    expect(scale.getX(0)).toBeUndefined();
    expect(scale.getBin(0)).toBeUndefined();
    expect(scale.getTicks()).toEqual([]);
    expect(scale.getAllTicks()).toEqual([]);
  });
});

describe("makeDiscontinuousLinearScale — working-day domain regression", () => {
  // Three working days: hours 0-8 each day, with overnight gaps (distance 15+ > minToSkip=1)
  function buildWorkingDayHours(dayCount: number): number[] {
    const hours: number[] = [];
    for (let d = 0; d < dayCount; d++) {
      for (let h = 0; h < 9; h++) {
        hours.push(d * 24 + h);
      }
    }
    return hours;
  }

  const hours = buildWorkingDayHours(3);
  const svgW = 720;
  const padLeft = 20;

  // start=padLeft, span=svgW-padLeft so last tick lands at padLeft+(svgW-padLeft)=svgW
  const scale = makeDiscontinuousLinearScale(hours, {
    range: { start: padLeft, span: svgW - padLeft },
    selectValue: (h) => h,
    convertValueToKey: (h) => String(h),
    calculateDistance: numericDistance,
    getRelativeValueFromDistance: relativeFromDistance,
    minToSkip: 1,
  });

  it("produces 5 sub-scales: 3 continuous bins + 2 skip bins", () => {
    expect(scale._getAllSubScales().length).toBe(5);
  });

  it("sub-scales at even indices (0,2,4) are continuous bins", () => {
    const subs = scale._getAllSubScales();
    expect(subs[0].domain()).toEqual([0, 8]);
    expect(subs[2].domain()).toEqual([24, 32]);
    expect(subs[4].domain()).toEqual([48, 56]);
  });

  it("sub-scales at odd indices (1,3) are skip bins with collapsed range", () => {
    const subs = scale._getAllSubScales();
    const [d1min, d1max] = subs[1].domain();
    const [d3min, d3max] = subs[3].domain();
    expect(d1min).toEqual(d1max);
    expect(d3min).toEqual(d3max);
  });

  it("getX(0) is padLeft (start of range)", () => {
    expect(scale.getX(0)).toBeCloseTo(padLeft);
  });

  it("getX of the last hour maps exactly to svgW (start + span)", () => {
    const lastHour = hours[hours.length - 1]; // 56
    const xLast = scale.getX(lastHour);
    expect(xLast).toBeDefined();
    expect(xLast as number).toBeCloseTo(svgW);
  });

  it("getTicks returns 5 arrays (one per sub-scale)", () => {
    expect(scale.getTicks(4).length).toBe(5);
  });

  it("continuous-only ticks (sub-scales 0,2,4) are uniformly spaced within each day", () => {
    const continuousTicks = scale.getTicks([4, 1, 4, 1, 4]);
    const day1Ticks = continuousTicks[0];
    expect(day1Ticks).toEqual([0, 2, 4, 6, 8]);
    const day2Ticks = continuousTicks[2];
    expect(day2Ticks).toEqual([24, 26, 28, 30, 32]);
    const day3Ticks = continuousTicks[4];
    expect(day3Ticks).toEqual([48, 50, 52, 54, 56]);
  });
});

describe("makeDiscontinuousLinearScale — getSkipGap width hierarchy", () => {
  // Domain: [0..4] gap14 [18..22] gap55 [77..81]
  // Two gaps: small span=14 (overnight-like) and large span=55 (weekend-like)
  // getSkipGap: span>24 → weight 4, else weight 2
  const smallGapData = [0, 1, 2, 3, 4];
  const largeGapData = [18, 19, 20, 21, 22];
  const largestGapData = [77, 78, 79, 80, 81];
  const data = [...smallGapData, ...largeGapData, ...largestGapData];

  const scale = makeDiscontinuousLinearScale(data, {
    range: { start: 0, span: 600 },
    selectValue: (d) => d,
    convertValueToKey: (d) => String(d),
    calculateDistance: (a, b) => a - b,
    getRelativeValueFromDistance: (v, dist) => v - dist,
    minToSkip: 1,
    getSkipGap: (span) => (span > 24 ? 4 : 2),
  });

  it("produces 5 sub-scales: 3 continuous + 2 skip bins", () => {
    expect(scale._getAllSubScales().length).toBe(5);
  });

  it("weekend-like gap (span 55) renders wider than overnight-like gap (span 14)", () => {
    const smallW = scale.getSkipWidth(0);
    const largeW = scale.getSkipWidth(1);
    expect(smallW).toBeDefined();
    expect(largeW).toBeDefined();
    expect((largeW as number) > (smallW as number)).toBe(true);
  });

  it("getSkipWidth ratio matches weight ratio (4/2 = 2)", () => {
    const smallW = scale.getSkipWidth(0) as number;
    const largeW = scale.getSkipWidth(1) as number;
    expect(largeW / smallW).toBeCloseTo(2, 1);
  });

  it("getX(0) still maps to start (0)", () => {
    expect(scale.getX(0)).toBeCloseTo(0);
  });

  it("getX(81) still maps to start + span (600)", () => {
    expect(scale.getX(81)).toBeCloseTo(600);
  });

  it("getSkipWidth returns undefined for out-of-range index", () => {
    expect(scale.getSkipWidth(99)).toBeUndefined();
  });
});
