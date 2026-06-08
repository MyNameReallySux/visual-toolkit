import { describe, expect, it, vi } from "vitest";
import { calculateLengthFromDynamicBands, makeDynamicBandScale } from "./dynamic-band-scale.js";

type Row = { id: string; width: number; gap?: number };

const rows: Row[] = [
  { id: "p", width: 80 },
  { id: "q", width: 120, gap: 20 },
  { id: "r", width: 60 },
];

describe("makeDynamicBandScale", () => {
  const scale = makeDynamicBandScale(rows, {
    selectId: (d) => d.id,
    selectBandwidth: (d) => d.width,
    selectGap: (d) => d.gap ?? 10,
    gap: 10,
  });

  it("getBandwidth returns correct per-item bandwidth", () => {
    expect(scale.getBandwidth("p")).toBe(80);
    expect(scale.getBandwidth("q")).toBe(120);
  });

  it("getX0 of first item is 0", () => {
    expect(scale.getX0("p")).toBe(0);
  });

  it("getX1 of first item equals bandwidth", () => {
    expect(scale.getX1("p")).toBe(80);
  });

  it("getX0 of second item accounts for item-level gap", () => {
    // p.x1=80, q.gap=20 → q.x0=80+20=100
    expect(scale.getX0("q")).toBe(100);
  });

  it("getCX is midpoint of bandwidth", () => {
    // p: x0=0, bw=80, cx=40
    expect(scale.getCX("p")).toBe(40);
  });

  it("getCX returns undefined for unknown key (L1)", () => {
    expect(scale.getCX("z" as any)).toBeUndefined();
  });

  it("returns undefined for unknown key (getBandwidth)", () => {
    expect(scale.getBandwidth("z" as any)).toBeUndefined();
  });

  it("callable form returns full output for known key", () => {
    const out = scale("p");
    expect(out).toMatchObject({ x0: 0, x1: 80, cx: 40, bandwidth: 80 });
  });

  it("callable form returns undefined for unknown key", () => {
    expect(scale("z" as any)).toBeUndefined();
  });

  it("getAllBands length matches data", () => {
    expect(scale.getAllBands()).toHaveLength(3);
  });

  it("getRange returns total span", () => {
    expect(scale.getRange()).toBeGreaterThan(0);
  });

  it("getExtent has min=0", () => {
    expect(scale.getExtent().min).toBe(0);
  });

  it("getContentX0 equals getX0 when no offset", () => {
    expect(scale.getContentX0("p")).toBe(scale.getX0("p"));
  });

  it("getContentBandwidth equals getBandwidth when no offset", () => {
    expect(scale.getContentBandwidth("p")).toBe(scale.getBandwidth("p"));
  });

  it("getDomain returns all domain keys in order", () => {
    expect(scale.getDomain()).toEqual(["p", "q", "r"]);
  });

  it("getScaleFactor returns 1 when no scaleTo", () => {
    expect(scale.getScaleFactor()).toBe(1);
  });
});

describe("makeDynamicBandScale — contentOffsetStart (global)", () => {
  const scale = makeDynamicBandScale(
    [{ id: "x", width: 100 }],
    {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      contentOffsetStart: 15,
    }
  );

  it("getContentX0 offsets from x0", () => {
    expect(scale.getContentX0("x")).toBe(15);
  });

  it("getContentX1 equals x1 when no end offset", () => {
    expect(scale.getContentX1("x")).toBe(100);
  });

  it("getContentBandwidth is reduced by start offset only", () => {
    expect(scale.getContentBandwidth("x")).toBe(85);
  });
});

describe("makeDynamicBandScale — contentOffsetEnd (global)", () => {
  const scale = makeDynamicBandScale(
    [{ id: "x", width: 100 }],
    {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      contentOffsetEnd: 10,
    }
  );

  it("getContentX1 = x1 − end offset", () => {
    expect(scale.getContentX1("x")).toBe(90);
  });

  it("getContentX0 equals x0 when no start offset", () => {
    expect(scale.getContentX0("x")).toBe(0);
  });

  it("getContentBandwidth is reduced by end offset only", () => {
    expect(scale.getContentBandwidth("x")).toBe(90);
  });
});

