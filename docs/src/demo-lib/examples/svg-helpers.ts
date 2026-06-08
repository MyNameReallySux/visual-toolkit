import { makeGrid } from "@visual-toolkit/d3-band-scales";
import {
  applyRectangleAsProps,
  estimateSvgTextSize,
} from "@visual-toolkit/d3-helpers";
import { makeSvg, DEMO_COLORS } from "../section-helpers.js";
import { renderLabel } from "../demo-render.js";

const ITEMS = ["Jan", "Feb", "Mar", "Apr", "May"] as const;
const SVG_W = 520;
const SVG_H = 110;
const BANDWIDTH = 70;
const GAP = 12;
const DEFAULT_FONT_SIZE = 11;

const GRID = makeGrid({
  rows: { keys: ["row-0"] as const, bandwidth: 40, padStart: 24 },
  columns: {
    keys: ["col-0", "col-1", "col-2", "col-3", "col-4"] as const,
    bandwidth: BANDWIDTH,
    gap: GAP,
    padStart: 16,
  },
});

export function renderSvgHelpers(mount: HTMLElement, fontSize: number = DEFAULT_FONT_SIZE): void {
  const svg = makeSvg(mount, SVG_W, SVG_H);

  // Header label
  renderLabel(
    svg,
    "applyRectangleAsProps → each <g> uses translate(x, y) + width/height attrs",
    16,
    14,
    { anchor: "start", size: 9, weight: 600 }
  );

  ITEMS.forEach((label, i) => {
    const { x, y, width, height } = GRID.getCellRect("row-0", i as 0 | 1 | 2 | 3 | 4);

    // applyRectangleAsProps encodes x/y as a CSS translate() transform
    const { transform: tx } = applyRectangleAsProps({ x, y, width, height });

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", tx);
    svg.appendChild(g);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(height));
    rect.setAttribute("fill", DEMO_COLORS[i % DEMO_COLORS.length]);
    rect.setAttribute("rx", "4");
    g.appendChild(rect);

    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", String(width / 2));
    lbl.setAttribute("y", String(height / 2 + 4));
    lbl.setAttribute("text-anchor", "middle");
    lbl.setAttribute("font-size", String(fontSize));
    lbl.setAttribute("font-weight", "600");
    lbl.setAttribute("fill", "#fff");
    lbl.textContent = label;
    g.appendChild(lbl);

    // estimateSvgTextSize gives a pixel width estimate for text layout decisions
    const { width: estW } = estimateSvgTextSize({ text: label, fontSize, fontWeight: "600" });

    const hint = document.createElementNS("http://www.w3.org/2000/svg", "text");
    hint.setAttribute("x", String(width / 2));
    hint.setAttribute("y", String(height + 14));
    hint.setAttribute("text-anchor", "middle");
    hint.setAttribute("font-size", "8");
    hint.setAttribute("fill", "#adb5bd");
    hint.textContent = `~${estW.toFixed(0)}px`;
    g.appendChild(hint);
  });
}
