import { ScaleOrdinal, scaleOrdinal } from "d3-scale";
import type { AnyCssNumber, Extent, Id, Optional } from "@visual-toolkit/d3-helpers";
import { stripSuffixFromCssNumber } from "@visual-toolkit/d3-helpers";
import {
  calculateFitScaleFactor,
  calculateX0,
  calculateX1,
} from "./band-math.js";

/** Output produced for each band by `FixedBandScale`. */
export type FixedScaleOutput = {
  x0: number;
  x1: number;
  cx: number;
};

/** Content-area output for a single band of a `FixedBandScale`. */
export type FixedContentOutput = {
  /** x0 + contentOffsetStart */
  contentX0: number;
  /** x1 − contentOffsetEnd */
  contentX1: number;
  /** bandwidth − contentOffsetStart − contentOffsetEnd (clamped to 0) */
  contentBandwidth: number;
};

/** Callable scale where all bands share the same pixel width and gap. */
export interface FixedBandScale<Input extends Id | Date> {
  (input: Input): Optional<FixedScaleOutput>;

  _x0Scale: ScaleOrdinal<Input, number, undefined>;
  _x1Scale: ScaleOrdinal<Input, number, undefined>;

  getDomain(): Input[];
  getBandwidth(): number;
  getStep(): number;
  getGap(): number;
  getScaleFactor(): number;
  getX0(input: Input): Optional<number>;
  getX1(input: Input): Optional<number>;
  getCX(input: Input): Optional<number>;
  /** Returns x0 + contentOffsetStart. Undefined for unknown input. */
  getContentX0(input: Input): Optional<number>;
  /** Returns x1 − contentOffsetEnd. Undefined for unknown input. */
  getContentX1(input: Input): Optional<number>;
  /**
   * Returns bandwidth − contentOffsetStart − contentOffsetEnd.
   * Clamped to 0 when the sum of offsets meets or exceeds the bandwidth.
   */
  getContentBandwidth(): number;
  getRange(): number;
  getExtent(): Extent;
  getExtentOfSpan(start: Input, end: Input): Optional<Extent>;
  getAllBands(): FixedScaleOutput[];
}

/** Options passed to `makeFixedBandScale`. */
export type FixedBandScaleOptions<T, Input> = {
  selectId: (d: T) => Input;
  /** Width of each band. Accepts `"24px"`, `"1.5rem"`, or a raw number. */
  bandwidth: AnyCssNumber;
  /** Gap between bands. Accepts `"24px"`, `"1.5rem"`, or a raw number. */
  gap?: Optional<AnyCssNumber>;
  /**
   * Leading margin: the x0 of the first band is offset by this amount and it
   * is included in `getRange()` / `getExtent()`.
   * Accepts `"24px"`, `"1.5rem"`, or a raw number.
   * Note: `rem`/`em` values are NOT converted to px; the numeric part is used as-is.
   */
  padStart?: Optional<AnyCssNumber>;
  /**
   * Trailing margin: extends maxX / `getRange()` by this amount after the last band.
   * Accepts `"24px"`, `"1.5rem"`, or a raw number.
   * Note: `rem`/`em` values are NOT converted to px; the numeric part is used as-is.
   */
  padEnd?: Optional<AnyCssNumber>;
  /**
   * Inner leading inset: content area starts at x0 + contentOffsetStart.
   * NOT included in `getRange()` / `getExtent()`.
   * Accepts `"24px"`, `"1.5rem"`, or a raw number.
   */
  contentOffsetStart?: Optional<AnyCssNumber>;
  /**
   * Inner trailing inset: content area ends at x1 − contentOffsetEnd.
   * NOT included in `getRange()` / `getExtent()`.
   * Accepts `"24px"`, `"1.5rem"`, or a raw number.
   */
  contentOffsetEnd?: Optional<AnyCssNumber>;
  /**
   * Target length to scale all values to fit.
   * - `'content'` (default): no scaling, returns natural layout.
   * - A number or CSS string (e.g. `600`, `"600px"`): all positions and sizes
   *   are multiplied by `scaleTo / naturalRange` so the content fills exactly
   *   `scaleTo` pixels. Margins scale proportionally.
   */
  scaleTo?: "content" | AnyCssNumber;
};

