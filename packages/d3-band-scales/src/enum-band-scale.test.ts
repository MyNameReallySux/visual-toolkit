import { describe, expect, it } from "vitest";
import { makeEnumBandScale } from "./enum-band-scale.js";
import { makeFixedEnumBandScale } from "./fixed-enum-band-scale.js";

describe("makeEnumBandScale", () => {
  const scale = makeEnumBandScale([
    { key: "col-0", bandwidth: 50 },
    { key: "col-1", bandwidth: 80 },
    { key: "col-2", bandwidth: 60 },
  ]);

  it("returns correct bandwidth per key", () => {
    expect(scale.getBandwidth("col-0")).toBe(50);
    expect(scale.getBandwidth("col-1")).toBe(80);
  });

  it("x0 of first key is 0", () => {
    expect(scale.getX0("col-0")).toBe(0);
  });

  it("callable returns output for known key", () => {
    const out = scale("col-0");
    expect(out?.bandwidth).toBe(50);
  });

  it("returns undefined for unknown key", () => {
    expect(scale("col-99" as any)).toBeUndefined();
  });
});

describe("makeEnumBandScale — per-entry gap (M5)", () => {
  // Per-entry gap is the leading gap *before* that band.
  // Entry a: gap=20 (ignored for first band), bandwidth=100
  // Entry b: gap=5 (leading gap before b), bandwidth=80
  // Entry c: gap omitted → uses global gap=10
  const scale = makeEnumBandScale([
    { key: "a", bandwidth: 100, gap: 20 },
    { key: "b", bandwidth: 80, gap: 5 },
    { key: "c", bandwidth: 60 },
  ], { gap: 10 });

  it("first item x0 is 0", () => {
    expect(scale.getX0("a")).toBe(0);
  });

  it("second item uses its own per-entry gap as leading gap", () => {
    // a.x1=100, b.gap=5 → b.x0=105
    expect(scale.getX0("b")).toBe(105);
  });

  it("third item without per-entry gap uses global gap", () => {
    // b.x1=105+80=185, c.gap=10 (global) → c.x0=195
    expect(scale.getX0("c")).toBe(195);
  });

  it("falls back to global gap when entry has no gap", () => {
    const s2 = makeEnumBandScale([
      { key: "x", bandwidth: 60 },
      { key: "y", bandwidth: 40 },
    ], { gap: 12 });
    // x.x1=60, y.gap=12 → y.x0=72
    expect(s2.getX0("y")).toBe(72);
  });
});

describe("makeEnumBandScale — per-entry contentOffsetStart + contentOffsetEnd", () => {
  // global: contentOffsetStart=5, contentOffsetEnd=5
  // a: no overrides → start=5, end=5, bw=100 → contentBandwidth=90
  // b: contentOffsetStart=15 → start=15, end=5, bw=80 → contentBandwidth=60
  // c: contentOffsetEnd=0 → start=5, end=0, bw=60 → contentBandwidth=55
  const scale = makeEnumBandScale([
    { key: "a", bandwidth: 100 },
    { key: "b", bandwidth: 80, contentOffsetStart: 15 },
    { key: "c", bandwidth: 60, contentOffsetEnd: 0 },
  ], { gap: 10, contentOffsetStart: 5, contentOffsetEnd: 5 });

  it("a uses global start and end", () => {
    expect(scale.getContentX0("a")).toBe(5); // x0=0 + 5
    expect(scale.getContentX1("a")).toBe(95); // x1=100 − 5
    expect(scale.getContentBandwidth("a")).toBe(90);
  });

  it("b uses per-entry start override, global end", () => {
    // b.x0 = 100 + 10 = 110
    expect(scale.getContentX0("b")).toBe(125); // 110 + 15
    expect(scale.getContentX1("b")).toBe(185); // 110+80=190 − 5
    expect(scale.getContentBandwidth("b")).toBe(60); // 80 − 15 − 5
  });

  it("c uses global start, per-entry end override of 0", () => {
    // c.x0 = 190 + 10 = 200
    expect(scale.getContentX0("c")).toBe(205); // 200 + 5
    expect(scale.getContentX1("c")).toBe(260); // 200+60=260 − 0
    expect(scale.getContentBandwidth("c")).toBe(55); // 60 − 5 − 0
  });
});

describe("makeFixedEnumBandScale", () => {
  const scale = makeFixedEnumBandScale(
    [
      { key: "row-0" },
      { key: "row-1", isEnabled: false }, // filtered out
      { key: "row-2" },
    ],
    { bandwidth: 40, gap: 5 },
  );

  it("doesKeyExist returns true for enabled keys", () => {
    expect(scale.doesKeyExist("row-0")).toBe(true);
    expect(scale.doesKeyExist("row-2")).toBe(true);
  });

  it("doesKeyExist returns false for disabled key", () => {
    expect(scale.doesKeyExist("row-1")).toBe(false);
  });

  it("getDomain excludes disabled key", () => {
    expect(scale.getDomain()).toEqual(["row-0", "row-2"]);
  });

  it("getBandwidth is fixed across all enabled items", () => {
    expect(scale.getBandwidth()).toBe(40);
  });

  it("getX0 of first key is 0", () => {
    expect(scale.getX0("row-0")).toBe(0);
  });

  it("getX0 of second key = bandwidth + gap", () => {
    expect(scale.getX0("row-2")).toBe(45);
  });
});

describe("makeFixedEnumBandScale — global contentOffset passthrough", () => {
  const scale = makeFixedEnumBandScale(
    [{ key: "row-0" }, { key: "row-1" }],
    { bandwidth: 60, gap: 8, contentOffsetStart: 10, contentOffsetEnd: 6 },
  );

  it("getContentX0 = x0 + start", () => {
    expect(scale.getContentX0("row-0")).toBe(10); // x0=0 + 10
    expect(scale.getContentX0("row-1")).toBe(78); // x0=68 + 10
  });

  it("getContentX1 = x1 − end", () => {
    expect(scale.getContentX1("row-0")).toBe(54); // x1=60 − 6
  });

  it("getContentBandwidth = bandwidth − start − end", () => {
    expect(scale.getContentBandwidth()).toBe(44); // 60 − 10 − 6
  });
});
