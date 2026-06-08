import { describe, expect, it, vi } from "vitest";
import {
  calculateLengthFromFixedBandsWithGaps,
  makeFixedBandScale,
} from "./fixed-band-scale.js";

type Item = { id: string };

const items: Item[] = [
  { id: "a" },
  { id: "b" },
  { id: "c" },
];

describe("makeFixedBandScale", () => {
  const scale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth: 100,
    gap: 10,
  });

  it("returns correct bandwidth", () => {
    expect(scale.getBandwidth()).toBe(100);
  });

  it("returns correct gap", () => {
    expect(scale.getGap()).toBe(10);
  });

  it("returns correct step", () => {
    expect(scale.getStep()).toBe(110);
  });

  it("x0 of first item is 0", () => {
    expect(scale.getX0("a")).toBe(0);
  });

  it("x1 of first item equals bandwidth", () => {
    expect(scale.getX1("a")).toBe(100);
  });

  it("x0 of second item = x1(first) + gap", () => {
    expect(scale.getX0("b")).toBe(110);
  });

  it("cx of first item is at midpoint", () => {
    expect(scale.getCX("a")).toBe(50);
  });

  it("returns undefined for unknown key (getX0)", () => {
    expect(scale.getX0("z" as any)).toBeUndefined();
  });

  it("getCX returns undefined for unknown key (L1)", () => {
    expect(scale.getCX("z" as any)).toBeUndefined();
  });

  it("getAllBands returns 3 entries", () => {
    expect(scale.getAllBands()).toHaveLength(3);
  });

  it("getExtent has correct min=0 and max=320", () => {
    const { min, max } = scale.getExtent();
    expect(min).toBe(0);
    expect(max).toBe(320); // 3*100 + 2*10 = 320
  });

  it("getRange equals 320", () => {
    expect(scale.getRange()).toBe(320);
  });

  it("getExtentOfSpan returns span between first and last", () => {
    const span = scale.getExtentOfSpan("a", "c");
    expect(span?.min).toBe(0);
    expect(span?.max).toBe(320);
  });

  it("getExtentOfSpan returns undefined for unknown key (L3)", () => {
    expect(scale.getExtentOfSpan("x" as any, "y" as any)).toBeUndefined();
  });

  it("getExtentOfSpan returns undefined when first key unknown (L3)", () => {
    expect(scale.getExtentOfSpan("x" as any, "c" as any)).toBeUndefined();
  });

  it("getExtentOfSpan returns undefined when second key unknown (L3)", () => {
    expect(scale.getExtentOfSpan("a" as any, "y" as any)).toBeUndefined();
  });

  it("callable form returns output for known key", () => {
    const out = scale("a");
    expect(out).toEqual({ x0: 0, x1: 100, cx: 50 });
  });

  it("callable form returns undefined for unknown key", () => {
    expect(scale("z" as any)).toBeUndefined();
  });

  it("getDomain returns item ids", () => {
    expect(scale.getDomain()).toEqual(["a", "b", "c"]);
  });

  it("getScaleFactor returns 1 when no scaleTo", () => {
    expect(scale.getScaleFactor()).toBe(1);
  });
});

describe("makeFixedBandScale — padStart", () => {
  const scale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth: 100,
    gap: 10,
    padStart: 20,
  });

  it("x0 of first item equals padStart", () => {
    expect(scale.getX0("a")).toBe(20);
  });

  it("x0 of second item = padStart + bandwidth + gap", () => {
    expect(scale.getX0("b")).toBe(130); // 20 + 100 + 10
  });

  it("getRange includes padStart", () => {
    // 20 + 100*3 + 10*2 = 340
    expect(scale.getRange()).toBe(340);
  });

  it("getExtent min is 0", () => {
    expect(scale.getExtent().min).toBe(0);
  });
});

describe("makeFixedBandScale — padEnd", () => {
  const scale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth: 100,
    gap: 10,
    padEnd: 15,
  });

  it("getRange includes padEnd", () => {
    // 3*100 + 2*10 + 15 = 335
    expect(scale.getRange()).toBe(335);
  });
});

describe("makeFixedBandScale — padStart + padEnd", () => {
  const scale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth: 100,
    gap: 10,
    padStart: 20,
    padEnd: 15,
  });

  it("getRange includes both pads", () => {
    // 20 + 3*100 + 2*10 + 15 = 355
    expect(scale.getRange()).toBe(355);
  });

  it("matches calculateLengthFromFixedBandsWithGaps", () => {
    expect(
      calculateLengthFromFixedBandsWithGaps(3, {
        bandwidth: 100,
        gap: 10,
        padStart: 20,
        padEnd: 15,
      })
    ).toBe(scale.getRange());
  });
});

