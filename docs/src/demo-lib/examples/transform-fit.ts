import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";
import { makeSvg, DEMO_COLORS } from "../section-helpers.js";
import { renderCell, renderLabel } from "../demo-render.js";

export type TransformFitOptions = {
  count: number;
  bandwidth: number;
  gap: number;
};

const ROW_H = 36;
const TOP_Y = 22;
const SVG_H = TOP_Y + ROW_H + 8;

// Minimum pixel width before we skip the band label
const MIN_LABEL_BW = 16;

/** Render a scaleTo demo into `wrap` at the given pixel width. */
export function renderInContainer(
  wrap: HTMLElement,
  containerWidth: number,
  options: TransformFitOptions,
  labelText: string,
): void {
  const { count, bandwidth, gap } = options;

  const items = Array.from({ length: count }, (_, i) => {
    const letter = String.fromCharCode(65 + (i % 26));
    return { id: count > 26 ? `${letter}${Math.floor(i / 26)}` : letter };
  });

  // scaleTo stretches the layout to fill containerWidth exactly.
  const scale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth,
    gap,
    scaleTo: containerWidth,
  });

  const svg = makeSvg(wrap, containerWidth, SVG_H);

  // Header line: label + scale factor
  renderLabel(svg, `${labelText} — k=${scale.getScaleFactor().toFixed(2)}`, 0, 14, {
    anchor: "start",
    size: 9,
    weight: 700,
    color: "#6c757d",
  });

  items.forEach(({ id }, i) => {
    const x0 = scale.getX0(id) ?? 0;
    const x1 = scale.getX1(id) ?? x0;
    const bw = Math.max(x1 - x0, 1);

    renderCell(svg, { x: x0, y: TOP_Y, width: bw, height: ROW_H }, {
      fill: DEMO_COLORS[i % DEMO_COLORS.length],
      rx: 4,
    });

    if (bw >= MIN_LABEL_BW) {
      const fontSize = bw >= 24 ? 11 : bw >= 16 ? 8 : 7;
      renderLabel(svg, id, x0 + bw / 2, TOP_Y + ROW_H / 2 + 4, {
        size: fontSize,
        weight: 600,
        color: "#fff",
      });
    }
  });
}
