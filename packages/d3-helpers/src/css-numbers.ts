/** A value that may be a CSS pixel string or a raw number. */
export type PixelOrNumber = number | `${string}px`;

/** A value that may be a CSS rem string or a raw number. */
export type RemOrNumber = number | `${string}rem`;

/** A value that may be a CSS em string or a raw number. */
export type EmOrNumber = number | `${string}em`;

/** Any CSS-unit numeric value. */
export type AnyCssNumber = PixelOrNumber | RemOrNumber | EmOrNumber;

import type { Optional } from "./scale-contracts.js";

/**
 * Parse a CSS pixel string or passthrough a raw number to a plain `number`.
 * `"24px"` → `24`, `"12.5px"` → `12.5`, `42` → `42`.
 */
export function stripPxFromPixels(value: PixelOrNumber): number {
  if (typeof value === "string") {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }
  return value;
}

/**
 * Like `stripPxFromPixels` but returns `undefined` when the value is absent.
 */
export function stripPxFromPixelsIfExists(
  value: Optional<PixelOrNumber>
): Optional<number> {
  if (value === undefined) return undefined;
  return stripPxFromPixels(value);
}

/**
 * Strip any CSS unit suffix (`px`, `rem`, `em`) and return the numeric part.
 * Raw numbers are returned unchanged. Note: `rem` and `em` values are **not**
 * converted to `px` — the numeric value is taken as-is after suffix removal.
 * Warns and returns `0` when the string cannot be parsed as a number.
 */
export function stripSuffixFromCssNumber<T extends AnyCssNumber>(
  value: T
): number {
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/(px|rem|em)$/, ""));
    if (isNaN(n)) {
      console.warn(`Value "${value}" could not be parsed as a number. Returning 0.`);
      return 0;
    }
    return n;
  }
  return value;
}