describe("makeFixedBandScale — AnyCssNumber options (M1)", () => {
  it("accepts px string bandwidth", () => {
    const s = makeFixedBandScale(items, {
      selectId: (d) => d.id,
      bandwidth: "100px",
      gap: "10px",
    });
    expect(s.getBandwidth()).toBe(100);
    expect(s.getGap()).toBe(10);
  });

  it("accepts fractional px", () => {
    const s = makeFixedBandScale(items, {
      selectId: (d) => d.id,
      bandwidth: "12.5px",
      gap: 0,
    });
    expect(s.getBandwidth()).toBeCloseTo(12.5);
  });

  it("accepts rem string padStart", () => {
    const s = makeFixedBandScale(items, {
      selectId: (d) => d.id,
      bandwidth: 100,
      gap: 10,
      padStart: "1.5rem",
    });
    expect(s.getX0("a")).toBeCloseTo(1.5);
  });
});

describe("makeFixedBandScale — empty domain (H1)", () => {
  const scale = makeFixedBandScale([], {
    selectId: (d: Item) => d.id,
    bandwidth: 100,
    gap: 10,
  });

  it("getRange returns 0", () => {
    expect(scale.getRange()).toBe(0);
  });

  it("getExtent returns {min:0,max:0}", () => {
    expect(scale.getExtent()).toEqual({ min: 0, max: 0 });
  });

  it("getAllBands returns []", () => {
    expect(scale.getAllBands()).toEqual([]);
  });

  it("getScaleFactor returns 1 on empty domain", () => {
    expect(scale.getScaleFactor()).toBe(1);
  });
});

describe("makeFixedBandScale — duplicate ids (M4)", () => {
  it("deduplicates domain and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dupItems = [{ id: "a" }, { id: "b" }, { id: "a" }];
    const scale = makeFixedBandScale(dupItems, {
      selectId: (d) => d.id,
      bandwidth: 100,
      gap: 10,
    });
    expect(scale.getDomain()).toEqual(["a", "b"]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("getRange computed from deduped domain", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const dupItems = [{ id: "a" }, { id: "b" }, { id: "a" }];
    const scale = makeFixedBandScale(dupItems, {
      selectId: (d) => d.id,
      bandwidth: 100,
      gap: 10,
    });
    // 2 bands: 100*2 + 10*1 = 210
    expect(scale.getRange()).toBe(210);
    vi.restoreAllMocks();
  });
});

describe("makeFixedBandScale — contentOffsetStart + contentOffsetEnd (global)", () => {
  // bandwidth=100, gap=10; items a/b/c
  // contentOffsetStart=12, contentOffsetEnd=8 → contentBandwidth=80
  const scale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth: 100,
    gap: 10,
    contentOffsetStart: 12,
    contentOffsetEnd: 8,
  });

  it("getContentX0 = x0 + contentOffsetStart", () => {
    expect(scale.getContentX0("a")).toBe(12);  // x0=0 + 12
    expect(scale.getContentX0("b")).toBe(122); // x0=110 + 12
  });

  it("getContentX1 = x1 − contentOffsetEnd", () => {
    expect(scale.getContentX1("a")).toBe(92);  // x1=100 − 8
    expect(scale.getContentX1("b")).toBe(202); // x1=210 − 8
  });

  it("getContentBandwidth = bandwidth − start − end", () => {
    expect(scale.getContentBandwidth()).toBe(80); // 100 − 12 − 8
  });

  it("getContentX0 returns undefined for unknown key", () => {
    expect(scale.getContentX0("z" as any)).toBeUndefined();
  });

  it("getContentX1 returns undefined for unknown key", () => {
    expect(scale.getContentX1("z" as any)).toBeUndefined();
  });

  it("getRange is unchanged (content offsets not in range)", () => {
    expect(scale.getRange()).toBe(320); // same as no content offsets
  });
});

describe("makeFixedBandScale — contentOffsetStart only", () => {
  const scale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth: 100,
    gap: 10,
    contentOffsetStart: 20,
  });

  it("getContentBandwidth = bandwidth − start", () => {
    expect(scale.getContentBandwidth()).toBe(80);
  });

  it("getContentX1 = x1 (no end offset)", () => {
    expect(scale.getContentX1("a")).toBe(100);
  });
});

