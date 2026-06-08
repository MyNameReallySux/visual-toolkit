import {
  makeFixedBandScale,
  makeEnumBandScale,
  type EnumLayoutEntry,
} from "@visual-toolkit/d3-band-scales";
import { makeSvg, DEMO_COLORS } from "../section-helpers.js";
import { renderCell, renderLabel, renderLine, ANNOTATION_COLOR } from "../demo-render.js";

export type MarginsGapsState = {
  gap: number;
  padStart: number;
  padEnd: number;
};

export type ContentInsetsState = {
  offsetStart: number;
  offsetEnd: number;
};

export type PerItemInsetsState = {
  xOffsetStart: number;
  xOffsetEnd: number;
  offsetStart: number;
  offsetEnd: number;
};

const ITEMS = ["A", "B", "C", "D", "E"];
const BAND_H = 36;
const TOP_Y = 52;
const BANDWIDTH = 48;
const SVG_W_MAX = 680;

const COLOR_PAD = "#fde68a";
const COLOR_GAP = "#fca5a5";
const COLOR_BAND = "#93c5fd";
const COLOR_INSET_START = "#fcd34d";
const COLOR_INSET_END = "#f9a8d4";

/** Render visual anatomy of padStart / bands / gaps / padEnd with live getRange(). */
export function renderMarginsGaps(mount: HTMLElement, state: MarginsGapsState): void {
  const { gap, padStart, padEnd } = state;

  const scale = makeFixedBandScale(ITEMS.map((id) => ({ id })), {
    selectId: (d) => d.id,
    bandwidth: BANDWIDTH,
    gap,
    padStart,
    padEnd,
  });

  const totalW = Math.min(Math.max(scale.getRange(), 80), SVG_W_MAX);
  const svgH = TOP_Y + BAND_H + 48;

  const svg = makeSvg(mount, totalW, svgH);

  // padStart zone
  if (padStart > 0) {
    renderCell(svg, { x: 0, y: TOP_Y, width: padStart, height: BAND_H }, {
      fill: COLOR_PAD,
      fillOpacity: 0.6,
    });
    renderLabel(svg, `padStart ${padStart}px`, padStart / 2, TOP_Y + BAND_H / 2 + 4, {
      size: 9,
      weight: 700,
      color: "#92400e",
    });
  }

  // Bands and gaps
  ITEMS.forEach((id, i) => {
    const x0 = scale.getX0(id) ?? 0;
    const x1 = scale.getX1(id) ?? x0;
    const bw = x1 - x0;

    renderCell(svg, { x: x0, y: TOP_Y, width: bw, height: BAND_H }, {
      fill: COLOR_BAND,
      stroke: DEMO_COLORS[0],
      strokeWidth: 1,
      rx: 3,
    });
    renderLabel(svg, id, x0 + bw / 2, TOP_Y + BAND_H / 2 + 4, {
      size: 10,
      weight: 700,
      color: DEMO_COLORS[0],
    });

    const nextId = ITEMS[i + 1];
    if (nextId && gap > 0) {
      const gx0 = x1;
      const gx1 = scale.getX0(nextId) ?? x1;
      const gw = gx1 - gx0;
      if (gw > 0) {
        renderCell(svg, { x: gx0, y: TOP_Y, width: gw, height: BAND_H }, {
          fill: COLOR_GAP,
          fillOpacity: 0.55,
        });
        if (gw >= 14) {
          renderLabel(svg, `${gw}px`, gx0 + gw / 2, TOP_Y + BAND_H / 2 + 4, {
            size: 8,
            color: "#991b1b",
          });
        }
      }
    }
  });

  // padEnd zone
  const lastId = ITEMS[ITEMS.length - 1];
  const lastX1 = scale.getX1(lastId) ?? (totalW - padEnd);
  if (padEnd > 0) {
    renderCell(svg, { x: lastX1, y: TOP_Y, width: padEnd, height: BAND_H }, {
      fill: COLOR_PAD,
      fillOpacity: 0.6,
    });
    renderLabel(svg, `padEnd ${padEnd}px`, lastX1 + padEnd / 2, TOP_Y + BAND_H / 2 + 4, {
      size: 9,
      weight: 700,
      color: "#92400e",
    });
  }

  // getRange annotation
  const annotY = TOP_Y + BAND_H + 16;
  renderLine(svg, 0, annotY + 4, scale.getRange(), annotY + 4, {
    stroke: "#374151",
    strokeWidth: 1,
    dash: "3 2",
  });
  renderLabel(svg, `getRange() = ${scale.getRange()}px`, scale.getRange() / 2, annotY, {
    size: 10,
    weight: 700,
    color: "#374151",
  });

  // Legend
  const legendItems: { color: string; opacity: number; label: string }[] = [
    { color: COLOR_PAD, opacity: 0.6, label: "padStart/padEnd" },
    { color: COLOR_BAND, opacity: 1, label: `bandwidth (${BANDWIDTH}px)` },
    { color: COLOR_GAP, opacity: 0.55, label: "gap" },
  ];
  let lx = 4;
  for (const li of legendItems) {
    renderCell(svg, { x: lx, y: 8, width: 10, height: 10 }, {
      fill: li.color,
      fillOpacity: li.opacity,
      rx: 2,
    });
    renderLabel(svg, li.label, lx + 13, 18, {
      anchor: "start",
      size: 9,
      color: "#374151",
    });
    lx += li.label.length * 5.5 + 22;
  }
}

