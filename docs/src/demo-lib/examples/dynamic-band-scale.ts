import { scaleSequential } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import { makeDynamicBandScale, makeFixedBandScale } from "@visual-toolkit/d3-band-scales";
import { makeSvg } from "../section-helpers.js";
import { renderCell, renderLabel, renderLine } from "../demo-render.js";

type Day = { id: string; label: string; isWeekend: boolean };
type Category = { id: string; label: string };

const CATEGORIES: Category[] = [
  { id: "Alpha",   label: "Alpha"   },
  { id: "Beta",    label: "Beta"    },
  { id: "Gamma",   label: "Gamma"   },
  { id: "Delta",   label: "Delta"   },
  { id: "Epsilon", label: "Epsilon" },
];

const GAP = 6;
const ROW_BW = 32;
const ROW_GAP = 4;
const PAD_LEFT = 52;
const PAD_TOP = 28;
const WEEKEND_COLOR = "#f72585";

function makeDays(): Day[] {
  return Array.from({ length: 14 }, (_, i) => {
    const dow = (i + 1) % 7;
    const isWeekend = dow === 0 || dow === 6;
    return { id: `d${i}`, label: `D${i + 1}`, isWeekend };
  });
}

export function renderDynamicBandScale(mount: HTMLElement, weekendWidth: number): void {
  const days = makeDays();

  const colScale = makeDynamicBandScale(days, {
    selectId: (d) => d.id,
    selectBandwidth: (d) => (d.isWeekend ? weekendWidth : 52),
    gap: GAP,
  });

  const rowScale = makeFixedBandScale(CATEGORIES, {
    selectId: (c) => c.id,
    bandwidth: ROW_BW,
    gap: ROW_GAP,
  });

  const svgW = colScale.getRange() + PAD_LEFT + 16;
  const svgH = rowScale.getRange() + PAD_TOP + 20;
  const svg = makeSvg(mount, svgW, svgH);

  // Color scales: weekday columns blend from blue→cyan; rows blend from teal→pink
  const dayColorScale = scaleSequential<string>(["#4361ee", "#4cc9f0"]).domain([0, 13]);
  const rowColorScale = scaleSequential<string>(["#06d6a0", "#f72585"]).domain([0, CATEGORIES.length - 1]);

  days.forEach((day, di) => {
    const cx0 = (colScale.getX0(day.id) ?? 0) + PAD_LEFT;
    const cx1 = (colScale.getX1(day.id) ?? 0) + PAD_LEFT;
    const cw = cx1 - cx0;

    CATEGORIES.forEach((cat, ri) => {
      const ry0 = (rowScale.getX0(cat.id) ?? 0) + PAD_TOP;
      const blended = interpolateRgb(dayColorScale(di), rowColorScale(ri))(0.45);
      const alpha = day.isWeekend ? 0.55 : 1;

      renderCell(svg, { x: cx0, y: ry0, width: cw, height: ROW_BW }, {
        fill: blended,
        fillOpacity: alpha,
        rx: 2,
      });
    });

    // Day label above grid
    renderLabel(svg, day.label, cx0 + cw / 2, PAD_TOP - 6, {
      size: 9,
      weight: day.isWeekend ? 400 : 600,
      color: day.isWeekend ? "#adb5bd" : "#495057",
    });
  });

  // Row labels (category names)
  CATEGORIES.forEach((cat) => {
    const ry0 = (rowScale.getX0(cat.id) ?? 0) + PAD_TOP;
    renderLabel(svg, cat.label, PAD_LEFT - 6, ry0 + ROW_BW / 2 + 4, {
      anchor: "end",
      size: 10,
    });
  });

  // Annotation: highlight first weekend column width
  const firstWeekend = days.find((d) => d.isWeekend);
  if (firstWeekend) {
    const wx0 = (colScale.getX0(firstWeekend.id) ?? 0) + PAD_LEFT;
    const wx1 = (colScale.getX1(firstWeekend.id) ?? 0) + PAD_LEFT;
    const annotY = svgH - 6;

    renderLine(svg, wx0, annotY, wx1, annotY, {
      stroke: WEEKEND_COLOR,
      strokeWidth: 1.5,
    });
    renderLabel(svg, `↕ ${weekendWidth}px`, (wx0 + wx1) / 2, annotY - 2, {
      size: 8,
      color: WEEKEND_COLOR,
    });
  }
}
