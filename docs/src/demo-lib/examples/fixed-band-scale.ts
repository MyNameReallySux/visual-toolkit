import {
  makeFixedBandScale,
  calculateLengthFromFixedBandsWithGaps,
} from "@visual-toolkit/d3-band-scales";
import { makeSvg, DEMO_COLORS } from "../section-helpers.js";
import { renderCell, renderLabel, renderDimensionLine } from "../demo-render.js";

export type FixedBandState = { count: number; bandwidth: number; gap: number };

const PAD_LEFT = 16;
const PAD_RIGHT = 16;
// Extra bottom gutter so the dimension annotation isn't clipped
const ANNOT_GUTTER = 24;
const TOP_Y = 28;
const ROW_H = 38;
const MIN_SVG_W = 120;
// Bands narrower than this skip their index label
const MIN_LABELED_BANDWIDTH = 18;

export function renderFixedBandScale(mount: HTMLElement, state: FixedBandState): void {
  const { count, bandwidth, gap } = state;
  const items = Array.from({ length: count }, (_, i) => ({ id: `item-${i}` }));

  // getRange() includes padStart+padEnd; pass them so totalW = full SVG width.
  const totalW = calculateLengthFromFixedBandsWithGaps(count, {
    bandwidth,
    gap,
    padStart: PAD_LEFT,
    padEnd: PAD_RIGHT,
  });

  const scale = makeFixedBandScale(items, {
    selectId: (d) => d.id,
    bandwidth,
    gap,
    padStart: PAD_LEFT,
  });

  const svg = makeSvg(mount, Math.max(totalW, MIN_SVG_W), TOP_Y + ROW_H + ANNOT_GUTTER);

  items.forEach(({ id }, i) => {
    const x0 = scale.getX0(id) ?? PAD_LEFT;
    const x1 = scale.getX1(id) ?? x0;
    const bw = x1 - x0;

    renderCell(svg, { x: x0, y: TOP_Y, width: bw, height: ROW_H }, {
      fill: DEMO_COLORS[i % DEMO_COLORS.length],
      rx: 4,
    });

    if (bw >= MIN_LABELED_BANDWIDTH) {
      renderLabel(svg, String(i), x0 + bw / 2, TOP_Y + ROW_H / 2 + 4, {
        size: 10,
        weight: 600,
        color: "#fff",
      });
    }
  });

  // Dimension annotation inside the bottom gutter — spans first band to last.
  const firstX0 = scale.getX0("item-0") ?? PAD_LEFT;
  const lastX1 = scale.getX1(`item-${count - 1}`) ?? totalW - PAD_RIGHT;
  renderDimensionLine(
    svg,
    `getRange() → ${scale.getRange()}px`,
    firstX0,
    lastX1,
    TOP_Y + ROW_H + 14
  );
}