/** Render uniform content offsets: X/Y/Z all share the same global offsets. */
export function renderUniformContentInsets(
  mount: HTMLElement,
  state: ContentInsetsState
): void {
  const { offsetStart, offsetEnd } = state;

  const items: EnumLayoutEntry<string>[] = [
    { key: "X", bandwidth: 80 },
    { key: "Y", bandwidth: 80 },
    { key: "Z", bandwidth: 80 },
  ];
  const GAP = 8;
  const PAD = 16;

  const scale = makeEnumBandScale(items, {
    gap: GAP,
    padStart: PAD,
    contentOffsetStart: offsetStart,
    contentOffsetEnd: offsetEnd,
  });

  const legendItems2: { color: string; label: string }[] = [
    { color: COLOR_INSET_START, label: "contentOffsetStart (getContentX0)" },
    { color: COLOR_INSET_END, label: "contentOffsetEnd (getContentX1)" },
    { color: COLOR_BAND, label: "content area" },
  ];
  const legendMinW =
    legendItems2.reduce((acc, li) => acc + li.label.length * 4.5 + 16 + 8 + 4, 4);

  const svgW = Math.max(scale.getRange() + PAD, legendMinW);
  const svgH = 84;
  const TOP = 22;
  const BH = 36;

  const svg = makeSvg(mount, svgW, svgH, { className: "demo-svg-co" });

  items.forEach(({ key: id }) => {
    const x0 = scale.getX0(id) ?? 0;
    const x1 = scale.getX1(id) ?? x0;
    const bw = x1 - x0;
    const cx0 = scale.getContentX0(id) ?? x0;
    const cx1 = scale.getContentX1(id) ?? x1;
    const cbw = Math.max(cx1 - cx0, 0);

    // Band background
    renderCell(svg, { x: x0, y: TOP, width: bw, height: BH }, {
      fill: "#e5e7eb",
      rx: 3,
    });

    // Offset start zone
    if (offsetStart > 0) {
      renderCell(svg, { x: x0, y: TOP, width: Math.min(offsetStart, bw), height: BH }, {
        fill: COLOR_INSET_START,
        fillOpacity: 0.85,
        rx: 2,
      });
    }

    // Offset end zone
    if (offsetEnd > 0) {
      renderCell(svg, {
        x: x1 - Math.min(offsetEnd, bw),
        y: TOP,
        width: Math.min(offsetEnd, bw),
        height: BH,
      }, {
        fill: COLOR_INSET_END,
        fillOpacity: 0.85,
        rx: 2,
      });
    }

    // Content area
    if (cbw > 0) {
      renderCell(svg, { x: cx0, y: TOP, width: cbw, height: BH }, {
        fill: COLOR_BAND,
        fillOpacity: 0.7,
      });
      renderLabel(svg, id, cx0 + cbw / 2, TOP + BH / 2 + 4, {
        size: 10,
        weight: 700,
        color: DEMO_COLORS[0],
      });
    }

    // Dashed boundary lines for getContentX0 / getContentX1
    renderLine(svg, cx0, TOP - 4, cx0, TOP + BH + 4, { stroke: "#d97706", strokeWidth: 1.5, dash: "3 2" });
    renderLine(svg, cx1, TOP - 4, cx1, TOP + BH + 4, { stroke: "#db2777", strokeWidth: 1.5, dash: "3 2" });
  });

  // Header: live content bandwidth
  const cbw = scale.getContentBandwidth("X") ?? 0;
  renderLabel(
    svg,
    `offsetStart=${offsetStart}px  offsetEnd=${offsetEnd}px  getContentBandwidth("X")=${cbw}px`,
    svgW / 2,
    14,
    { size: 9, weight: 600, color: ANNOTATION_COLOR }
  );

  // Legend (uses legendItems2 computed above for svgW)
  let lx = 4;
  const legendY = TOP + BH + 14;
  for (const li of legendItems2) {
    renderCell(svg, { x: lx, y: legendY, width: 8, height: 8 }, { fill: li.color, rx: 1 });
    renderLabel(svg, li.label, lx + 11, legendY + 8, {
      anchor: "start",
      size: 8,
      color: "#374151",
    });
    lx += li.label.length * 4.5 + 16;
  }
}

