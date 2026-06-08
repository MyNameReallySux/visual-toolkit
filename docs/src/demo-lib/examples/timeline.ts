import { makeDiscontinuousLinearScale } from "@visual-toolkit/d3-discontinuous-scale";
import { makeSvg } from "../section-helpers.js";
import { renderCell, renderLabel, renderLine } from "../demo-render.js";

export type DiscontinuousMode = "working-hours" | "weekdays" | "combined";

export type DiscontinuousConfig = {
  mode: DiscontinuousMode;
  label: string;
  description: string;
};

export const DISCONTINUOUS_CONFIGS: DiscontinuousConfig[] = [
  {
    mode: "working-hours",
    label: "Working hours (overnight skip)",
    description:
      "Three working days, 8:00–17:00 each. Overnight gaps (17:00–08:00 next day) are compressed into break markers.",
  },
  {
    mode: "weekdays",
    label: "Weekdays (weekend skip)",
    description:
      "Three calendar weeks, Mon–Fri only. Weekend gaps (Sat–Sun) are compressed into wider break markers.",
  },
  {
    mode: "combined",
    label: "Combined: weekdays × working hours",
    description:
      "Thu–Fri (week 1) + Mon–Wed (week 2), 08:00–17:00 each day. Weekend break renders wider than overnight breaks — break-width hierarchy matches skipped span.",
  },
];

const SVG_W = 720;
const PAD_LEFT = 20;
const PAD_RIGHT = 20;
const CONTENT_W = SVG_W - PAD_LEFT - PAD_RIGHT;
const AXIS_Y = 48;
const SVG_H = 92;

const WEEKDAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKDAY_ABBR_SHORT = ["M", "T", "W", "Th", "F"];

// Group-label color matching the old demo
const GROUP_LABEL_COLOR = "#4361ee";

/** 10 hours per day (startH–endH) for 3 sequential days. */
function buildWorkingHoursValues(
  startH: number,
  endH: number
): number[] {
  const hours: number[] = [];
  for (let d = 0; d < 3; d++) {
    for (let h = startH; h <= endH; h++) {
      hours.push(d * 24 + h);
    }
  }
  return hours;
}

/** Absolute day indices for `weekCount` calendar weeks (Mon–Fri only). */
function buildWeekdays(weekCount: number): number[] {
  const days: number[] = [];
  for (let w = 0; w < weekCount; w++) {
    for (let d = 0; d < 5; d++) {
      days.push(w * 7 + d + 1);
    }
  }
  return days;
}

/**
 * Combined: Thu–Fri (week 1) + Mon–Wed (week 2), 08:00–17:00 each day.
 * Days encode as day*24+hour; one weekend break separates the two clusters.
 */
function buildCombined(): number[] {
  const dayIndices = [4, 5, 8, 9, 10];
  const values: number[] = [];
  for (const day of dayIndices) {
    for (let h = 8; h <= 17; h++) {
      values.push(day * 24 + h);
    }
  }
  return values;
}

/**
 * Draw a zigzag break marker centered at xCenter with visual width gapW.
 * Local helper — there is no equivalent in the shared demo-render helpers.
 */
function appendZigzag(svg: SVGSVGElement, xCenter: number, gapW: number): void {
  const hw = Math.max(gapW * 0.38, 5);
  const amp = Math.max(Math.round(gapW * 0.12), 4);
  const steps = gapW > 30 ? 6 : 4;
  const stepW = (hw * 2) / steps;

  // White mask rect to erase the axis line underneath
  renderCell(
    svg,
    {
      x: xCenter - hw,
      y: AXIS_Y - amp - 1,
      width: hw * 2,
      height: amp * 2 + 2,
    },
    { fill: "#ffffff" }
  );

  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const px = xCenter - hw + i * stepW;
    const py = AXIS_Y + (i % 2 === 0 ? -amp : amp);
    points.push(`${px.toFixed(1)},${py}`);
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  const poly = document.createElementNS(SVG_NS, "polyline");
  poly.setAttribute("points", points.join(" "));
  poly.setAttribute("fill", "none");
  poly.setAttribute("stroke", "#495057");
  poly.setAttribute("stroke-width", "1.5");
  poly.setAttribute("stroke-linecap", "round");
  poly.setAttribute("stroke-linejoin", "round");
  svg.appendChild(poly);
}

export type DiscontinuousKnobs = {
  minToSkip?: number;
  startHour?: number;
  endHour?: number;
};

