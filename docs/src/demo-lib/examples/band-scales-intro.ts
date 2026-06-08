import { scaleBand } from "d3-scale";
import { makeGrid } from "@visual-toolkit/d3-band-scales";
import { makeSvg } from "../section-helpers.js";
import { renderCell, renderLabel, renderLine, ANNOTATION_COLOR } from "../demo-render.js";

const ITEMS = ["A", "B", "C", "D", "E"];
const COLORS = ["#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0"];

const SVG_W = 640;
const ROW_H = 36;
const TOP_Y = 32;
const COL1_X = 80;
const COL2_X = 355;
const COL_W = 255;

const BAND_W = 40;
const BAND_GAP = 8;

export function renderBandScalesIntro(mount: HTMLElement): void {
  const svgH = TOP_Y + ROW_H + 32;
  const svg = makeSvg(mount, SVG_W, svgH);

  // Column headers
  renderLabel(svg, "d3.scaleBand (uniform, proportional)", COL1_X + COL_W / 2, 18, {
    size: 11,
    weight: 600,
    color: ANNOTATION_COLOR,
  });
  renderLabel(svg, "makeFixedBandScale (explicit px)", COL2_X + COL_W / 2, 18, {
    size: 11,
    weight: 600,
    color: ANNOTATION_COLOR,
  });

  // Left panel: d3.scaleBand for comparison
  const d3S = scaleBand<string>()
    .domain(ITEMS)
    .range([COL1_X, COL1_X + COL_W])
    .paddingInner(0.12)
    .paddingOuter(0.06);

  ITEMS.forEach((id, i) => {
    const x = d3S(id) ?? 0;
    const bw = d3S.bandwidth();

    renderCell(svg, { x, y: TOP_Y, width: bw, height: ROW_H }, {
      fill: COLORS[i % COLORS.length],
      rx: 3,
    });
    renderLabel(svg, id, x + bw / 2, TOP_Y + ROW_H / 2 + 4, {
      size: 11,
      weight: 600,
      color: "#fff",
    });
    renderLabel(svg, `${bw.toFixed(0)}px`, x + bw / 2, TOP_Y + ROW_H + 16, {
      size: 9,
      color: ANNOTATION_COLOR,
    });
  });

  // Right panel: makeGrid with string keys
  const grid = makeGrid({
    rows: { keys: ["row-0"] as const, bandwidth: ROW_H, padStart: TOP_Y },
    columns: {
      keys: ["col-0", "col-1", "col-2", "col-3", "col-4"] as const,
      bandwidth: BAND_W,
      gap: BAND_GAP,
      padStart: COL2_X,
    },
  });

  ITEMS.forEach((id, i) => {
    const colKey = `col-${i}` as "col-0" | "col-1" | "col-2" | "col-3" | "col-4";
    const { x, y, width, height } = grid.getCellRect("row-0", colKey);

    renderCell(svg, { x, y, width, height }, {
      fill: COLORS[i % COLORS.length],
      rx: 3,
    });
    renderLabel(svg, id, x + width / 2, y + height / 2 + 4, {
      size: 11,
      weight: 600,
      color: "#fff",
    });
    renderLabel(svg, `${width}px`, x + width / 2, y + height + 16, {
      size: 9,
      color: ANNOTATION_COLOR,
    });
  });

  // Gap annotation between col-0 and col-1
  const r0 = grid.getCellRect("row-0", "col-0");
  const r1 = grid.getCellRect("row-0", "col-1");
  const gapMidX = (r0.x + r0.width + r1.x) / 2;
  const gapLineY = TOP_Y + ROW_H + 5;

  renderLine(svg, r0.x + r0.width, gapLineY, r1.x, gapLineY, {
    stroke: "#f72585",
    strokeWidth: 1.5,
  });
  renderLabel(svg, "gap=8px", gapMidX, TOP_Y + ROW_H + 30, {
    size: 8,
    color: "#f72585",
  });
}