type ReduceAccumulator = {
  x0s: number[];
  x1s: number[];
  maxX: number;
};

function makeReduceDomainToPoints<T>(options: {
  bandwidth: number;
  gap: number;
  padStart: number;
}) {
  const { bandwidth, gap, padStart } = options;

  return function reduceDomainToPoints(
    output: ReduceAccumulator,
    _: T,
    index: number,
  ): ReduceAccumulator {
    const previousX1 = output.x1s[index - 1] ?? 0;
    const x0 = index === 0 ? padStart : calculateX0(previousX1, gap);
    const x1 = calculateX1(x0, bandwidth);

    output.x0s.push(x0);
    output.x1s.push(x1);
    output.maxX = Math.max(output.maxX, x1);

    return output;
  };
}

/**
 * Total pixel length for N equal-width bands with a uniform gap between them.
 * Optionally include leading (`padStart`) and trailing (`padEnd`) margins.
 */
export function calculateLengthFromFixedBandsWithGaps(
  numberOfBands: number,
  options: {
    bandwidth: AnyCssNumber;
    gap: AnyCssNumber;
    padStart?: Optional<AnyCssNumber>;
    padEnd?: Optional<AnyCssNumber>;
  },
): number {
  const bw = stripSuffixFromCssNumber(options.bandwidth);
  const gap = stripSuffixFromCssNumber(options.gap);
  const ps = options.padStart !== undefined ? stripSuffixFromCssNumber(options.padStart) : 0;
  const pe = options.padEnd !== undefined ? stripSuffixFromCssNumber(options.padEnd) : 0;
  return ps + bw * numberOfBands + gap * Math.max(numberOfBands - 1, 0) + pe;
}

/**
 * Build a fixed band scale where every band has the same pixel width.
 * Pass `scaleTo` to stretch/shrink the entire layout to a target length.
 */
