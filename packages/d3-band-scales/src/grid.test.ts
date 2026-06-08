import { describe, expect, it, expectTypeOf } from "vitest";
import { makeGrid } from "./grid.js";
import { makeEnumBandScale } from "./enum-band-scale.js";
import { makeFixedEnumBandScale } from "./fixed-enum-band-scale.js";
import type {
  ExtractKeyFromEnumBandScale,
  ExtractKeyFromFixedEnumBandScale,
  ExtractIndexFromKey,
  ExtractIndexesFromEnumBandScale,
  ExtractIndexesFromFixedEnumBandScale,
} from "./enum-scale-type-extractors.js";

describe("ExtractKeyFromEnumBandScale", () => {
  it("extracts the literal Key union", () => {
    const scale = makeEnumBandScale([
      { key: "col-0", bandwidth: 50 },
      { key: "col-1", bandwidth: 80 },
    ]);
    type K = ExtractKeyFromEnumBandScale<typeof scale>;
    expectTypeOf<K>().toEqualTypeOf<"col-0" | "col-1">();
  });
});

describe("ExtractKeyFromFixedEnumBandScale", () => {
  it("extracts the literal Key union", () => {
    const scale = makeFixedEnumBandScale(
      [{ key: "row-0" }, { key: "row-1" }],
      { bandwidth: 40 }
    );
    type K = ExtractKeyFromFixedEnumBandScale<typeof scale>;
    expectTypeOf<K>().toEqualTypeOf<"row-0" | "row-1">();
  });
});

describe("ExtractIndexFromKey", () => {
  it("extracts trailing numeric index from dash-suffixed keys", () => {
    type I = ExtractIndexFromKey<"row-0" | "row-1" | "row-2">;
    expectTypeOf<I>().toEqualTypeOf<0 | 1 | 2>();
  });

  it("returns never for keys without numeric tail", () => {
    type I = ExtractIndexFromKey<"header" | "footer">;
    expectTypeOf<I>().toEqualTypeOf<never>();
  });

  it("handles multiple dashes — extracts last numeric tail", () => {
    type I = ExtractIndexFromKey<"section-a-7">;
    expectTypeOf<I>().toEqualTypeOf<7>();
  });
});

describe("ExtractIndexesFromEnumBandScale", () => {
  it("extracts numeric index union from enum scale", () => {
    const scale = makeEnumBandScale([
      { key: "col-0", bandwidth: 50 },
      { key: "col-1", bandwidth: 80 },
    ]);
    type Idx = ExtractIndexesFromEnumBandScale<typeof scale>;
    expectTypeOf<Idx>().toEqualTypeOf<0 | 1>();
  });
});

describe("ExtractIndexesFromFixedEnumBandScale", () => {
  it("extracts numeric index union from fixed-enum scale", () => {
    const scale = makeFixedEnumBandScale(
      [{ key: "row-0" }, { key: "row-1" }, { key: "row-2" }],
      { bandwidth: 40 }
    );
    type Idx = ExtractIndexesFromFixedEnumBandScale<typeof scale>;
    expectTypeOf<Idx>().toEqualTypeOf<0 | 1 | 2>();
  });
});

