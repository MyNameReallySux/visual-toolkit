import type { AnyCssNumber, Optional } from "@visual-toolkit/d3-helpers";
import {
  type DynamicBandScale,
  type DynamicBandScaleOptions,
  makeDynamicBandScale,
} from "./dynamic-band-scale.js";

/** A single layout entry for `makeEnumBandScale`. */
export type EnumLayoutEntry<Key extends string = string> = {
  key: Key;
  bandwidth: number;
  gap?: Optional<AnyCssNumber>;
  /** Per-entry leading inset override. Overrides the global `contentOffsetStart` for this entry. */
  contentOffsetStart?: Optional<AnyCssNumber>;
  /** Per-entry trailing inset override. Overrides the global `contentOffsetEnd` for this entry. */
  contentOffsetEnd?: Optional<AnyCssNumber>;
};

/** Callable scale keyed by string literal enum values, with per-item bandwidth. */
export interface EnumBandScale<Key extends string = string>
  extends DynamicBandScale<Key> {}

/** Options passed to `makeEnumBandScale`. */
export type EnumBandScaleOptions<Key extends string> = Omit<
  DynamicBandScaleOptions<EnumLayoutEntry<Key>, Key>,
  "selectId" | "selectBandwidth" | "selectGap" | "selectContentOffsetStart" | "selectContentOffsetEnd"
>;

/**
 * Build an enum band scale from a list of `{ key, bandwidth, gap? }` entries.
 * Each key must be a string literal; bandwidth is specified per entry.
 * Per-entry `gap` is honored; falls back to the global `gap` option.
 */
export function makeEnumBandScale<Key extends string>(
  items: EnumLayoutEntry<Key>[],
  options?: Optional<EnumBandScaleOptions<Key>>
): EnumBandScale<Key> {
  return makeDynamicBandScale(items, {
    ...options,
    selectBandwidth: (d) => d.bandwidth,
    selectId: (d) => d.key,
    selectGap: (d) => d.gap,
    selectContentOffsetStart: (d) => d.contentOffsetStart,
    selectContentOffsetEnd: (d) => d.contentOffsetEnd,
  });
}