describe("makeDynamicBandScale — both global content offsets", () => {
  // bandwidth=120, contentOffsetStart=10, contentOffsetEnd=15 → contentBandwidth=95
  const scale = makeDynamicBandScale(
    [{ id: "a", width: 120 }],
    {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      contentOffsetStart: 10,
      contentOffsetEnd: 15,
    }
  );

  it("getContentX0 = x0 + start", () => {
    expect(scale.getContentX0("a")).toBe(10);
  });

  it("getContentX1 = x1 − end", () => {
    expect(scale.getContentX1("a")).toBe(105); // 120 − 15
  });

  it("getContentBandwidth = bandwidth − start − end", () => {
    expect(scale.getContentBandwidth("a")).toBe(95); // 120 − 10 − 15
  });

  it("getContentX0 returns undefined for unknown key", () => {
    expect(scale.getContentX0("z" as any)).toBeUndefined();
  });

  it("getContentX1 returns undefined for unknown key", () => {
    expect(scale.getContentX1("z" as any)).toBeUndefined();
  });

  it("getContentBandwidth returns undefined for unknown key", () => {
    expect(scale.getContentBandwidth("z" as any)).toBeUndefined();
  });

  it("getRange unchanged (content offsets not in range)", () => {
    expect(scale.getRange()).toBe(120);
  });
});

describe("makeDynamicBandScale — per-item content offset overrides", () => {
  // p: global start=5, global end=5 → contentBandwidth=70 (out of 80)
  // q: selectContentOffsetStart returns 20 → start=20, end=5 → contentBandwidth=95 (out of 120)
  // r: selectContentOffsetEnd returns 0 → start=5, end=0 → contentBandwidth=55 (out of 60)
  type Row2 = { id: string; width: number; cos?: number; coe?: number };
  const data2: Row2[] = [
    { id: "p", width: 80 },
    { id: "q", width: 120, cos: 20 },
    { id: "r", width: 60, coe: 0 },
  ];
  const scale = makeDynamicBandScale(data2, {
    selectId: (d) => d.id,
    selectBandwidth: (d) => d.width,
    gap: 10,
    contentOffsetStart: 5,
    contentOffsetEnd: 5,
    selectContentOffsetStart: (d) => d.cos,
    selectContentOffsetEnd: (d) => d.coe,
  });

  it("p uses global start and end", () => {
    expect(scale.getContentX0("p")).toBe(5);   // x0=0 + 5
    expect(scale.getContentX1("p")).toBe(75);  // x1=80 − 5
    expect(scale.getContentBandwidth("p")).toBe(70); // 80 − 5 − 5
  });

  it("q uses per-item start override, global end", () => {
    // q.x0 = p.x1(80) + gap(10) = 90
    expect(scale.getContentX0("q")).toBe(110); // 90 + 20
    expect(scale.getContentX1("q")).toBe(205); // 90+120=210 − 5
    expect(scale.getContentBandwidth("q")).toBe(95); // 120 − 20 − 5
  });

  it("r uses global start, per-item end override of 0", () => {
    // r.x0 = q.x1(210) + gap(10) = 220
    expect(scale.getContentX0("r")).toBe(225); // 220 + 5
    expect(scale.getContentX1("r")).toBe(280); // 220+60=280 − 0
    expect(scale.getContentBandwidth("r")).toBe(55); // 60 − 5 − 0
  });
});

describe("makeDynamicBandScale — clamp to 0 when offsets >= bandwidth", () => {
  it("getContentBandwidth clamps to 0", () => {
    const scale = makeDynamicBandScale(
      [{ id: "x", width: 50 }],
      {
        selectId: (d) => d.id,
        selectBandwidth: (d) => d.width,
        contentOffsetStart: 30,
        contentOffsetEnd: 30,
      }
    );
    expect(scale.getContentBandwidth("x")).toBe(0);
  });
});

describe("makeDynamicBandScale — content accessors on empty domain", () => {
  const scale = makeDynamicBandScale([], {
    selectId: (d: Row) => d.id,
    selectBandwidth: (d) => d.width,
    gap: 10,
    contentOffsetStart: 10,
    contentOffsetEnd: 5,
  });

  it("getContentX0 returns undefined", () => {
    expect(scale.getContentX0("p" as any)).toBeUndefined();
  });

  it("getContentX1 returns undefined", () => {
    expect(scale.getContentX1("p" as any)).toBeUndefined();
  });

  it("getContentBandwidth returns undefined for unknown key", () => {
    expect(scale.getContentBandwidth("p" as any)).toBeUndefined();
  });
});

