import type { ScaleLinear, ScaleOrdinal } from "d3-scale";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import type { Optional } from "@visual-toolkit/d3-helpers";

/** A value that can be treated as a number (number, Date, or valueOf object). */
export type NumberLike = number | Date | { valueOf(): number };

/** A skip-entry wrapper: marks a gap/break in a discontinuous domain. */
export type SkipEntry<T> = {
  isSkip: true;
  value: T;
  /** The distance (in domain units) of the skipped span. */
  skippedSpan: number;
};

/** Either a domain value or a skip-entry wrapping one. */
export type SkipEntryOrValue<T> = SkipEntry<T> | T;

/** A bin-segment: either a continuous run of values or a single-element skip. */
export type SkipEntryOrValueArray<T> = [SkipEntry<T>] | T[];

/** A single rendered tick on a discontinuous axis. */
export type AxisTick<T> = {
  value: {
    input: SkipEntryOrValue<T>;
    formatted?: string | undefined;
  };
  scope: number;
  index: {
    inAxis: number;
    inSubAxis: number;
  };
  from: { u: number; v: number };
  to: { u: number; v: number };
};

/** A temporal extent (earliest / latest). */
export type TemporalExtent<T> = {
  earliest: T;
  latest: T;
};

/** A value or an array of values. */
export type SingleOrArray<T> = T | T[];

type ContinuousBin<T> = {
  _id: `bin_${number}`;
  isSkip: false;
  items: T[];
  scope: [number, number];
  range: [number, number];
  ticks: AxisTick<T>[];
  checkValueIsInBin(value: T): boolean;
};

type SkipBin<T> = {
  _id: `bin_${number}`;
  isSkip: true;
  /** Width of this skip in scope-units (relative weight in the total span). */
  skipWeightUnits: number;
  items: T[];
  scope: [number, number];
  range: [number, number];
  ticks: AxisTick<T>[];
};

type AnyBin<T> = ContinuousBin<T> | SkipBin<T>;

type HigherOrderScaleEntry<T extends NumberLike> = {
  bin: AnyBin<T>;
  item: T;
  scale: ScaleLinear<number, number>;
};

type DiscontinuousLinearScaleOutput = { x: Optional<number> };

/** Callable piecewise-linear scale that compresses/skips gaps in the domain. */
export interface DiscontinuousLinearScale<Domain extends NumberLike> {
  (input: Domain): Optional<DiscontinuousLinearScaleOutput>;

  _scale: ScaleOrdinal<string, Optional<HigherOrderScaleEntry<Domain>>, undefined>;
  _getSubScale(input: Domain): Optional<ScaleLinear<number, number>>;
  _getAllSubScales(): ScaleLinear<number, number>[];

  getTicks(count?: Optional<SingleOrArray<number>>): number[][];
  getAllTicks(count?: Optional<SingleOrArray<number>>): number[];
  getBin(input: Domain): Optional<AnyBin<Domain>>;
  getX(input: Domain): Optional<number>;
  /**
   * Returns the pixel width of the rendered gap at `skipBinIndex` (0-based index
   * among skip bins only). Useful for sizing zigzag markers or axis-break
   * decorations proportionally to the skipped span.
   */
  getSkipWidth(skipBinIndex: number): Optional<number>;
}

/** Options for `splitIntoContinuousBins`. */
type SplitIntoContinuousBinsOptions<Input extends NumberLike> = {
  minToSkip: number;
  calculateDistance: (a: Input, b: Input) => number;
  getRelativeValueFromDistance: (value: Input, distance: number) => Input;
};

