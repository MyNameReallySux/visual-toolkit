/**
 * Presentational SVG helpers for the demo examples.
 *
 * These keep the example sources focused on the visual-toolkit API: drawing a
 * label or a dimension line is one call here instead of five lines of
 * `createElementNS` / `setAttribute` plumbing.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/** Muted grays shared by annotations across demos. */
export const ANNOTATION_COLOR = "#6c757d";
export const ANNOTATION_LINE_COLOR = "#adb5bd";

export type Rect = { x: number; y: number; width: number; height: number };

export type CellOptions = {
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
};

/** Draw a rectangle (band, cell, header background, …). */
export function renderCell(
  svg: SVGSVGElement,
  rect: Rect,
  options: CellOptions
): SVGRectElement {
  const el = document.createElementNS(SVG_NS, "rect");
  el.setAttribute("x", String(rect.x));
  el.setAttribute("y", String(rect.y));
  el.setAttribute("width", String(rect.width));
  el.setAttribute("height", String(rect.height));
  el.setAttribute("fill", options.fill);
  if (options.fillOpacity !== undefined) el.setAttribute("fill-opacity", String(options.fillOpacity));
  if (options.stroke) el.setAttribute("stroke", options.stroke);
  if (options.strokeWidth !== undefined) el.setAttribute("stroke-width", String(options.strokeWidth));
  if (options.rx !== undefined) el.setAttribute("rx", String(options.rx));
  svg.appendChild(el);
  return el;
}

export type LabelOptions = {
  anchor?: "start" | "middle" | "end";
  size?: number;
  weight?: number | string;
  color?: string;
};

/** Draw a text label centered on (or anchored at) the given point. */
export function renderLabel(
  svg: SVGSVGElement,
  text: string,
  x: number,
  y: number,
  options: LabelOptions = {}
): SVGTextElement {
  const el = document.createElementNS(SVG_NS, "text");
  el.setAttribute("x", String(x));
  el.setAttribute("y", String(y));
  el.setAttribute("text-anchor", options.anchor ?? "middle");
  el.setAttribute("font-size", String(options.size ?? 10));
  if (options.weight !== undefined) el.setAttribute("font-weight", String(options.weight));
  el.setAttribute("fill", options.color ?? "#495057");
  el.textContent = text;
  svg.appendChild(el);
  return el;
}

export type LineOptions = {
  stroke?: string;
  strokeWidth?: number;
  dash?: string;
};

/** Draw a straight line. */
export function renderLine(
  svg: SVGSVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: LineOptions = {}
): SVGLineElement {
  const el = document.createElementNS(SVG_NS, "line");
  el.setAttribute("x1", String(x1));
  el.setAttribute("y1", String(y1));
  el.setAttribute("x2", String(x2));
  el.setAttribute("y2", String(y2));
  el.setAttribute("stroke", options.stroke ?? ANNOTATION_LINE_COLOR);
  el.setAttribute("stroke-width", String(options.strokeWidth ?? 1));
  if (options.dash) el.setAttribute("stroke-dasharray", options.dash);
  svg.appendChild(el);
  return el;
}

/**
 * Draw a horizontal dimension line from `x1` to `x2` at `y`, with a small
 * annotation label centered above it — the "getRange() → 414px" pattern.
 */
export function renderDimensionLine(
  svg: SVGSVGElement,
  label: string,
  x1: number,
  x2: number,
  y: number
): void {
  renderLine(svg, x1, y, x2, y);
  renderLabel(svg, label, (x1 + x2) / 2, y - 2, {
    size: 9,
    color: ANNOTATION_COLOR,
  });
}