describe("makeGrid — keys×keys (fixed×fixed)", () => {
  // rows: "row-0", "row-1", "row-2"  bandwidth=40, gap=4
  // cols: "col-0", "col-1"  bandwidth=80, gap=8
  // row-0: y0=0, y1=40; row-1: y0=44, y1=84; row-2: y0=88, y1=128
  // col-0: x0=0, x1=80; col-1: x0=88, x1=168
  const grid = makeGrid({
    rows: { keys: ["row-0", "row-1", "row-2"] as const, bandwidth: 40, gap: 4 },
    columns: { keys: ["col-0", "col-1"] as const, bandwidth: 80, gap: 8 },
  });

  it("getCellPosition with literal keys", () => {
    const pos = grid.getCellPosition("row-0", "col-0");
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it("getCellPosition second row, second col", () => {
    const pos = grid.getCellPosition("row-1", "col-1");
    expect(pos.x).toBeCloseTo(88); // col-1.x0
    expect(pos.y).toBeCloseTo(44); // row-1.x0
  });

  it("getCellPosition with numeric indexes", () => {
    // row index 2 → row-2, col index 1 → col-1
    const pos = grid.getCellPosition(2, 1);
    expect(pos.x).toBeCloseTo(88);
    expect(pos.y).toBeCloseTo(88);
  });

  it("getCellPosition — key and index addressing are equivalent", () => {
    const byKey = grid.getCellPosition("row-1", "col-0");
    const byIdx = grid.getCellPosition(1, 0);
    expect(byKey.x).toBeCloseTo(byIdx.x);
    expect(byKey.y).toBeCloseTo(byIdx.y);
  });

  it("getCellPosition falls back to 0 for missing key", () => {
    const pos = grid.getCellPosition("row-99" as any, "col-0");
    expect(pos.y).toBe(0);
  });

  it("getCellRect no span — width/height equal single band", () => {
    const rect = grid.getCellRect("row-0", "col-0");
    expect(rect.x).toBeCloseTo(0);
    expect(rect.y).toBeCloseTo(0);
    expect(rect.width).toBeCloseTo(80);
    expect(rect.height).toBeCloseTo(40);
  });

  it("getCellRect colSpan=2 — width spans both cols including gap", () => {
    const rect = grid.getCellRect("row-0", "col-0", { colSpan: 2 });
    // x0=0, x1=col-1.x1=168 → width=168
    expect(rect.width).toBeCloseTo(168);
    expect(rect.height).toBeCloseTo(40);
  });

  it("getCellRect rowSpan=2 — height spans two rows including gap", () => {
    const rect = grid.getCellRect("row-0", "col-0", { rowSpan: 2 });
    // y0=0, y1=row-1.y1=84 → height=84
    expect(rect.height).toBeCloseTo(84);
    expect(rect.width).toBeCloseTo(80);
  });

  it("getCellRect rowSpan=3 covers all rows", () => {
    const rect = grid.getCellRect("row-0", "col-0", { rowSpan: 3 });
    // y0=0, y1=row-2.y1=128 → height=128
    expect(rect.height).toBeCloseTo(128);
  });

  it("getCellRect span clamped at domain boundary", () => {
    const rect = grid.getCellRect("row-1", "col-0", { rowSpan: 99 });
    // row-1 to row-2 (last): height = row-2.y1(128) − row-1.y0(44) = 84
    expect(rect.height).toBeCloseTo(84);
  });
});

describe("makeGrid — entries×entries (dynamic×dynamic)", () => {
  const grid = makeGrid({
    rows: {
      entries: [
        { key: "hdr", bandwidth: 30 },
        { key: "body", bandwidth: 100 },
        { key: "ftr", bandwidth: 20 },
      ],
      gap: 5,
    },
    columns: {
      entries: [
        { key: "left", bandwidth: 60 },
        { key: "right", bandwidth: 120 },
      ],
      gap: 10,
    },
  });

  it("getCellPosition for dynamic rows and cols", () => {
    // hdr: y0=0; left: x0=0
    const pos = grid.getCellPosition("hdr", "left");
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it("getCellPosition body+right", () => {
    // hdr.y1=30; body.y0=35; right.x0=70
    const pos = grid.getCellPosition("body", "right");
    expect(pos.x).toBeCloseTo(70);
    expect(pos.y).toBeCloseTo(35);
  });

  it("getCellRect correct width from dynamic bandwidth", () => {
    const rect = grid.getCellRect("body", "left");
    expect(rect.width).toBeCloseTo(60);
    expect(rect.height).toBeCloseTo(100);
  });
});

describe("makeGrid — keys×entries (fixed×dynamic)", () => {
  const grid = makeGrid({
    rows: { keys: ["row-0", "row-1"] as const, bandwidth: 50, gap: 5 },
    columns: {
      entries: [
        { key: "col-a", bandwidth: 80 },
        { key: "col-b", bandwidth: 40 },
      ],
      gap: 6,
    },
  });

  it("getCellPosition mixes fixed rows and dynamic cols", () => {
    // row-1: y0=55; col-b: x0=86
    const pos = grid.getCellPosition("row-1", "col-b");
    expect(pos.x).toBeCloseTo(86);
    expect(pos.y).toBeCloseTo(55);
  });

  it("getCellRect spans correctly across mixed axes", () => {
    // row-0 y0=0, col-a x0=0, no span
    const rect = grid.getCellRect("row-0", "col-a");
    expect(rect.width).toBeCloseTo(80);
    expect(rect.height).toBeCloseTo(50);
  });
});

describe("makeGrid — prebuilt scale pass-through", () => {
  const rowScale = makeFixedEnumBandScale(
    [{ key: "row-0" }, { key: "row-1" }],
    { bandwidth: 40, gap: 4 }
  );
  const colScale = makeEnumBandScale([
    { key: "col-0", bandwidth: 80 },
    { key: "col-1", bandwidth: 60 },
  ]);
  const grid = makeGrid({ rows: rowScale, columns: colScale });

  it("uses the prebuilt row scale", () => {
    expect(grid.rowScale).toBe(rowScale);
  });

  it("uses the prebuilt col scale", () => {
    expect(grid.colScale).toBe(colScale);
  });

  it("getCellPosition works with prebuilt scales", () => {
    // row-0: y0=0, col-0: x0=0
    const pos = grid.getCellPosition("row-0", "col-0");
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it("numeric index addressing works with prebuilt scales", () => {
    const byKey = grid.getCellPosition("row-1", "col-1");
    const byIdx = grid.getCellPosition(1, 1);
    expect(byKey).toEqual(byIdx);
  });
});

describe("makeGrid — numeric index addressing", () => {
  const grid = makeGrid({
    rows: { keys: ["row-0", "row-1", "row-2"] as const, bandwidth: 40, gap: 4 },
    columns: { keys: ["col-0", "col-1"] as const, bandwidth: 80, gap: 8 },
  });

  it("index 0 resolves to first key", () => {
    expect(grid.getCellPosition(0, 0)).toEqual(grid.getCellPosition("row-0", "col-0"));
  });

  it("index 1 resolves to second key", () => {
    expect(grid.getCellPosition(1, 1)).toEqual(grid.getCellPosition("row-1", "col-1"));
  });

  it("getCellRect by index is equivalent to by key", () => {
    const byKey = grid.getCellRect("row-2", "col-1", { rowSpan: 1 });
    const byIdx = grid.getCellRect(2, 1);
    expect(byKey).toEqual(byIdx);
  });

  it("index param type is narrowed to 0|1|2 for row and 0|1 for col", () => {
    // Valid: accepts keys "row-0"|"row-1"|"row-2" or indexes 0|1|2
    grid.getCellPosition("row-0", "col-0");
    grid.getCellPosition(0, 0);
    grid.getCellPosition(2, 1);

    // @ts-expect-error 9 is not in the row index union 0|1|2
    grid.getCellPosition(9, 0);
  });
});

describe("makeGrid — keys without numeric tail", () => {
  const grid = makeGrid({
    rows: {
      entries: [
        { key: "header", bandwidth: 30 },
        { key: "section", bandwidth: 80 },
      ],
    },
    columns: {
      entries: [
        { key: "left", bandwidth: 60 },
        { key: "right", bandwidth: 120 },
      ],
    },
  });

  it("key addressing works for non-numeric-tail keys", () => {
    const pos = grid.getCellPosition("header", "left");
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it("getCellRect works for non-numeric-tail keys", () => {
    const rect = grid.getCellRect("section", "right");
    expect(rect.width).toBeCloseTo(120);
    expect(rect.height).toBeCloseTo(80);
  });
});

describe("makeGrid — getContentCellRect", () => {
  // rows: "row-0", "row-1"  bandwidth=50, gap=5, contentOffsetStart=5, contentOffsetEnd=5
  //   row-0: contentX0=5, contentX1=45, contentHeight=40
  // cols: "col-0", "col-1"  bandwidth=80, gap=8, contentOffsetStart=8, contentOffsetEnd=4
  //   col-0: contentX0=8, contentX1=72, contentWidth=64
  const grid = makeGrid({
    rows: {
      keys: ["row-0", "row-1"] as const,
      bandwidth: 50,
      gap: 5,
      contentOffsetStart: 5,
      contentOffsetEnd: 5,
    },
    columns: {
      keys: ["col-0", "col-1"] as const,
      bandwidth: 80,
      gap: 8,
      contentOffsetStart: 8,
      contentOffsetEnd: 4,
    },
  });

  it("getContentCellRect returns content-inset rect", () => {
    const rect = grid.getContentCellRect("row-0", "col-0");
    expect(rect.x).toBeCloseTo(8);   // contentX0 of col-0
    expect(rect.y).toBeCloseTo(5);   // contentX0 of row-0
    expect(rect.width).toBeCloseTo(68);  // contentX1=80−4=76, wait: x1=80−4=76, x0=8 → width=68
    expect(rect.height).toBeCloseTo(40); // 50 − 5 − 5 = 40
  });

  it("getContentCellRect by index", () => {
    const byKey = grid.getContentCellRect("row-1", "col-1");
    const byIdx = grid.getContentCellRect(1, 1);
    expect(byKey).toEqual(byIdx);
  });
});

describe("makeGrid — scaleTo on axes", () => {
  it("scales row and col axes independently", () => {
    // rows: 2 items @ 50px + 5 gap = 105 natural; scaleTo 210 → factor 2
    // cols: 2 items @ 80px + 8 gap = 168 natural; scaleTo 336 → factor 2
    const grid = makeGrid({
      rows: { keys: ["row-0", "row-1"] as const, bandwidth: 50, gap: 5, scaleTo: 210 },
      columns: { keys: ["col-0", "col-1"] as const, bandwidth: 80, gap: 8, scaleTo: 336 },
    });
    // row-1.y0 = (50+5)*2 = 110
    expect(grid.getCellPosition("row-1", "col-0").y).toBeCloseTo(110);
    // col-1.x0 = (80+8)*2 = 176
    expect(grid.getCellPosition("row-0", "col-1").x).toBeCloseTo(176);
  });
});

describe("makeGrid — disabledKeys in KeysAxisSpec", () => {
  const grid = makeGrid({
    rows: {
      keys: ["row-0", "row-1", "row-2"] as const,
      bandwidth: 40,
      gap: 4,
      disabledKeys: ["row-1"],
    },
    columns: { keys: ["col-0"] as const, bandwidth: 80, gap: 0 },
  });

  it("disabled key is excluded from domain", () => {
    // rowScale only has row-0 and row-2
    const rowScale = grid.rowScale as any;
    expect(rowScale.getDomain()).toEqual(["row-0", "row-2"]);
  });

  it("disabled key falls back to 0", () => {
    const pos = grid.getCellPosition("row-1", "col-0");
    expect(pos.y).toBe(0);
  });
});

describe("makeGrid — span includes gaps", () => {
  // rows: "row-0"→y0=0,y1=40; "row-1"→y0=44,y1=84; "row-2"→y0=88,y1=128
  // colSpan across col-0→col-1: x0=0 to x1=col-1.x1=168
  const grid = makeGrid({
    rows: { keys: ["row-0", "row-1", "row-2"] as const, bandwidth: 40, gap: 4 },
    columns: { keys: ["col-0", "col-1"] as const, bandwidth: 80, gap: 8 },
  });

  it("span width includes the gap between bands", () => {
    const rect = grid.getCellRect("row-0", "col-0", { colSpan: 2 });
    // col-0.x0=0, col-1.x1=168; gap of 8 is included
    expect(rect.width).toBeCloseTo(168);
  });

  it("span height includes the gap between rows", () => {
    const rect = grid.getCellRect("row-0", "col-0", { rowSpan: 2 });
    // row-0.y0=0, row-1.y1=84; gap of 4 included
    expect(rect.height).toBeCloseTo(84);
  });

  it("single-cell span width equals bandwidth", () => {
    const rect = grid.getCellRect("row-0", "col-0", { colSpan: 1 });
    expect(rect.width).toBeCloseTo(80);
  });
});