function splitIntoContinuousBins<Input extends NumberLike>(
  inputs: Input[],
  options: SplitIntoContinuousBinsOptions<Input>
): SkipEntryOrValueArray<Input>[] {
  const { minToSkip, calculateDistance, getRelativeValueFromDistance } = options;

  let continuousBuffer: Input[] = [];

  const alternatingBins: SkipEntryOrValueArray<Input>[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const isFirst = i === 0;
    const value = inputs[i];

    if (isFirst) {
      continuousBuffer.push(value);
      continue;
    }

    const previous = inputs[i - 1];
    const distanceFromPrevious = calculateDistance(value, previous);

    if (distanceFromPrevious === 1 || distanceFromPrevious <= minToSkip) {
      continuousBuffer.push(value);
      continue;
    }

    if (distanceFromPrevious > minToSkip) {
      if (continuousBuffer.length) {
        alternatingBins.push(continuousBuffer);
        continuousBuffer = [];
        const nextValue = getRelativeValueFromDistance(
          value,
          distanceFromPrevious + 1
        );
        alternatingBins.push([
          {
            isSkip: true,
            value: nextValue,
            skippedSpan: distanceFromPrevious,
          } as SkipEntry<Input>,
        ] as [SkipEntry<Input>]);
      }
      continuousBuffer.push(value);
    }

    // The trailing buffer is always flushed on the final iteration.
    const isLast = i === inputs.length - 1;
    if (isLast && continuousBuffer.length) {
      alternatingBins.push(continuousBuffer);
      continuousBuffer = [];
    }
  }

  // Flush any remaining buffer not covered by the inner loop
  if (continuousBuffer.length) {
    alternatingBins.push(continuousBuffer);
  }

  return alternatingBins;
}

function getArrayFromSingleOrArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function hasKey<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Range option for numeric domains: `start` is the pixel offset of the first
 * domain value, `span` is the true content span so the last tick lands at
 * `start + span`.
 */
export type NumericRange = { start: number; span: number };

/** Options passed to `makeDiscontinuousLinearScale`. */
export type MakeDiscontinuousLinearScaleOptions<T, Input extends NumberLike> = {
  minToSkip?: Optional<number>;
  /**
   * For numeric domains: `{ start, span }` — the first tick lands at `start`,
   * the last tick lands at `start + span`.
   *
   * For Date domains: `TemporalExtent<Date>` with `{ earliest, latest }` —
   * `start` is derived from `earliest.valueOf()` and `span` from
   * `latest.valueOf() - earliest.valueOf()`.
   */
  range: Input extends Date
    ? TemporalExtent<Date>
    : Input extends number
      ? NumericRange
      : never;
  selectValue: (item: T) => Input;
  convertValueToKey: (input: Input) => string;
  formatTick?: Optional<(tickValue: SkipEntryOrValue<Input>) => string>;
  calculateDistance: (a: Input, b: Input) => number;
  getRelativeValueFromDistance: (value: Input, distance: number) => Input;
  /**
   * Map a skipped domain-unit span to a gap weight (in scope-units).
   * Larger weight → wider rendered gap, giving a break-width hierarchy where
   * a weekend skip visually exceeds an overnight skip.
   *
   * Default: `() => 2` (matches the legacy fixed-width behaviour).
   *
   * Example: `(span) => span > 24 ? 4 : 2`
   */
  getSkipGap?: (skippedSpan: number) => number;
};

/**
 * Build a piecewise-linear scale over a potentially discontinuous domain.
 * Large gaps between adjacent values are compressed into "skip" bins, allowing
 * the visual axis to represent non-contiguous data without distorting the rest
 * of the domain.
 */