/** Render a single discontinuous scale example. Re-render-safe. */
export function renderDiscontinuousScale(
  mount: HTMLElement,
  mode: DiscontinuousMode,
  knobs?: DiscontinuousKnobs
): void {
  let values: number[];
  let minToSkip: number;
  let tickFormatter: (v: number) => string;
  let groupLabeler: (binIndex: number, xFirst: number, xLast: number) => string;
  let getSkipGap: ((span: number) => number) | undefined;

  if (mode === "working-hours") {
    const startH = knobs?.startHour ?? 8;
    const endH = knobs?.endHour ?? 17;
    values = buildWorkingHoursValues(startH, endH);
    minToSkip = knobs?.minToSkip ?? 12;
    tickFormatter = (v) => `${v % 24}:00`;
    groupLabeler = (i) => `Day ${i + 1}`;
    getSkipGap = undefined;
  } else if (mode === "weekdays") {
    values = buildWeekdays(3);
    minToSkip = knobs?.minToSkip ?? 1;
    tickFormatter = (v) => {
      const dayOfWeek = ((v - 1) % 7) % 5;
      return WEEKDAY_ABBR[dayOfWeek] ?? String(v);
    };
    groupLabeler = (i) => `Week ${i + 1}`;
    getSkipGap = undefined;
  } else {
    values = buildCombined();
    minToSkip = 12;
    tickFormatter = (v) => {
      const h = v % 24;
      return h === 8 || h === 12 || h === 17 ? `${h}:00` : "";
    };
    // Placeholder — replaced after subScales are available
    groupLabeler = (_i, _xFirst, _xLast) => "";
    // weekend span ≈ 63h > 24, overnight ≈ 14h < 24
    getSkipGap = (span: number) => (span > 24 ? 4 : 2);
  }

  const scale = makeDiscontinuousLinearScale(values, {
    range: { start: PAD_LEFT, span: CONTENT_W },
    selectValue: (v) => v,
    convertValueToKey: (v) => String(v),
    calculateDistance: (a, b) => a - b,
    getRelativeValueFromDistance: (v, dist) => v - dist,
    minToSkip,
    ...(getSkipGap ? { getSkipGap } : {}),
  });

  const subScales = scale._getAllSubScales();

  const continuousBinBounds: Array<{
    xFirst: number;
    xLast: number;
    domFirst: number;
  }> = [];
  subScales.forEach((ss, i) => {
    if (i % 2 === 1) return;
    const dom = ss.domain() as number[];
    if (dom.length < 1) return;
    continuousBinBounds.push({
      xFirst: ss(dom[0]) ?? PAD_LEFT,
      xLast: ss(dom[dom.length - 1]) ?? PAD_LEFT,
      domFirst: dom[0],
    });
  });

  if (mode === "combined") {
    groupLabeler = (i) => {
      const domFirst = continuousBinBounds[i]?.domFirst ?? 0;
      const dayIdx = Math.floor(domFirst / 24);
      const dayOfWeek = (dayIdx - 1) % 7;
      return WEEKDAY_ABBR_SHORT[dayOfWeek] ?? String(dayIdx);
    };
  }

  const svg = makeSvg(mount, SVG_W, SVG_H);

  // Shaded background lanes for each continuous bin
  continuousBinBounds.forEach(({ xFirst, xLast }) => {
    renderCell(
      svg,
      {
        x: xFirst,
        y: 0,
        width: Math.abs(xLast - xFirst),
        height: AXIS_Y + 14,
      },
      { fill: "#e8ecfd", fillOpacity: 0.45 }
    );
  });

  // Axis line
  const xEnd =
    continuousBinBounds.length > 0
      ? continuousBinBounds[continuousBinBounds.length - 1].xLast
      : PAD_LEFT + CONTENT_W;

  renderLine(svg, PAD_LEFT, AXIS_Y, xEnd, AXIS_Y, {
    stroke: "#495057",
    strokeWidth: 1.5,
  });

  // Zigzag break markers at each skip bin
  let skipBinIndex = 0;
  subScales.forEach((_, i) => {
    if (i % 2 !== 1) return;
    const prevBin = continuousBinBounds[skipBinIndex];
    const nextBin = continuousBinBounds[skipBinIndex + 1];
    const gapW =
      scale.getSkipWidth(skipBinIndex) ??
      (nextBin ? nextBin.xFirst - prevBin.xLast : 0);
    skipBinIndex++;
    if (!prevBin || !nextBin) return;
    const xCenter = (prevBin.xLast + nextBin.xFirst) / 2;
    appendZigzag(svg, xCenter, gapW);
  });

  // Group / day labels above the axis
  continuousBinBounds.forEach(({ xFirst, xLast }, i) => {
    renderLabel(
      svg,
      groupLabeler(i, xFirst, xLast),
      (xFirst + xLast) / 2,
      14,
      { size: 10, weight: 700, color: GROUP_LABEL_COLOR }
    );
  });

  // Tick marks and labels
  const binTickCounts = subScales.map((_, i) => (i % 2 === 0 ? 4 : 1));
  const ticksPerBin = scale.getTicks(binTickCounts);
  ticksPerBin.forEach((binTicks, binIdx) => {
    if (binIdx % 2 === 1) return;
    binTicks.forEach((tick) => {
      const x = scale.getX(tick);
      if (x === undefined) return;

      const label = tickFormatter(tick);
      if (mode === "combined" && label === "") return;

      // Tick stroke
      renderLine(svg, x, AXIS_Y - 5, x, AXIS_Y + 5, {
        stroke: "#4361ee",
        strokeWidth: 1,
      });

      // Tick label
      renderLabel(svg, label, x, AXIS_Y + 20, {
        size: 9,
        color: "#495057",
      });
    });
  });
}
