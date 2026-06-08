import type { Optional } from "@visual-toolkit/d3-helpers";
import {
  type FixedBandScale,
  type FixedBandScaleOptions,
  makeFixedBandScale,
} from "./fixed-band-scale.js";

/** A single layout entry for `makeFixedEnumBandScale`. */
export type FixedEnumLayoutEntry<Key extends string = string> = {
  key: Key;
  isEnabled?: Optional<boolean>;
};

/** `FixedBandScale` extended with a `doesKeyExist` guard for disabled entries. */
export interface FixedEnumBandScale<Key extends string = string>
  extends FixedBandScale<Key> {
  doesKeyExist(key: Key): boolean;
}

/** Options passed to `makeFixedEnumBandScale`. */
export type FixedEnumBandScaleOptions<Key extends string> = Omit<
  FixedBandScaleOptions<FixedEnumLayoutEntry<Key>, Key>,
  "selectId"
>;

/**
 * Build a fixed enum band scale from a list of `{ key, isEnabled? }` entries.
 * Items with `isEnabled === false` are filtered out before building the scale.
 */
export function makeFixedEnumBandScale<Key extends string>(
  items: FixedEnumLayoutEntry<Key>[],
  options: Optional<FixedEnumBandScaleOptions<Key>> = { bandwidth: 0 }
): FixedEnumBandScale<Key> {
  const enabledItems = items.filter((item) => item.isEnabled !== false);

  const baseScale = makeFixedBandScale(enabledItems, {
    ...(options as FixedBandScaleOptions<FixedEnumLayoutEntry<Key>, Key>),
    selectId: (d) => d.key,
  }) as FixedEnumBandScale<Key>;

  const keySet = new Set(enabledItems.map((d) => d.key));

  baseScale.doesKeyExist = (key: Key) => keySet.has(key);

  return baseScale;
}