export function makeDiscontinuousLinearScale<T, Input extends NumberLike>(
  data: T[],
  options: MakeDiscontinuousLinearScaleOptions<T, Input>
): DiscontinuousLinearScale<Input> {
  let startingX: number;
  let span: number;

  if (hasKey(options.range, "earliest")) {
    const temporal = options.range as unknown as TemporalExtent<Date>;
    startingX = temporal.earliest.valueOf();
    span = temporal.latest.valueOf() - temporal.earliest.valueOf();
  } else {
    const numeric = options.range as NumericRange;
    startingX = numeric.start;
    span = numeric.span;
  }

  const selectValue = options.selectValue;
  const convertValueToKey = options.convertValueToKey;
  const calculateDistance = options.calculateDistance;
  const getRelativeValueFromDistance = options.getRelativeValueFromDistance;
  const formatTick = options.formatTick;
  const minToSkip = options.minToSkip ?? 1;
  const getSkipGap = options.getSkipGap ?? (() => 2);

  // Guard: empty data → empty scale
  if (data.length === 0) {
    const higherOrderScale = scaleOrdinal<string, HigherOrderScaleEntry<Input>, undefined>()
      .domain([])
      .range([])
      .unknown(undefined);

    function emptyConstructor(_input: Input): Optional<DiscontinuousLinearScaleOutput> {
      return { x: undefined };
    }

    const emptyScale = emptyConstructor as DiscontinuousLinearScale<Input>;
    emptyScale._scale = higherOrderScale;
    emptyScale._getSubScale = () => undefined;
    emptyScale._getAllSubScales = () => [];
    emptyScale.getTicks = () => [];
    emptyScale.getAllTicks = () => [];
    emptyScale.getBin = () => undefined;
    emptyScale.getX = () => undefined;
    emptyScale.getSkipWidth = () => undefined;
    return emptyScale;
  }

  const inputs = data.map(selectValue);

  const continuousBins = splitIntoContinuousBins(inputs, {
    minToSkip,
    calculateDistance,
    getRelativeValueFromDistance,
  });

  const totalItems = data.length;

  // Compute per-gap weight and total denominator.
  // Each skip bin contributes w_g scope-units; continuous items contribute 1 each.
  // Denominator = totalItems + (Σw_g − numGaps): subtract 1/gap because the
  // old formula added 1 per gap via the trailing +scopeUnit on continuous bins;
  // we now consolidate that into the skip bin weights.
  const skipWeights: number[] = [];
  for (let i = 1; i < continuousBins.length; i += 2) {
    const skipBin = continuousBins[i] as [SkipEntry<Input>];
    const w = getSkipGap(skipBin[0].skippedSpan);
    skipWeights.push(w);
  }

  const numGaps = skipWeights.length;
  const totalWeightedItems = totalItems + skipWeights.reduce((s, w) => s + w, 0) - numGaps;
  const scopeDenominator = Math.round(100 * totalWeightedItems) / 100;
  const scopeUnit = 1 / scopeDenominator;

  // Track pixel widths of each skip bin for getSkipWidth()
  const skipBinPixelWidths: number[] = [];

  let lastMaxScope = 0;
  let runningItemIndex = 0;
  let skipBinCounter = 0;

  const binsWithMeta = continuousBins.flatMap(
    (bin, binIndex, list) => {
      const isSkipBin = binIndex % 2 === 1;
      const isFirst = binIndex === 0;
      const isLast = binIndex === list.length - 1;
      const binLength = bin.length;

      let minScope: number;
      let maxScope: number;

      const ticks: AxisTick<Input>[] = [];
      let outputBin: AnyBin<Input>;

      if (isSkipBin) {
        const skipBin = bin as [SkipEntry<Input>];
        const dataBin = skipBin.map((skipEntry) => skipEntry.value);
        const w = skipWeights[skipBinCounter++];

        minScope = lastMaxScope;
        maxScope = minScope + scopeUnit * w;
        lastMaxScope = maxScope;

        const scopeArr: [number, number] = [minScope, maxScope];
        const rangeArr: [number, number] = [
          minScope * span + startingX,
          maxScope * span + startingX,
        ];

        // Record pixel width of this skip for getSkipWidth()
        skipBinPixelWidths.push(rangeArr[1] - rangeArr[0]);

        let runningScope = minScope;
        bin.forEach((value, itemIndex) => {
          const isItemLast = itemIndex === bin.length - 1;
          if (isItemLast) runningScope = maxScope;

          const position = runningScope * span;

          ticks.push({
            value: {
              input: value as SkipEntryOrValue<Input>,
              formatted: formatTick?.(value as SkipEntryOrValue<Input>),
            },
            index: {
              inAxis: runningItemIndex,
              inSubAxis: itemIndex,
            },
            scope: runningScope,
            from: { u: 0, v: position },
            to: { u: 5, v: position },
          });

          if (!isItemLast) runningScope += scopeUnit;
        });

        outputBin = {
          _id: `bin_${binIndex}`,
          isSkip: true,
          skipWeightUnits: w,
          items: dataBin,
          scope: scopeArr,
          ticks,
          range: rangeArr,
        } as SkipBin<Input>;
      } else {
        const dataBin = bin as Input[];

        if (isFirst && isLast) {
          minScope = 0;
          maxScope = 1;
        } else if (isFirst) {
          minScope = 0;
          maxScope = scopeUnit * (binLength - 1);
        } else if (isLast) {
          minScope = lastMaxScope;
          maxScope = 1;
        } else {
          minScope = lastMaxScope;
          maxScope = minScope + scopeUnit * (binLength - 1);
        }

        // Advance for the next skip bin (not needed for the last continuous bin)
        lastMaxScope = isLast ? maxScope : maxScope + scopeUnit;

        const scopeArr: [number, number] = [minScope, maxScope];
        const rangeArr: [number, number] = [
          minScope * span + startingX,
          maxScope * span + startingX,
        ];

        let runningScope = minScope;
        bin.forEach((value, itemIndex) => {
          const isItemLast = itemIndex === bin.length - 1;
          if (isItemLast) runningScope = maxScope;

          const position = runningScope * span;

          ticks.push({
            value: {
              input: value as SkipEntryOrValue<Input>,
              formatted: formatTick?.(value as SkipEntryOrValue<Input>),
            },
            index: {
              inAxis: runningItemIndex,
              inSubAxis: itemIndex,
            },
            scope: runningScope,
            from: { u: 0, v: position },
            to: { u: 5, v: position },
          });

          if (!isItemLast) runningScope += scopeUnit;
        });

        const setOfValues = new Set(dataBin);
        function checkValueIsInBin(value: Input) {
          return setOfValues.has(value);
        }

        outputBin = {
          _id: `bin_${binIndex}`,
          isSkip: false,
          items: dataBin,
          scope: scopeArr,
          range: rangeArr,
          ticks,
          checkValueIsInBin,
        } as ContinuousBin<Input>;
      }

      runningItemIndex++;
      return outputBin;
    }
  );

  const binEntries = binsWithMeta.flatMap((bin) => {
    const binScale = scaleLinear()
      .domain([
        bin.items[0] as number,
        bin.items[Math.max(bin.items.length - 1, 0)] as number,
      ])
      .range(bin.range);

    return { bin, scale: binScale };
  });

  const allSubScales = binEntries.map((entry) => entry.scale);

  // NOTE: Skip bins contain no real data values, so restricting
  // the ordinal lookup to non-skip bins eliminates key collisions without
  // changing any observable behavior for real inputs.
  const nonSkipBinEntries = binEntries.filter((entry) => !entry.bin.isSkip);
  const invertedBinEntries = nonSkipBinEntries.flatMap((entry) =>
    entry.bin.items.flatMap((item) => ({
      item,
      bin: entry.bin,
      scale: entry.scale,
    }))
  );

  const ordinalBinDomain = invertedBinEntries.map((b) =>
    convertValueToKey(b.item as Input)
  );
  const ordinalBinRange = invertedBinEntries as HigherOrderScaleEntry<Input>[];

  const higherOrderScale = scaleOrdinal<
    string,
    Optional<HigherOrderScaleEntry<Input>>,
    undefined
  >()
    .domain(ordinalBinDomain)
    .range(ordinalBinRange)
    .unknown(undefined);

  function getAllSubScales() {
    return allSubScales;
  }

  function getTicks(count?: Optional<SingleOrArray<number>>): number[][] {
    const counts =
      count !== undefined ? getArrayFromSingleOrArray(count) : undefined;

    function getTickCount(i: number): number | undefined {
      return counts?.[i % counts.length];
    }

    return getAllSubScales().map((scale, i) => {
      const tickCount = getTickCount(i);
      return scale.ticks(tickCount);
    });
  }

  function getAllTicks(count?: Optional<SingleOrArray<number>>): number[] {
    return getTicks(count).flat();
  }

  function getSubScale(input: Input): Optional<ScaleLinear<number, number>> {
    const result = higherOrderScale(convertValueToKey(input));
    return result?.scale;
  }

  function getBin(input: Input): Optional<AnyBin<Input>> {
    const result = higherOrderScale(convertValueToKey(input));
    return result?.bin;
  }

  function getX(input: Input): Optional<number> {
    const scale = getSubScale(input);
    if (scale === undefined) return undefined;
    return scale(input as unknown as number);
  }

  function getSkipWidth(skipBinIndex: number): Optional<number> {
    return skipBinPixelWidths[skipBinIndex];
  }

  function discontinuousLinearScaleConstructor(
    input: Input
  ): Optional<DiscontinuousLinearScaleOutput> {
    return { x: getX(input) };
  }

  const discontinuousLinearScale =
    discontinuousLinearScaleConstructor as DiscontinuousLinearScale<Input>;

  discontinuousLinearScale.getBin = getBin;
  discontinuousLinearScale.getX = getX;
  discontinuousLinearScale.getTicks = getTicks;
  discontinuousLinearScale.getAllTicks = getAllTicks;
  discontinuousLinearScale._getSubScale = getSubScale;
  discontinuousLinearScale._getAllSubScales = getAllSubScales;
  discontinuousLinearScale._scale = higherOrderScale;
  discontinuousLinearScale.getSkipWidth = getSkipWidth;

  return discontinuousLinearScale;
}
