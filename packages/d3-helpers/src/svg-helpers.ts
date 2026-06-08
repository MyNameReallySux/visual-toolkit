import type { Optional } from "./scale-contracts.js";

type Point = { x: number; y: number };
type Dimension = { width: number; height: number };

function transformIfPresent(
  value: Optional<number>,
  fn: Optional<(value: number) => number>
): Optional<number> {
  if (value === undefined) return undefined;
  if (typeof fn === "function") return fn(value);
  return value;
}

/**
 * Build a CSS `translate(x, y)` transform string from a partial `Point`.
 * Missing coordinates default to `0`.
 */
export function makeTranslateTransformFromPoint(
  rect: Partial<Point> = {}
): string {
  return `translate(${rect.x ?? 0}, ${rect.y ?? 0})`;
}

/**
 * Spread `width` and `height` from a partial `Dimension` onto SVG element
 * props, optionally applying per-property transform functions.
 */
export function applyDimensionAsProps(
  rect: Partial<Dimension> = {},
  transformProps: Partial<Record<keyof Dimension, (value: number) => number>> = {}
): { width: Optional<number>; height: Optional<number> } {
  return {
    width: transformIfPresent(rect.width, transformProps.width),
    height: transformIfPresent(rect.height, transformProps.height),
  };
}

/**
 * Spread x, y, width, and height from a partial rect onto SVG element props,
 * encoding x/y as a `transform: translate(…)` string and optionally applying
 * per-property transform functions.
 */
export function applyRectangleAsProps(
  rect: Partial<Point & Dimension> = {},
  transformProps: Partial<
    Record<keyof (Point & Dimension), (value: number) => number>
  > = {}
): { transform: string; width: Optional<number>; height: Optional<number> } {
  return {
    transform: makeTranslateTransformFromPoint({
      x: transformIfPresent(rect.x, transformProps.x),
      y: transformIfPresent(rect.y, transformProps.y),
    }),
    width: transformIfPresent(rect.width, transformProps.width),
    height: transformIfPresent(rect.height, transformProps.height),
  };
}

/**
 * Spread x and y from a partial `Point` onto SVG element props, optionally
 * applying per-property transform functions.
 */
export function applyPointAsProps(
  rect: Partial<Point> = {},
  transformProps: Partial<Record<keyof Point, (value: number) => number>> = {}
): { x: Optional<number>; y: Optional<number> } {
  return {
    x: transformIfPresent(rect.x, transformProps.x),
    y: transformIfPresent(rect.y, transformProps.y),
  };
}

/** Options for `estimateSvgTextSize`. */
export type EstimateSvgTextSizeOptions = {
  text: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string | number;
};

/**
 * Character-count heuristic for estimating the rendered pixel size of an SVG
 * text node. Adjusts for monospace and bold font weights.
 */
export function estimateSvgTextSize(options: EstimateSvgTextSizeOptions): {
  width: number;
  height: number;
} {
  const {
    text,
    fontSize,
    fontFamily = "sans-serif",
    fontWeight = "normal",
  } = options;

  let avgCharWidthFactor = 0.55;

  if (fontFamily === "monospace") {
    avgCharWidthFactor = 0.6;
  }

  if (typeof fontWeight === "string" && fontWeight === "bold") {
    avgCharWidthFactor += 0.02;
  }
  if (typeof fontWeight === "number" && fontWeight >= 600) {
    avgCharWidthFactor += 0.02;
  }

  return {
    width: text.length * fontSize * avgCharWidthFactor,
    height: fontSize,
  };
}