export function makeFixedBandScale<T, Input extends Id>(
  data: T[],
  options: FixedBandScaleOptions<T, Input>,
): FixedBandScale<Input> {
  const bandwidth = stripSuffixFromCssNumber(options.bandwidth);
  const gap = stripSuffixFromCssNumber(options.gap ?? 0);
  const padStart = stripSuffixFromCssNumber(options.padStart ?? 0);
  const padEnd = stripSuffixFromCssNumber(options.padEnd ?? 0);
  const contentOffsetStart = stripSuffixFromCssNumber(options.contentOffsetStart ?? 0);
  const contentOffsetEnd = stripSuffixFromCssNumber(options.contentOffsetEnd ?? 0);

  const x0Scale = scaleOrdinal<Input, number>().unknown(
    undefined as unknown as number,
  );
  const x1Scale = scaleOrdinal<Input, number>().unknown(
    undefined as unknown as number,
  );

  // Deduplicate domain — keep first occurrence, warn on duplicates (M4)
  const rawDomain = data.map(options.selectId);
  const seenIds = new Set<Input>();
  const duplicates: Input[] = [];
  const domain: Input[] = [];
  for (const id of rawDomain) {
    if (seenIds.has(id)) {
      duplicates.push(id);
    } else {
      seenIds.add(id);
      domain.push(id);
    }
  }
  if (duplicates.length > 0) {
    console.warn("makeFixedBandScale: duplicate ids detected (first occurrence kept):", duplicates);
  }

  // Handle empty domain (H1)
  if (domain.length === 0) {
    x0Scale.domain([]).range([]);
    x1Scale.domain([]).range([]);

    const emptyExtent: Extent = { min: 0, max: 0 };
    const contentBandwidthEmpty = Math.max(0, bandwidth - contentOffsetStart - contentOffsetEnd);

    function getEmptyScale(_input: Input): Optional<FixedScaleOutput> {
      return undefined;
    }

    const scale = getEmptyScale as unknown as FixedBandScale<Input>;
    scale._x0Scale = x0Scale as unknown as ScaleOrdinal<Input, number, undefined>;
    scale._x1Scale = x1Scale as unknown as ScaleOrdinal<Input, number, undefined>;
    scale.getDomain = () => [];
    scale.getGap = () => gap;
    scale.getBandwidth = () => bandwidth;
    scale.getStep = () => bandwidth + gap;
    scale.getScaleFactor = () => 1;
    scale.getX0 = () => undefined;
    scale.getX1 = () => undefined;
    scale.getCX = () => undefined;
    scale.getContentX0 = () => undefined;
    scale.getContentX1 = () => undefined;
    scale.getContentBandwidth = () => contentBandwidthEmpty;
    scale.getRange = () => 0;
    scale.getExtent = () => emptyExtent;
    scale.getExtentOfSpan = () => undefined;
    scale.getAllBands = () => [];
    return scale;
  }

  const { x0s, x1s, maxX } = domain.reduce(
    makeReduceDomainToPoints<Input>({ bandwidth, gap, padStart }),
    {
      x0s: [] as number[],
      x1s: [] as number[],
      maxX: 0,
    },
  );

  const naturalMaxX = maxX + padEnd;
  const naturalRange = naturalMaxX; // minX is always 0

  // Resolve scale factor from scaleTo option
  const scaleToOpt = options.scaleTo;
  const k: number
    = scaleToOpt === undefined || scaleToOpt === "content"
      ? 1
      : calculateFitScaleFactor(naturalRange, stripSuffixFromCssNumber(scaleToOpt));

  // Apply factor to all stored values once at construction
  const scaledBandwidth = bandwidth * k;
  const scaledGap = gap * k;
  const scaledX0s = x0s.map((v) => v * k);
  const scaledX1s = x1s.map((v) => v * k);
  const scaledMaxX = naturalMaxX * k;
  const scaledContentOffsetStart = contentOffsetStart * k;
  const scaledContentOffsetEnd = contentOffsetEnd * k;
  const contentBandwidth = Math.max(0, scaledBandwidth - scaledContentOffsetStart - scaledContentOffsetEnd);
  const minX = 0;

  x0Scale.domain(domain).range(scaledX0s);
  x1Scale.domain(domain).range(scaledX1s);

  function getDomain(): Input[] {
    return domain;
  }

  function getGap(): number {
    return scaledGap;
  }

  function getBandwidth(): number {
    return scaledBandwidth;
  }

  function getStep(): number {
    return scaledBandwidth + scaledGap;
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
    if (x0 === undefined) return undefined;
    return x0 + scaledBandwidth / 2;
  }

  function getContentX0(input: Input): Optional<number> {
    const x0 = getX0(input);
    if (x0 === undefined) return undefined;
    return x0 + scaledContentOffsetStart;
  }

  function getContentX1(input: Input): Optional<number> {
    const x1 = getX1(input);
    if (x1 === undefined) return undefined;
    return x1 - scaledContentOffsetEnd;
  }

  function getContentBandwidth(): number {
    return contentBandwidth;
  }

  function getExtent(): Extent {
    return { min: minX, max: scaledMaxX };
  }

  function getExtentOfSpan(
    startAt: Input,
    endAt: Input,
  ): Optional<Extent> {
    const min = x0Scale(startAt) as Optional<number>;
    const max = x1Scale(endAt) as Optional<number>;

    if (min === undefined || max === undefined) return undefined;

    return { min, max };
  }

  function getRange(): number {
    return scaledMaxX - minX;
  }

  function getOutput(input: Input): Optional<FixedScaleOutput> {
    if (!input) return undefined;

    const x0 = getX0(input);
    const x1 = getX1(input);
    const cx = getCX(input);

    if (x0 === undefined || x1 === undefined || cx === undefined) {
      return undefined;
    }

    return { x0, x1, cx };
  }

  function getOutputWithDefault(input: Input): FixedScaleOutput {
    return getOutput(input) ?? { x0: 0, x1: 0, cx: 0 };
  }

  function getAllBands(): FixedScaleOutput[] {
    return domain.map(getOutputWithDefault);
  }

  function fixedBandScaleConstructor(
    input: Input,
  ): Optional<FixedScaleOutput> {
    return getOutput(input);
  }

  const scale = fixedBandScaleConstructor as FixedBandScale<Input>;

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
  scale.getExtentOfSpan = getExtentOfSpan;
  scale.getAllBands = getAllBands;

  return scale;
}
