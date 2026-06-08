import { ScaleOrdinal, scaleOrdinal } from "d3-scale";
import type { AnyCssNumber, Extent, Id, Optional } from "@visual-toolkit/d3-helpers";
import { stripSuffixFromCssNumber } from "@visual-toolkit/d3-helpers";
import {
  calculateFitScaleFactor,
  calculateX0,
  calculateX1,
} from "./band-math.js";

/** Output produced for each band by `DynamicBandScale`. */
export type DynamicScaleOutput = {
  bandwidth: number;
  x0: number;
  x1: number;
  cx: number;
};

/** Callable scale with per-item variable bandwidth. */
export interface DynamicBandScale<Input extends Id> {
  (input: Input): Optional<DynamicScaleOutput>;

  _bandwidthScale: ScaleOrdinal<Input, number, undefined>;
  _x0Scale: ScaleOrdinal<Input, number, undefined>;
  _x1Scale: ScaleOrdinal<Input, number, undefined>;

  getDomain(): Input[];
  getBandwidth(input: Input): Optional<number>;
  getStep(input: Input): Optional<number>;
  getGap(): number;
  getScaleFactor(): number;
  getX0(input: Input): Optional<number>;
  getX1(input: Input): Optional<number>;
  getCX(input: Input): Optional<number>;
  /**
   * Returns x0 + contentOffsetStart (per-item or global).
   * Undefined for unknown input.
   */
  getContentX0(input: Input): Optional<number>;
  /**
   * Returns x1 − contentOffsetEnd (per-item or global).
   * Undefined for unknown input.
   */
  getContentX1(input: Input): Optional<number>;
  /**
   * Returns bandwidth − contentOffsetStart − contentOffsetEnd (per-item or global).
   * Clamped to 0 when the sum of offsets meets or exceeds the bandwidth.
   * Undefined for unknown input.
   */
  getContentBandwidth(input: Input): Optional<number>;
  getRange(): number;
  getExtent(): Extent;
  getAllBands(): DynamicScaleOutput[];
}

/** Options passed to `makeDynamicBandScale`. */
export type DynamicBandScaleOptions<T, Input> = {
  selectId: (d: T) => Input;
  selectBandwidth: (d: T) => AnyCssNumber;
  /** Per-item gap selector. Takes priority over the global `gap` option. */
  selectGap?: Optional<(d: T) => Optional<AnyCssNumber>>;
  /** Global fallback gap between bands. */
  gap?: Optional<AnyCssNumber>;
  /**
   * Leading margin: the x0 of the first band is offset by this amount and it
   * is included in `getRange()` / `getExtent()`.
   * Note: `rem`/`em` values are NOT converted to px; the numeric part is used as-is.
   */
  padStart?: Optional<AnyCssNumber>;
  /**
   * Trailing margin: extends maxX / `getRange()` by this amount after the last band.
   * Note: `rem`/`em` values are NOT converted to px; the numeric part is used as-is.
   */
  padEnd?: Optional<AnyCssNumber>;
  /**
   * Global leading inset: content area starts at x0 + contentOffsetStart.
   * Overridden per item by `selectContentOffsetStart`.
   * NOT included in `getRange()` / `getExtent()`.
   */
  contentOffsetStart?: Optional<AnyCssNumber>;
  /**
   * Global trailing inset: content area ends at x1 − contentOffsetEnd.
   * Overridden per item by `selectContentOffsetEnd`.
   * NOT included in `getRange()` / `getExtent()`.
   */
  contentOffsetEnd?: Optional<AnyCssNumber>;
  /** Per-item override for `contentOffsetStart`. Returns undefined to fall back to global. */
  selectContentOffsetStart?: Optional<(d: T) => Optional<AnyCssNumber>>;
  /** Per-item override for `contentOffsetEnd`. Returns undefined to fall back to global. */
  selectContentOffsetEnd?: Optional<(d: T) => Optional<AnyCssNumber>>;
  /**
   * Target length to scale all values to fit.
   * - `'content'` (default): no scaling, returns natural layout.
   * - A number or CSS string (e.g. `600`, `"600px"`): all positions and sizes
   *   are multiplied by `scaleTo / naturalRange` so the content fills exactly
   *   `scaleTo` pixels. Margins scale proportionally.
   */
  scaleTo?: 'content' | AnyCssNumber;
};

