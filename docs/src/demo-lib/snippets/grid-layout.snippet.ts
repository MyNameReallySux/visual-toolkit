import { makeGrid } from "@visual-toolkit/d3-band-scales";

const grid = makeGrid({
  rows: {
    keys: ["row-0", "row-1", "row-2"] as const,
    bandwidth: 40,
    gap: 6,
  },
  columns: {
    entries: [
      { key: "col-0", bandwidth: 80 },
      { key: "col-1", bandwidth: 120 },
      { key: "col-2", bandwidth: 80 },
    ],
    gap: 6,
  },
});

// Cells are addressable by literal key or by numeric index — same result.
grid.getCellRect("row-1", "col-1"); // → { x: 86, y: 46, width: 120, height: 40 }
grid.getCellRect(1, 1);             // → { x: 86, y: 46, width: 120, height: 40 }
grid.colScale.getRange();           // → 292
grid.rowScale.getRange();           // → 132
