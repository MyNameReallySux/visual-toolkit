/**
 * Inline type aliases replacing the private-scope dependency.
 * Core.Id          -> Id
 * Core.Optional<T> -> T | undefined
 * Core.Extent      -> Extent
 */

/** Opaque string identifier. */
export type Id = string;

/** A value that may be absent. */
export type Optional<T> = T | undefined;

/** A numeric range with inclusive min and max. */
export type Extent = {
  min: number;
  max: number;
};

/** Template-literal suffix extractor. */
export type ExtractSuffixFromString<
  T extends string,
  Sep extends string = "-",
> = T extends `${string}${Sep}${infer Suffix}` ? Suffix : never;

/** Convert a numeric-string literal to its number type. */
export type ToNumber<T extends string>
  = T extends `${infer N extends number}` ? N : never;