describe("makeFixedBandScale — contentOffsetEnd only", () => {
  const scale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth: 100,
    gap: 10,
    contentOffsetEnd: 25,
  });

  it("getContentBandwidth = bandwidth − end", () => {
    expect(scale.getContentBandwidth()).toBe(75);
  });

  it("getContentX0 = x0 (no start offset)", () => {
    expect(scale.getContentX0("a")).toBe(0);
  });
});

describe("makeFixedBandScale — clamp to 0 when offsets >= bandwidth", () => {
  it("getContentBandwidth clamps to 0 when start+end equals bandwidth", () => {
    const scale = makeFixedBandScale(items, {
      selectId: (d) => d.id,
      bandwidth: 100,
      gap: 10,
      contentOffsetStart: 60,
      contentOffsetEnd: 40,
    });
    expect(scale.getContentBandwidth()).toBe(0);
  });

  it("getContentBandwidth clamps to 0 when start+end exceeds bandwidth", () => {
    const scale = makeFixedBandScale(items, {
      selectId: (d) => d.id,
      bandwidth: 100,
      gap: 10,
      contentOffsetStart: 70,
      contentOffsetEnd: 50,
    });
    expect(scale.getContentBandwidth()).toBe(0);
  });
});

describe("makeFixedBandScale — content accessors on empty domain", () => {
  const scale = makeFixedBandScale([], {
    selectId: (d: Item) => d.id,
    bandwidth: 100,
    gap: 10,
    contentOffsetStart: 12,
    contentOffsetEnd: 8,
  });

  it("getContentX0 returns undefined", () => {
    expect(scale.getContentX0("a" as any)).toBeUndefined();
  });

  it("getContentX1 returns undefined", () => {
    expect(scale.getContentX1("a" as any)).toBeUndefined();
  });

  it("getContentBandwidth returns clamped value (no input needed)", () => {
    expect(scale.getContentBandwidth()).toBe(80);
  });
});

describe("calculateLengthFromFixedBandsWithGaps", () => {
  it("computes correct total length", () => {
    // 3 bands * 100 + 2 gaps * 10 = 320
    expect(calculateLengthFromFixedBandsWithGaps(3, { bandwidth: 100, gap: 10 })).toBe(320);
  });

  it("handles px strings", () => {
    expect(
      calculateLengthFromFixedBandsWithGaps(2, { bandwidth: "50px", gap: "5px" })
    ).toBe(105); // 2*50 + 1*5
  });

  it("includes padStart and padEnd", () => {
    expect(
      calculateLengthFromFixedBandsWithGaps(3, { bandwidth: 100, gap: 10, padStart: 20, padEnd: 15 })
    ).toBe(355); // 20 + 320 + 15
  });

  it("handles fractional px strings (M1)", () => {
    expect(
      calculateLengthFromFixedBandsWithGaps(2, { bandwidth: "12.5px", gap: "0.5px" })
    ).toBeCloseTo(25.5); // 2*12.5 + 0.5
  });
});

// scaleTo tests — parity with former fitFixedScaleToLength, plus new coverage
describe("makeFixedBandScale — scaleTo: numeric (ported from fit-to-length)", () => {
  it("getScaleFactor is 1 when scaleTo equals natural range", () => {
    const scale = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 60, gap: 10 });
    const nativeRange = scale.getRange(); // 60*3 + 10*2 = 200
    const scaled = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 60, gap: 10, scaleTo: nativeRange });
    expect(scaled.getScaleFactor()).toBeCloseTo(1);
  });

  it("bandwidths and gaps scale by the fit factor", () => {
    const scaled = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 60, gap: 10, scaleTo: 400 });
    // native = 200, factor = 2
    expect(scaled.getScaleFactor()).toBeCloseTo(2);
    expect(scaled.getBandwidth()).toBeCloseTo(120);
    expect(scaled.getGap()).toBeCloseTo(20);
    expect(scaled.getStep()).toBeCloseTo(140);
  });

  it("getX0 and getX1 scale correctly", () => {
    const scaled = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 60, gap: 10, scaleTo: 400 });
    // factor = 2
    expect(scaled.getX0("a")).toBeCloseTo(0);
    expect(scaled.getX1("a")).toBeCloseTo(120); // 60 * 2
    expect(scaled.getX0("b")).toBeCloseTo(140); // (60 + 10) * 2
  });

  it("returns undefined for unknown input", () => {
    const scaled = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 60, gap: 10, scaleTo: 400 });
    expect(scaled.getX0("Z" as any)).toBeUndefined();
  });

  it("total fitted content equals scaleTo", () => {
    const scaled = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 80, gap: 12, scaleTo: 500 });
    const x1Last = scaled.getX1("c") ?? 0;
    expect(x1Last).toBeCloseTo(500);
  });

  it("last band x1 equals scaleTo for 6-item scale (regression)", () => {
    const sixItems = ["A", "B", "C", "D", "E", "F"].map((id) => ({ id }));
    const nativeScale = makeFixedBandScale(sixItems, { selectId: (d) => d.id, bandwidth: 60, gap: 16 });
    // native range: 60*6 + 16*5 = 440
    expect(nativeScale.getRange()).toBe(440);
    const container = 557;
    const scaled = makeFixedBandScale(sixItems, { selectId: (d) => d.id, bandwidth: 60, gap: 16, scaleTo: container });
    expect(scaled.getScaleFactor()).toBeCloseTo(container / 440);
    expect(scaled.getX1("F")).toBeCloseTo(container);
  });
});

