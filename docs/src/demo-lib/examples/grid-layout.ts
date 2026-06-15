import {
  makeGrid,
  type ExtractKeyFromEnumBandScale,
} from "@visual-toolkit/d3-band-scales";
import { makeSvg } from "../section-helpers.js";
import { renderCell, renderLabel } from "../demo-render.js";

export type GridLayoutState = {
  col1Bandwidth: number;
  gap: number;
  lastRowEnabled: boolean;
};

const ROW_BW = 40;

const COLORS: [string, string][] = [
  ["#e8ecfd", "#4361ee"],
  ["#fce7f3", "#f72585"],
  ["#d1fae5", "#06d6a0"],
  ["#fef3c7", "#ffd166"],
];

const HIGHLIGHT_STROKE = "#f72585";

export function renderGridLayout(mount: HTMLElement, state: GridLayoutState): void {
  const { col1Bandwidth, gap, lastRowEnabled } = state;

  const grid = makeGrid({
    rows: {
      keys: ["row-0", "row-1", "row-2"] as const,
      bandwidth: ROW_BW,
      gap,
      disabledKeys: lastRowEnabled ? [] : ["row-2"],
    },
    columns: {
      entries: [
        { key: "col-0", bandwidth: 80 },
        { key: "col-1", bandwidth: col1Bandwidth },
        { key: "col-2", bandwidth: 80 },
      ],
      gap,
    },
  });

  // ExtractKeyFromEnumBandScale — derive the column key type at compile time
  type ColKey = ExtractKeyFromEnumBandScale<typeof grid.colScale>;
  const colKeys: ColKey[] = grid.colScale.getDomain() as ColKey[];
  const rowKeys = grid.rowScale.getDomain();

  const totalW = grid.colScale.getRange() + 8;
  const totalH = grid.rowScale.getRange() + 8;

  const svg = makeSvg(mount, Math.max(totalW, 120), Math.max(totalH, 60));

  rowKeys.forEach((rk, ri) => {
    colKeys.forEach((ck, ci) => {
      // col-0 and col-2: literal key; col-1: numeric index 1
      const rect = ci === 1
        ? grid.getCellRect(rk, 1)
        : grid.getCellRect(rk, ck);

      const [bg, fg] = COLORS[(ri * colKeys.length + ci) % COLORS.length];

      renderCell(svg, {
        x: rect.x,
        y: rect.y,
        width: Math.max(rect.width, 0),
        height: Math.max(rect.height, 0),
      }, {
        fill: bg,
        stroke: fg,
        strokeWidth: 1.5,
        rx: 3,
      });

      if (rect.width >= 20 && rect.height >= 12) {
        renderLabel(
          svg,
          // col-0/col-2: key addressing; col-1: numeric index addressing
          ci === 1 ? `[${ri},1]` : `${rk}/${ck}`,
          rect.x + rect.width / 2,
          rect.y + rect.height / 2 + 4,
          { size: 9, weight: 600, color: fg },
        );
      }
    });
  });

  // Highlight row-1/col-1 with numeric index addressing
  const highlight = grid.getCellRect(1, 1);
  const hlEl = renderCell(svg, {
    x: highlight.x - 2,
    y: highlight.y - 2,
    width: highlight.width + 4,
    height: highlight.height + 4,
  }, {
    fill: "none",
    stroke: HIGHLIGHT_STROKE,
    strokeWidth: 1.5,
    rx: 4,
  });
  hlEl.setAttribute("stroke-dasharray", "4 2");

  const infoY = highlight.y + highlight.height + 14;
  renderLabel(
    svg,
    `getCellRect(1,1) → {x:${highlight.x.toFixed(0)}, y:${highlight.y.toFixed(0)}, w:${highlight.width.toFixed(0)}, h:${highlight.height.toFixed(0)}}`,
    highlight.x + highlight.width / 2,
    infoY > totalH - 8 ? totalH - 4 : infoY,
    { size: 8, color: HIGHLIGHT_STROKE },
  );
}