/**
 * Render per-item offsets demo: X (first item) uses its own contentOffsetStart/End;
 * Y and Z follow the global pair.
 */
export function renderPerItemContentInsets(
  mount: HTMLElement,
  state: PerItemInsetsState
): void {
  const { xOffsetStart, xOffsetEnd, offsetStart, offsetEnd } = state;

  const items: EnumLayoutEntry<string>[] = [
    { key: "X", bandwidth: 80, contentOffsetStart: xOffsetStart, contentOffsetEnd: xOffsetEnd },
    { key: "Y", bandwidth: 80 },
    { key: "Z", bandwidth: 80 },
  ];
  const GAP = 8;
  const PAD = 16;

  const scale = makeEnumBandScale(items, {
    gap: GAP,
    padStart: PAD,
    contentOffsetStart: offsetStart,
    contentOffsetEnd: offsetEnd,
  });

  const svgW = scale.getRange() + PAD;
  const svgH = 84;
  const TOP = 22;
  const BH = 36;

  const svg = makeSvg(mount, svgW, svgH, { className: "demo-svg-co2" });

  items.forEach(({ key: id }) => {
    const x0 = scale.getX0(id) ?? 0;
    const x1 = scale.getX1(id) ?? x0;
    const bw = x1 - x0;
    const cx0 = scale.getContentX0(id) ?? x0;
    const cx1 = scale.getContentX1(id) ?? x1;
    const cbw = Math.max(cx1 - cx0, 0);

    // Resolve effective per-item offsets for zone coloring
    const effStart = id === "X" ? xOffsetStart : offsetStart;
    const effEnd = id === "X" ? xOffsetEnd : offsetEnd;

    // Band background
    renderCell(svg, { x: x0, y: TOP, width: bw, height: BH }, {
      fill: "#e5e7eb",
      rx: 3,
    });

    // Offset start zone
    if (effStart > 0) {
      renderCell(svg, { x: x0, y: TOP, width: Math.min(effStart, bw), height: BH }, {
        fill: COLOR_INSET_START,
        fillOpacity: 0.85,
        rx: 2,
      });
    }

    // Offset end zone
    if (effEnd > 0) {
      renderCell(svg, {
        x: x1 - Math.min(effEnd, bw),
        y: TOP,
        width: Math.min(effEnd, bw),
        height: BH,
      }, {
        fill: COLOR_INSET_END,
        fillOpacity: 0.85,
        rx: 2,
      });
    }

    // Content area
    if (cbw > 0) {
      renderCell(svg, { x: cx0, y: TOP, width: cbw, height: BH }, {
        fill: COLOR_BAND,
        fillOpacity: 0.7,
      });
      renderLabel(svg, id, cx0 + cbw / 2, TOP + BH / 2 + 4, {
        size: 10,
        weight: 700,
        color: DEMO_COLORS[0],
      });
    }

    // Dashed boundary lines
    renderLine(svg, cx0, TOP - 4, cx0, TOP + BH + 4, { stroke: "#d97706", strokeWidth: 1.5, dash: "3 2" });
    renderLine(svg, cx1, TOP - 4, cx1, TOP + BH + 4, { stroke: "#db2777", strokeWidth: 1.5, dash: "3 2" });
  });

  // Header
  renderLabel(
    svg,
    `X: start=${xOffsetStart} end=${xOffsetEnd}  Y/Z global: start=${offsetStart} end=${offsetEnd}`,
    svgW / 2,
    14,
    { size: 9, weight: 600, color: ANNOTATION_COLOR }
  );

  // Legend
  const legendItems: { color: string; label: string }[] = [
    { color: COLOR_INSET_START, label: "contentOffsetStart" },
    { color: COLOR_INSET_END, label: "contentOffsetEnd" },
    { color: COLOR_BAND, label: "content area" },
  ];
  let lx = 4;
  const legendY = TOP + BH + 14;
  for (const li of legendItems) {
    renderCell(svg, { x: lx, y: legendY, width: 8, height: 8 }, { fill: li.color, rx: 1 });
    renderLabel(svg, li.label, lx + 11, legendY + 8, {
      anchor: "start",
      size: 8,
      color: "#374151",
    });
    lx += li.label.length * 4.5 + 16;
  }
}