describe("makeFixedBandScale — scaleTo: 'content' (default behavior)", () => {
  it("scaleTo: 'content' behaves identically to omitting scaleTo", () => {
    const base = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 100, gap: 10 });
    const explicit = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 100, gap: 10, scaleTo: 'content' });
    expect(explicit.getBandwidth()).toBe(base.getBandwidth());
    expect(explicit.getRange()).toBe(base.getRange());
    expect(explicit.getScaleFactor()).toBe(1);
    expect(explicit.getX0("b")).toBe(base.getX0("b"));
  });
});

describe("makeFixedBandScale — scaleTo: css string", () => {
  it("accepts css px string scaleTo", () => {
    // native = 200 (3 bands @ 60 + 2 gaps @ 10), scaleTo 600px → factor 3
    const scaled = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 60, gap: 10, scaleTo: "600px" });
    expect(scaled.getScaleFactor()).toBeCloseTo(3);
    expect(scaled.getBandwidth()).toBeCloseTo(180);
    expect(scaled.getRange()).toBeCloseTo(600);
  });
});

describe("makeFixedBandScale — scaleTo with margins and content offsets", () => {
  it("padStart and padEnd scale proportionally", () => {
    // native: 20 + 100*3 + 10*2 + 15 = 355; scaleTo 710 → factor 2
    const scaled = makeFixedBandScale(items, {
      selectId: (d) => d.id,
      bandwidth: 100,
      gap: 10,
      padStart: 20,
      padEnd: 15,
      scaleTo: 710,
    });
    expect(scaled.getScaleFactor()).toBeCloseTo(2);
    expect(scaled.getX0("a")).toBeCloseTo(40); // padStart * 2
    expect(scaled.getRange()).toBeCloseTo(710);
  });

  it("content offsets scale proportionally", () => {
    // native: 320; scaleTo 640 → factor 2; contentOffsetStart=10 → scaled 20
    const scaled = makeFixedBandScale(items, {
      selectId: (d) => d.id,
      bandwidth: 100,
      gap: 10,
      contentOffsetStart: 10,
      contentOffsetEnd: 5,
      scaleTo: 640,
    });
    expect(scaled.getScaleFactor()).toBeCloseTo(2);
    expect(scaled.getContentX0("a")).toBeCloseTo(20); // 0 + 10*2
    expect(scaled.getContentBandwidth()).toBeCloseTo(170); // (100 − 10 − 5) * 2
  });
});

describe("makeFixedBandScale — scaleTo edge cases", () => {
  it("empty domain returns factor 1 even with scaleTo", () => {
    const scale = makeFixedBandScale([], { selectId: (d: Item) => d.id, bandwidth: 100, gap: 10, scaleTo: 500 });
    expect(scale.getScaleFactor()).toBe(1);
    expect(scale.getRange()).toBe(0);
  });

  it("scaleTo: 0 → factor 0, no NaN", () => {
    const scaled = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 100, gap: 10, scaleTo: 0 });
    expect(scaled.getScaleFactor()).toBe(0);
    expect(scaled.getBandwidth()).toBe(0);
    expect(scaled.getRange()).toBe(0);
    // Positions should be 0, not NaN
    expect(scaled.getX0("a")).toBe(0);
  });

  it("getRange equals scaleTo value (numeric)", () => {
    const scaled = makeFixedBandScale(items, { selectId: (d) => d.id, bandwidth: 100, gap: 10, scaleTo: 600 });
    expect(scaled.getRange()).toBeCloseTo(600);
  });
});