/**
 * Build a dynamic band scale whose bands can each have a different pixel width.
 * Per-item gaps (from `selectGap`) override the global `gap` option.
 * Pass `scaleTo` to stretch/shrink the entire layout to a target length.
 */
export function makeDynamicBandScale<T, Input extends Id>(
  data: T[],
  options: DynamicBandScaleOptions<T, Input>
): DynamicBandScale<Input> {
  const gapFromOptions = stripSuffixFromCssNumber(options.gap ?? 0);
  const padStart = stripSuffixFromCssNumber(options.padStart ?? 0);
  const padEnd = stripSuffixFromCssNumber(options.padEnd ?? 0);
  const globalContentOffsetStart = stripSuffixFromCssNumber(options.contentOffsetStart ?? 0);
  const globalContentOffsetEnd = stripSuffixFromCssNumber(options.contentOffsetEnd ?? 0);

  const bandwidthScale = scaleOrdinal<Input, number>().unknown(
    undefined as unknown as number
  );
  const x0Scale = scaleOrdinal<Input, number>().unknown(
    undefined as unknown as number
  );
  const x1Scale = scaleOrdinal<Input, number>().unknown(
    undefined as unknown as number
  );
  const contentOffsetStartScale = scaleOrdinal<Input, number>().unknown(
    undefined as unknown as number
  );
  const contentOffsetEndScale = scaleOrdinal<Input, number>().unknown(
    undefined as unknown as number
  );

  // Deduplicate domain — keep first occurrence, warn on duplicates (M4)
  const seen = new Set<Input>();
  const duplicates: Input[] = [];
  const dedupedData: T[] = [];
  for (const item of data) {
    const id = options.selectId(item);
    if (seen.has(id)) {
      duplicates.push(id);
    } else {
      seen.add(id);
      dedupedData.push(item);
    }
  }
  if (duplicates.length > 0) {
    console.warn("makeDynamicBandScale: duplicate ids detected (first occurrence kept):", duplicates);
  }

  const domain: Input[] = [];
  const bandwidths: { width: number; gap?: Optional<number> }[] = [];
  const resolvedContentOffsetStarts: number[] = [];
  const resolvedContentOffsetEnds: number[] = [];

  for (const d of dedupedData) {
    const id = options.selectId(d);
    const width = stripSuffixFromCssNumber(options.selectBandwidth(d));
    const perItemGap = options.selectGap?.(d);
    const gap =
      perItemGap !== undefined
        ? stripSuffixFromCssNumber(perItemGap)
        : gapFromOptions;
    const perItemCos = options.selectContentOffsetStart?.(d);
    const resolvedCos =
      perItemCos !== undefined
        ? stripSuffixFromCssNumber(perItemCos)
        : globalContentOffsetStart;
    const perItemCoe = options.selectContentOffsetEnd?.(d);
    const resolvedCoe =
      perItemCoe !== undefined
        ? stripSuffixFromCssNumber(perItemCoe)
        : globalContentOffsetEnd;
    domain.push(id);
    bandwidths.push({ width, gap });
    resolvedContentOffsetStarts.push(resolvedCos);
    resolvedContentOffsetEnds.push(resolvedCoe);
  }

  // Handle empty domain (H1)
  if (domain.length === 0) {
    bandwidthScale.domain([]).range([]);
    x0Scale.domain([]).range([]);
    x1Scale.domain([]).range([]);

    const emptyExtent: Extent = { min: 0, max: 0 };

    function getEmptyScale(_input: Input): Optional<DynamicScaleOutput> {
      return undefined;
    }

    const scale = getEmptyScale as unknown as DynamicBandScale<Input>;
    scale._bandwidthScale = bandwidthScale as unknown as ScaleOrdinal<Input, number, undefined>;
    scale._x0Scale = x0Scale as unknown as ScaleOrdinal<Input, number, undefined>;
    scale._x1Scale = x1Scale as unknown as ScaleOrdinal<Input, number, undefined>;
    scale.getDomain = () => [];
    scale.getGap = () => gapFromOptions;
    scale.getBandwidth = () => undefined;
    scale.getStep = () => undefined;
    scale.getScaleFactor = () => 1;
    scale.getX0 = () => undefined;
    scale.getX1 = () => undefined;
    scale.getCX = () => undefined;
    scale.getContentX0 = () => undefined;
    scale.getContentX1 = () => undefined;
    scale.getContentBandwidth = () => undefined;
    scale.getRange = () => 0;
    scale.getExtent = () => emptyExtent;
    scale.getAllBands = () => [];
    return scale;
  }

  // Build x0s/x1s, applying padStart to the first band's x0
  const initX1s: number[] = [];
  const initX0s: number[] = [];
  let runningMaxX = 0;

  for (let i = 0; i < bandwidths.length; i++) {
    const { width, gap } = bandwidths[i];
    const previousX1 = initX1s[i - 1] ?? 0;
    const x0 = i === 0 ? padStart : calculateX0(previousX1, gap);
    const x1 = calculateX1(x0, width);
    initX0s.push(x0);
    initX1s.push(x1);
    runningMaxX = Math.max(runningMaxX, x1);
  }

  const naturalMaxX = runningMaxX + padEnd;
  const naturalRange = naturalMaxX; // minX is always 0

  // Resolve scale factor from scaleTo option
  const scaleToOpt = options.scaleTo;
  const k: number =
    scaleToOpt === undefined || scaleToOpt === 'content'
      ? 1
      : calculateFitScaleFactor(naturalRange, stripSuffixFromCssNumber(scaleToOpt));

  // Apply factor to all stored values once at construction
  const scaledX0s = initX0s.map((v) => v * k);
  const scaledX1s = initX1s.map((v) => v * k);
  const scaledBandwidths = bandwidths.map((b) => b.width * k);
  const scaledGapFromOptions = gapFromOptions * k;
  const scaledBandwidthsWithGaps = bandwidths.map((b) => ({
    width: b.width * k,
    gap: b.gap !== undefined ? b.gap * k : undefined,
  }));
  const scaledContentOffsetStarts = resolvedContentOffsetStarts.map((v) => v * k);
  const scaledContentOffsetEnds = resolvedContentOffsetEnds.map((v) => v * k);
  const scaledMaxX = naturalMaxX * k;
  const minX = 0;

  bandwidthScale.domain(domain).range(scaledBandwidths);
  x0Scale.domain(domain).range(scaledX0s);
  x1Scale.domain(domain).range(scaledX1s);
  contentOffsetStartScale.domain(domain).range(scaledContentOffsetStarts);
  contentOffsetEndScale.domain(domain).range(scaledContentOffsetEnds);

  function getDomain(): Input[] {
    return domain;
  }

  function getGap(input?: Optional<Input>): number {
    if (input === undefined) return scaledGapFromOptions;
    const gapForItem = scaledBandwidthsWithGaps[domain.indexOf(input)]?.gap;
    return gapForItem ?? scaledGapFromOptions;
  }

  function getBandwidth(input: Input): Optional<number> {
    return bandwidthScale(input) as Optional<number>;
  }

  function getStep(input: Input): Optional<number> {
    const bw = getBandwidth(input);
    if (bw === undefined) return undefined;
    return bw + getGap(input);
  }

  function getScaleFactor(): number {
    return k;
  }

  function getX0(input: Input): Optional<number> {
    return x0Scale(input) as Optional<number>;
  }

  function getX1(input: Input): Optional<number> {
    return x1Scale(input) as Optional<number>;
  }

  function getCX(input: Input): Optional<number> {
    const x0 = getX0(input);
    const bw = getBandwidth(input);
    if (x0 === undefined || bw === undefined) return undefined;
    return x0 + bw / 2;
  }

  function getExtent(): Extent {
    return { min: minX, max: scaledMaxX };
  }

  function getRange(): number {
    return scaledMaxX - minX;
  }

  function getContentX0(input: Input): Optional<number> {
    const x0 = getX0(input);
    if (x0 === undefined) return undefined;
    const cos = contentOffsetStartScale(input) as Optional<number>;
    if (cos === undefined) return undefined;
    return x0 + cos;
  }

  function getContentX1(input: Input): Optional<number> {
    const x1 = getX1(input);
    if (x1 === undefined) return undefined;
    const coe = contentOffsetEndScale(input) as Optional<number>;
    if (coe === undefined) return undefined;
    return x1 - coe;
  }

  function getContentBandwidth(input: Input): Optional<number> {
    const bw = getBandwidth(input);
    if (bw === undefined) return undefined;
    const cos = contentOffsetStartScale(input) as Optional<number>;
    const coe = contentOffsetEndScale(input) as Optional<number>;
    if (cos === undefined || coe === undefined) return undefined;
    return Math.max(0, bw - cos - coe);
  }

  function getOutput(input: Input): Optional<DynamicScaleOutput> {
    if (!input) return undefined;

    const bandwidth = getBandwidth(input);
    const x0 = getX0(input);
    const x1 = getX1(input);
    const cx = getCX(input);

    if (
      bandwidth === undefined ||
      x0 === undefined ||
      x1 === undefined ||
      cx === undefined
    ) {
      return undefined;
    }

    return { bandwidth, x0, x1, cx };
  }

  function getOutputWithDefault(input: Input): DynamicScaleOutput {
    return getOutput(input) ?? { bandwidth: 0, x0: 0, x1: 0, cx: 0 };
  }

  function getAllBands(): DynamicScaleOutput[] {
    return domain.map(getOutputWithDefault);
  }

  function dynamicBandScaleConstructor(
    input: Input
  ): Optional<DynamicScaleOutput> {
    return getOutput(input);
  }

  const scale = dynamicBandScaleConstructor as DynamicBandScale<Input>;

  scale._bandwidthScale = bandwidthScale as unknown as ScaleOrdinal<Input, number, undefined>;
  scale._x0Scale = x0Scale as unknown as ScaleOrdinal<Input, number, undefined>;
  scale._x1Scale = x1Scale as unknown as ScaleOrdinal<Input, number, undefined>;

  scale.getDomain = getDomain;
  scale.getGap = getGap;
  scale.getBandwidth = getBandwidth;
  scale.getStep = getStep;
  scale.getScaleFactor = getScaleFactor;
  scale.getX0 = getX0;
  scale.getX1 = getX1;
  scale.getCX = getCX;
  scale.getContentX0 = getContentX0;
  scale.getContentX1 = getContentX1;
  scale.getContentBandwidth = getContentBandwidth;
  scale.getRange = getRange;
  scale.getExtent = getExtent;
  scale.getAllBands = getAllBands;

  return scale;
}

/**
 * Total pixel length for a sequence of variable-width bands with uniform gap.
 * Optionally include leading (`padStart`) and trailing (`padEnd`) margins.
 * Equal to `padStart + sum(bandwidths) + gap × (count − 1) + padEnd`.
 */
export function calculateLengthFromDynamicBands(
  bandwidths: number[],
  gap: number,
  options?: { padStart?: number; padEnd?: number }
): number {
  const total = bandwidths.reduce((acc, bw) => acc + bw, 0);
  const ps = options?.padStart ?? 0;
  const pe = options?.padEnd ?? 0;
  return ps + total + gap * Math.max(bandwidths.length - 1, 0) + pe;
}
