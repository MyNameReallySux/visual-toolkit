import { makeGrid, makeEnumBandScale } from "@visual-toolkit/d3-band-scales";

// Inner scale: named sections with explicit pixel widths.
const inner = makeEnumBandScale(
  [
    { key: "s0", bandwidth: 48 },
    { key: "s1", bandwidth: 72 },
  ],
  { gap: 4 }
);

// Outer grid: size the group's column from the inner scale's range,
// so the two scales align by construction.
const grid = makeGrid({
  rows: { keys: ["r1", "r2"] as const, bandwidth: 30, gap: 4 },
  columns: { entries: [{ key: "gA", bandwidth: inner.getRange() }], gap: 16 },
});

grid.getCellRect("r2", "gA"); // → { x: 0, y: 34, width: 124, height: 30 }
inner.getX0("s1"); // → 52 (offset within the group)