describe("makeDynamicBandScale — padStart", () => {
  const scale = makeDynamicBandScale(rows, {
    selectId: (d) => d.id,
    selectBandwidth: (d) => d.width,
    gap: 10,
    padStart: 20,
  });

  it("x0 of first item equals padStart", () => {
    expect(scale.getX0("p")).toBe(20);
  });

  it("getRange includes padStart", () => {
    // 20 + 80 + 10 + 120 + 10 + 60 = 300
    expect(scale.getRange()).toBe(300);
  });

  it("getExtent min is 0", () => {
    expect(scale.getExtent().min).toBe(0);
  });
});

describe("makeDynamicBandScale — padEnd", () => {
  const scale = makeDynamicBandScale(rows, {
    selectId: (d) => d.id,
    selectBandwidth: (d) => d.width,
    gap: 10,
    padEnd: 15,
  });

  it("getRange includes padEnd", () => {
    // 80 + 10 + 120 + 10 + 60 + 15 = 295
    expect(scale.getRange()).toBe(295);
  });
});

describe("makeDynamicBandScale — empty domain (H1)", () => {
  const scale = makeDynamicBandScale([], {
    selectId: (d: Row) => d.id,
    selectBandwidth: (d) => d.width,
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

  it("getDomain returns [] on empty domain", () => {
    expect(scale.getDomain()).toEqual([]);
  });

  it("getScaleFactor returns 1 on empty domain", () => {
    expect(scale.getScaleFactor()).toBe(1);
  });
});

describe("makeDynamicBandScale — duplicate ids (M4)", () => {
  it("deduplicates domain and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dupRows = [{ id: "p", width: 80 }, { id: "q", width: 120 }, { id: "p", width: 50 }];
    const scale = makeDynamicBandScale(dupRows, {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      gap: 10,
    });
    // Only p and q
    expect(scale.getBandwidth("p")).toBe(80);
    expect(scale.getExtent().max).toBe(210); // 80 + 10 + 120 = 210
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("makeDynamicBandScale — AnyCssNumber (M1)", () => {
  it("accepts px string bandwidth", () => {
    const scale = makeDynamicBandScale(
      [{ id: "a", width: "60px" as any }],
      {
        selectId: (d) => d.id,
        selectBandwidth: (d) => d.width,
      }
    );
    expect(scale.getBandwidth("a")).toBeCloseTo(60);
  });

  it("accepts rem string padStart", () => {
    const scale = makeDynamicBandScale(
      [{ id: "a", width: 100 }],
      {
        selectId: (d) => d.id,
        selectBandwidth: (d) => d.width,
        padStart: "1.5rem",
      }
    );
    expect(scale.getX0("a")).toBeCloseTo(1.5);
  });
});

describe("calculateLengthFromDynamicBands", () => {
  it("computes total from bandwidths + gap", () => {
    expect(calculateLengthFromDynamicBands([80, 120, 60], 10)).toBe(280);
  });

  it("handles single band (no gap)", () => {
    expect(calculateLengthFromDynamicBands([100], 10)).toBe(100);
  });

  it("includes padStart and padEnd", () => {
    expect(calculateLengthFromDynamicBands([80, 120, 60], 10, { padStart: 20, padEnd: 15 })).toBe(315);
  });
});

// scaleTo tests — parity with former fitDynamicScaleToLength, plus new coverage
describe("makeDynamicBandScale — scaleTo: numeric (ported from fit-to-length)", () => {
  const items = [
    { id: "X", width: 100 },
    { id: "Y", width: 60 },
    { id: "Z", width: 80 },
  ];

  it("getScaleFactor is 1 when scaleTo equals natural range", () => {
    const base = makeDynamicBandScale(items, {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      gap: 8,
    });
    const nativeRange = base.getRange();
    const scaled = makeDynamicBandScale(items, {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      gap: 8,
      scaleTo: nativeRange,
    });
    expect(scaled.getScaleFactor()).toBeCloseTo(1);
  });

  it("bandwidths and gaps scale by the fit factor", () => {
    // native: 100 + 60 + 80 + 10 + 10 = 260; container 520 → factor 2
    const scaled = makeDynamicBandScale(items, {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      gap: 10,
      scaleTo: 520,
    });
    expect(scaled.getScaleFactor()).toBeCloseTo(2);
    expect(scaled.getBandwidth("X")).toBeCloseTo(200);
    expect(scaled.getBandwidth("Y")).toBeCloseTo(120);
    expect(scaled.getGap()).toBeCloseTo(20);
  });

  it("getX0 and getX1 scale correctly", () => {
    const scaled = makeDynamicBandScale(items, {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      gap: 10,
      scaleTo: 520,
    });
    // factor 2
    expect(scaled.getX0("X")).toBeCloseTo(0);
    expect(scaled.getX1("X")).toBeCloseTo(200);
    expect(scaled.getX0("Y")).toBeCloseTo(220); // (100 + 10) * 2
  });

  it("total fitted content ends at scaleTo", () => {
    const scaled = makeDynamicBandScale(items, {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      gap: 5,
      scaleTo: 750,
    });
    const x1Last = scaled.getX1("Z") ?? 0;
    expect(x1Last).toBeCloseTo(750);
  });
});

describe("makeDynamicBandScale — scaleTo: 'content' (default behavior)", () => {
  it("scaleTo: 'content' behaves identically to omitting scaleTo", () => {
    const items = [{ id: "X", width: 100 }, { id: "Y", width: 60 }];
    const base = makeDynamicBandScale(items, { selectId: (d) => d.id, selectBandwidth: (d) => d.width, gap: 10 });
    const explicit = makeDynamicBandScale(items, { selectId: (d) => d.id, selectBandwidth: (d) => d.width, gap: 10, scaleTo: 'content' });
    expect(explicit.getRange()).toBe(base.getRange());
    expect(explicit.getScaleFactor()).toBe(1);
    expect(explicit.getX0("Y")).toBe(base.getX0("Y"));
  });
});

describe("makeDynamicBandScale — scaleTo: css string", () => {
  it("accepts css px string scaleTo", () => {
    // native: 100 + 60 + 10 = 170; scaleTo 340px → factor 2
    const items = [{ id: "X", width: 100 }, { id: "Y", width: 60 }];
    const scaled = makeDynamicBandScale(items, { selectId: (d) => d.id, selectBandwidth: (d) => d.width, gap: 10, scaleTo: "340px" });
    expect(scaled.getScaleFactor()).toBeCloseTo(2);
    expect(scaled.getBandwidth("X")).toBeCloseTo(200);
    expect(scaled.getRange()).toBeCloseTo(340);
  });
});

describe("makeDynamicBandScale — scaleTo with content offsets", () => {
  it("content offsets scale proportionally", () => {
    // native: 120 + 10 = 130 (2 items); scaleTo 260 → factor 2; contentOffsetStart=5 → scaled 10
    const items = [{ id: "a", width: 80 }, { id: "b", width: 40 }];
    const scaled = makeDynamicBandScale(items, {
      selectId: (d) => d.id,
      selectBandwidth: (d) => d.width,
      gap: 10,
      contentOffsetStart: 5,
      contentOffsetEnd: 3,
      scaleTo: 260,
    });
    expect(scaled.getScaleFactor()).toBeCloseTo(2);
    expect(scaled.getContentX0("a")).toBeCloseTo(10); // 0 + 5*2
    expect(scaled.getContentBandwidth("a")).toBeCloseTo(144); // (80 − 5 − 3) * 2 = 72 * 2
  });
});

describe("makeDynamicBandScale — scaleTo edge cases", () => {
  it("empty domain returns factor 1 even with scaleTo", () => {
    const scale = makeDynamicBandScale([], { selectId: (d: Row) => d.id, selectBandwidth: (d) => d.width, gap: 10, scaleTo: 500 });
    expect(scale.getScaleFactor()).toBe(1);
    expect(scale.getRange()).toBe(0);
  });

  it("scaleTo: 0 → factor 0, no NaN", () => {
    const items = [{ id: "a", width: 100 }];
    const scaled = makeDynamicBandScale(items, { selectId: (d) => d.id, selectBandwidth: (d) => d.width, scaleTo: 0 });
    expect(scaled.getScaleFactor()).toBe(0);
    expect(scaled.getBandwidth("a")).toBe(0);
    expect(scaled.getRange()).toBe(0);
    expect(scaled.getX0("a")).toBe(0);
  });

  it("getRange equals scaleTo value (numeric)", () => {
    const items = [{ id: "a", width: 100 }, { id: "b", width: 80 }];
    const scaled = makeDynamicBandScale(items, { selectId: (d) => d.id, selectBandwidth: (d) => d.width, gap: 10, scaleTo: 600 });
    expect(scaled.getRange()).toBeCloseTo(600);
  });
});
