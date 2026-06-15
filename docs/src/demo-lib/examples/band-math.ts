import {
  makeFixedBandScale,
  calculateFitScaleFactor,
} from "@visual-toolkit/d3-band-scales";
import { makeSvg, DEMO_COLORS } from "../section-helpers.js";
import { renderCell, renderLabel, renderLine, ANNOTATION_COLOR } from "../demo-render.js";

const ITEMS = ["A", "B", "C", "D"] as const;
const BANDWIDTH = 60;
const GAP = 10;
const SVG_H = 80;
const TOP_Y = 20;
const ROW_H = 28;
// Pink marker color for the right-edge tick
const EDGE_COLOR = "#f72585";

export function renderBandMath(mount: HTMLElement, containerWidth: number = 460): void {
  const items = ITEMS.map((id) => ({ id }));

  // Build a natural scale to get the content length
  const naturalScale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth: BANDWIDTH,
    gap: GAP,
  });
  const nativeRange = naturalScale.getRange();
  const k = calculateFitScaleFactor(nativeRange, containerWidth);

  // Build the fitted scale using scaleTo — all positions/widths pre-multiplied by k
  const fittedScale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth: BANDWIDTH,
    gap: GAP,
    scaleTo: containerWidth,
  });

  const svg = makeSvg(mount, containerWidth, SVG_H);

  // Header annotation: show native → k → fitted
  renderLabel(
    svg,
    `native: ${nativeRange}px  →  k = ${k.toFixed(2)}  →  fitted: ${containerWidth}px`,
    0,
    12,
    { anchor: "start", size: 9, weight: 700, color: ANNOTATION_COLOR },
  );

  // Draw each fitted band
  items.forEach(({ id }, i) => {
    const x0 = fittedScale.getX0(id) ?? 0;
    const x1 = fittedScale.getX1(id) ?? x0;
    const bw = x1 - x0;

    renderCell(svg, { x: x0, y: TOP_Y, width: bw, height: ROW_H }, {
      fill: DEMO_COLORS[i % DEMO_COLORS.length],
      rx: 4,
    });
    renderLabel(svg, id, x0 + bw / 2, TOP_Y + ROW_H / 2 + 4, {
      size: 10,
      weight: 600,
      color: "#fff",
    });
  });

  // Right-edge tick at containerWidth — shows getX1("D") = containerWidth
  renderLine(svg, containerWidth, TOP_Y - 4, containerWidth, TOP_Y + ROW_H + 4, {
    stroke: EDGE_COLOR,
    strokeWidth: 1.5,
  });
  renderLabel(
    svg,
    `x1("D") = ${containerWidth}`,
    containerWidth - 2,
    TOP_Y + ROW_H + 16,
    { anchor: "end", size: 8, color: EDGE_COLOR },
  );
}
