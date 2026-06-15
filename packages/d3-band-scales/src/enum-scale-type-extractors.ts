import type { EnumBandScale } from "./enum-band-scale.js";
import type { FixedEnumBandScale } from "./fixed-enum-band-scale.js";

/** @internal Recursively strips leading dash-segments to isolate the last segment of a dash-joined string. */
type LastDashSegment<K extends string>
  = K extends `${string}-${infer After}` ? LastDashSegment<After> : K;

/**
 * Extracts the `Key` generic from an `EnumBandScale` instance type.
 *
 * @example
 * const scale = makeEnumBandScale([{ key: "col-0", bandwidth: 50 }, { key: "col-1", bandwidth: 80 }]);
 * type K = ExtractKeyFromEnumBandScale<typeof scale>; // "col-0" | "col-1"
 */
export type ExtractKeyFromEnumBandScale<T>
  = T extends EnumBandScale<infer K> ? K : never;

/**
 * Extracts the `Key` generic from a `FixedEnumBandScale` instance type.
 *
 * @example
 * const scale = makeFixedEnumBandScale([{ key: "row-0" }, { key: "row-1" }], { bandwidth: 40 });
 * type K = ExtractKeyFromFixedEnumBandScale<typeof scale>; // "row-0" | "row-1"
 */
export type ExtractKeyFromFixedEnumBandScale<T>
  = T extends FixedEnumBandScale<infer K> ? K : never;

/**
 * Extracts the numeric index from the last dash-segment of a string literal key.
 * Returns `never` for keys whose last segment is not a non-negative integer.
 *
 * Uses a two-phase approach: first isolate the last dash-segment via `LastDashSegment`,
 * then infer it as a `number`. This reliably handles multi-dash keys (e.g. `"section-a-7"`).
 *
 * @example
 * type I = ExtractIndexFromKey<"row-0" | "row-1" | "row-2">; // 0 | 1 | 2
 * type J = ExtractIndexFromKey<"label">; // never
 * type K = ExtractIndexFromKey<"section-a-7">; // 7
 */
export type ExtractIndexFromKey<K extends string>
  = LastDashSegment<K> extends `${infer N extends number}` ? N : never;

/**
 * Extracts all numeric index tails from the keys of an `EnumBandScale`.
 * Keys without a numeric tail are excluded.
 *
 * @example
 * const scale = makeEnumBandScale([{ key: "col-0", bandwidth: 50 }, { key: "col-1", bandwidth: 80 }]);
 * type Idx = ExtractIndexesFromEnumBandScale<typeof scale>; // 0 | 1
 */
export type ExtractIndexesFromEnumBandScale<T>
  = ExtractIndexFromKey<ExtractKeyFromEnumBandScale<T>>;

/**
 * Extracts all numeric index tails from the keys of a `FixedEnumBandScale`.
 * Keys without a numeric tail are excluded.
 *
 * @example
 * const scale = makeFixedEnumBandScale([{ key: "row-0" }, { key: "row-1" }], { bandwidth: 40 });
 * type Idx = ExtractIndexesFromFixedEnumBandScale<typeof scale>; // 0 | 1
 */
export type ExtractIndexesFromFixedEnumBandScale<T>
  = ExtractIndexFromKey<ExtractKeyFromFixedEnumBandScale<T>>;
