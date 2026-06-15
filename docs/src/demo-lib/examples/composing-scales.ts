import {
  makeGrid,
  makeEnumBandScale,
  calculateLengthFromFixedBandsWithGaps,
} from "@visual-toolkit/d3-band-scales";
import { makeSvg } from "../section-helpers.js";
import {
  renderCell,
  renderLabel,
  ANNOTATION_COLOR,
} from "../demo-render.js";

type GroupId = "gA" | "gB" | "gC";
type RowId = "r1" | "r2" | "r3";

const ROW_IDS = ["r1", "r2", "r3"] as const satisfies readonly RowId[];
const ROW_LABELS: Record<RowId, string> = { r1: "Row 1", r2: "Row 2", r3: "Row 3" };

const GROUPS: { id: GroupId; label: string; color: string }[] = [
  { id: "gA", label: "Group A", color: "#4361ee" },
  { id: "gB", label: "Group B", color: "#7209b7" },
  { id: "gC", label: "Group C", color: "#f72585" },
];

const INNER_SECTIONS: Record<GroupId, { key: string; bandwidth: number }[]> = {
  gA: [
    { key: "sA0", bandwidth: 48 },
    { key: "sA1", bandwidth: 72 },
    { key: "sA2", bandwidth: 32 },
  ],
  gB: [
    { key: "sB0", bandwidth: 52 },
    { key: "sB1", bandwidth: 44 },
  ],
  gC: [
    { key: "sC0", bandwidth: 60 },
    { key: "sC1", bandwidth: 30 },
    { key: "sC2", bandwidth: 50 },
    { key: "sC3", bandwidth: 28 },
  ],
};

const CELL_COLORS = [
  "#e8ecfd", "#ddd6fe", "#fce7f3", "#d1fae5", "#fef3c7", "#e0f2fe",
  "#ffe4e6", "#f0fdf4", "#fffbeb",
];

const ROW_H = 30;
const ROW_GAP = 4;
const INNER_GAP = 4;
const GROUP_GAP = 16;
const HEADER_H = 22;
const HEADER_GAP = 6;
const LABEL_COL_W = 40;
const PAD_TOP = 16;
const PAD_RIGHT = 24;
const PAD_BOTTOM = 20;

export function renderComposingScales(mount: HTMLElement): void {
  // One enum scale per group. Each group's outer column width derives from its
  // inner scale's range, so headers and columns align by construction.
  const innerScales = new Map(
    GROUPS.map(({ id }) => [
      id,
      makeEnumBandScale(INNER_SECTIONS[id], { gap: INNER_GAP }),
    ]),
  );

  const contentH = calculateLengthFromFixedBandsWithGaps(ROW_IDS.length, {
    bandwidth: ROW_H,
    gap: ROW_GAP,
  });

  const grid = makeGrid({
    rows: {
      keys: ROW_IDS,
      bandwidth: ROW_H,
      gap: ROW_GAP,
      padStart: PAD_TOP + HEADER_H + HEADER_GAP,
    },
    columns: {
      entries: GROUPS.map(({ id }) => ({
        key: id,
        bandwidth: innerScales.get(id)!.getRange(),
      })),
      gap: GROUP_GAP,
      padStart: LABEL_COL_W,
    },
  });

  const svgW = grid.colScale.getRange() + PAD_RIGHT;
  const svgH = PAD_TOP + HEADER_H + HEADER_GAP + contentH + PAD_BOTTOM;

  const svg = makeSvg(mount, svgW, svgH);

  // Bottom y of the last row (for px labels below cells)
  const lastRowRect = grid.getCellRect("r3", "gA");
  const pxLabelY = lastRowRect.y + lastRowRect.height + 11;

  GROUPS.forEach((group, gi) => {
    const { x: gx, width: gw } = grid.getCellRect("r1", group.id);
    const innerScale = innerScales.get(group.id)!;
    const innerSections = INNER_SECTIONS[group.id];

    renderCell(svg, { x: gx, y: PAD_TOP, width: gw, height: HEADER_H }, {
      fill: group.color,
      fillOpacity: 0.15,
      rx: 3,
    });
    renderLabel(svg, group.label, gx + gw / 2, PAD_TOP + HEADER_H / 2 + 4, {
      size: 10,
      weight: 700,
      color: group.color,
    });

    ROW_IDS.forEach((rowId) => {
      const { y: ry, height: rh } = grid.getCellRect(rowId, group.id);

      innerSections.forEach((sec, si) => {
        const sx0 = (innerScale.getX0(sec.key) ?? 0) + gx;
        const sx1 = (innerScale.getX1(sec.key) ?? 0) + gx;
        renderCell(svg, { x: sx0, y: ry, width: sx1 - sx0, height: rh }, {
          fill: CELL_COLORS[(si + gi) % CELL_COLORS.length],
          stroke: "#dee2e6",
          strokeWidth: 0.5,
          rx: 2,
        });
      });
    });

    // px bandwidth labels below all rows, one per inner section column
    innerSections.forEach((sec) => {
      const sx0 = (innerScale.getX0(sec.key) ?? 0) + gx;
      const sx1 = (innerScale.getX1(sec.key) ?? 0) + gx;
      renderLabel(svg, `${sec.bandwidth}px`, (sx0 + sx1) / 2, pxLabelY, {
        size: 8,
        color: ANNOTATION_COLOR,
      });
    });
  });

  ROW_IDS.forEach((rowId) => {
    const { y: ry, height: rh } = grid.getCellRect(rowId, "gA");
    renderLabel(svg, ROW_LABELS[rowId], LABEL_COL_W - 6, ry + rh / 2 + 4, {
      anchor: "end",
      size: 10,
    });
  });
}
