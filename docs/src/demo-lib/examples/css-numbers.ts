import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";
import { makeSvg, DEMO_COLORS } from "../section-helpers.js";
import { renderCell, renderLabel, ANNOTATION_COLOR } from "../demo-render.js";

const ITEMS = ["A", "B", "C"] as const;
const SVG_W = 340;
const SVG_H = 70;
const TOP_Y = 20;
const ROW_H = 36;

export function renderCssNumbers(mount: HTMLElement): void {
  // CSS strings are parsed exactly like raw numbers
  const scale = makeFixedBandScale(ITEMS.map((id) => ({ id })), {
    selectId: (d) => d.id,
    bandwidth: "80px",
    gap: "12px",
    padStart: 16,
  });

  const svg = makeSvg(mount, SVG_W, SVG_H);

  renderLabel(
    svg,
    `bandwidth:"80px", gap:"12px" → parsed same as numbers`,
    16,
    12,
    { anchor: "start", size: 9, weight: 700, color: ANNOTATION_COLOR }
  );

  ITEMS.forEach((id, i) => {
    const x0 = scale.getX0(id) ?? 0;
    const x1 = scale.getX1(id) ?? x0;
    const bw = x1 - x0;

    renderCell(svg, { x: x0, y: TOP_Y, width: bw, height: ROW_H }, {
      fill: DEMO_COLORS[i % DEMO_COLORS.length],
      rx: 4,
    });
    renderLabel(svg, id, x0 + bw / 2, TOP_Y + ROW_H / 2 + 4, {
      size: 11,
      weight: 600,
      color: "#fff",
    });
    renderLabel(svg, `${bw}px`, x0 + bw / 2, TOP_Y + ROW_H + 12, {
      size: 8,
      color: ANNOTATION_COLOR,
    });
  });

}
