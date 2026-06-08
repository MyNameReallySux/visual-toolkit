/**
 * Low-level band-geometry primitives shared by all scale factories.
 * These are pure functions with no d3 dependency.
 */

/**
 * x0 of a band — the leading edge after adding an optional gap from the
 * previous band's x1. Defaults to `0` when called with no arguments.
 *
 * @internal
 */
export function calculateX0(previousValue = 0, gap = 0): number {
  return previousValue + gap;
}

/**
 * x1 of a band given its x0 and pixel bandwidth.
 *
 * @internal
 */
export function calculateX1(x0: number, bandwidth: number): number {
  return x0 + bandwidth;
}

/**
 * Uniform scale factor that stretches or shrinks a content region to fill a
 * given container length. Multiply bandwidths, gaps, and x-positions by this
 * factor to make the visual fill the container exactly.
 *
 * Returns `1` when `contentLength` is `0` to avoid divide-by-zero.
 *
 * @example
 * const k = calculateFitScaleFactor(scale.getRange(), containerWidth);
 * // → k * every bandwidth = bands that fill the container
 */
export function calculateFitScaleFactor(
  contentLength: number,
  containerLength: number
): number {
  return contentLength === 0 ? 1 : containerLength / contentLength;
}
