import type { AnyCssNumber, Optional } from "@visual-toolkit/d3-helpers";
import { stripSuffixFromCssNumber } from "@visual-toolkit/d3-helpers";
import type { EnumLayoutEntry } from "./enum-band-scale.js";
import { makeEnumBandScale } from "./enum-band-scale.js";
import type { FixedEnumBandScale } from "./fixed-enum-band-scale.js";
import { makeFixedEnumBandScale } from "./fixed-enum-band-scale.js";
import type { EnumBandScale } from "./enum-band-scale.js";
import type { ExtractIndexFromKey } from "./enum-scale-type-extractors.js";

/** 2-D cell position (top-left corner). */
export type CellPosition = {
  x: number;
  y: number;
};

/** Axis-aligned rectangle produced by `getCellRect` and `getContentCellRect`. */
export type CellRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** AxisSpec variant: build a `FixedEnumBandScale` from an explicit key list. */
export type KeysAxisSpec<K extends string> = {
  keys: readonly K[];
  bandwidth: AnyCssNumber;
  gap?: Optional<AnyCssNumber>;
  padStart?: Optional<AnyCssNumber>;
  padEnd?: Optional<AnyCssNumber>;
  contentOffsetStart?: Optional<AnyCssNumber>;
  contentOffsetEnd?: Optional<AnyCssNumber>;
  scaleTo?: "content" | AnyCssNumber;
  /** Keys to exclude from the scale (sets `isEnabled: false` for matching entries). */
  disabledKeys?: readonly K[];
};

/** AxisSpec variant: build an `EnumBandScale` from pre-made layout entries. */
export type EntriesAxisSpec<K extends string> = {
  entries: EnumLayoutEntry<K>[];
  gap?: Optional<AnyCssNumber>;
  padStart?: Optional<AnyCssNumber>;
  padEnd?: Optional<AnyCssNumber>;
  contentOffsetStart?: Optional<AnyCssNumber>;
  contentOffsetEnd?: Optional<AnyCssNumber>;
  scaleTo?: "content" | AnyCssNumber;
};

/**
 * AxisSpec variant: pass a pre-built enum or fixed-enum band scale directly
 * (escape hatch — detected by the presence of a `getX0` function).
 */
export type PrebuiltAxisSpec<K extends string>
  = | EnumBandScale<K>
    | FixedEnumBandScale<K>;

/** Union of all axis specification forms accepted by `makeGrid`. */
export type AxisSpec<K extends string>
  = | KeysAxisSpec<K>
    | EntriesAxisSpec<K>
    | PrebuiltAxisSpec<K>;

type ResolvedAxis<K extends string> = {
  /** Ordered domain keys. */
  domain: K[];
  /** Index → key lookup (from trailing -N suffix). Last-wins on collision. */
  indexMap: Map<number, K>;
  getX0(key: K): Optional<number>;
  getX1(key: K): Optional<number>;
  getContentX0(key: K): Optional<number>;
  getContentX1(key: K): Optional<number>;
};

/** Optional span overrides for `getCellRect`. */
export type SpanOptions = {
  rowSpan?: number;
  colSpan?: number;
};

/** Return type of `makeGrid`. */
export type Grid<RowKey extends string, ColKey extends string> = {
  /** The resolved row scale (FixedEnumBandScale or EnumBandScale). */
  rowScale: FixedEnumBandScale<RowKey> | EnumBandScale<RowKey>;
  /** The resolved column scale (FixedEnumBandScale or EnumBandScale). */
  colScale: FixedEnumBandScale<ColKey> | EnumBandScale<ColKey>;
  /**
   * Position of a cell's top-left corner.
   * Accepts a literal key or a numeric index (derived from trailing `-N`).
   * Returns `{ x: 0, y: 0 }` fallback for missing keys.
   */
  getCellPosition(
    row: RowKey | ExtractIndexFromKey<RowKey>,
    col: ColKey | ExtractIndexFromKey<ColKey>
  ): CellPosition;
  /**
   * Full bounding rect for a cell, optionally spanning multiple bands.
   * Width/height cover from the addressed cell's x0/y0 to the last spanned band's x1/y1.
   * Accepts a literal key or a numeric index.
   */
  getCellRect(
    row: RowKey | ExtractIndexFromKey<RowKey>,
    col: ColKey | ExtractIndexFromKey<ColKey>,
    span?: SpanOptions
  ): CellRect;
  /**
   * Content-inset rect for a single cell (no span support — content offsets are per-cell).
   * Accepts a literal key or a numeric index.
   */
  getContentCellRect(
    row: RowKey | ExtractIndexFromKey<RowKey>,
    col: ColKey | ExtractIndexFromKey<ColKey>
  ): CellRect;
};

/** Build the index → key map from domain keys. /-(\d+)$/ tail rule; last wins on collision. */
function buildIndexMap<K extends string>(domain: K[]): Map<number, K> {
  const map = new Map<number, K>();
  const re = /-(\d+)$/;
  for (const key of domain) {
    const m = re.exec(key);
    if (m) {
      map.set(Number(m[1]), key);
    }
  }
  return map;
}

/** Resolve an address (key or numeric index) to the domain key. */
function resolveKey<K extends string>(
  addr: K | number,
  indexMap: Map<number, K>,
): K {
  if (typeof addr === "number") {
    return indexMap.get(addr) as K;
  }
  return addr;
}

/** Build a ResolvedAxis from a prebuilt scale. */
function resolvePrebuilt<K extends string>(
  scale: EnumBandScale<K> | FixedEnumBandScale<K>,
): ResolvedAxis<K> {
  const domain = scale.getDomain() as K[];
  return {
    domain,
    indexMap: buildIndexMap(domain),
    getX0: (k) => scale.getX0(k),
    getX1: (k) => scale.getX1(k),
    getContentX0: (k) => scale.getContentX0(k),
    getContentX1: (k) => scale.getContentX1(k),
  };
}

/** Determine whether a spec is a pre-built scale (duck-type check). */
function isPrebuilt<K extends string>(
  spec: AxisSpec<K>,
): spec is PrebuiltAxisSpec<K> {
  return "getX0" in spec && typeof spec.getX0 === "function";
}

/** Determine whether a spec is the `keys` form. */
function isKeysSpec<K extends string>(
  spec: AxisSpec<K>,
): spec is KeysAxisSpec<K> {
  return "keys" in spec;
}

/** Determine whether a spec is the `entries` form. */
function isEntriesSpec<K extends string>(
  spec: AxisSpec<K>,
): spec is EntriesAxisSpec<K> {
  return "entries" in spec;
}

/** Build a scale and resolved axis from a `KeysAxisSpec`. */
function resolveKeysSpec<K extends string>(spec: KeysAxisSpec<K>): {
  scale: FixedEnumBandScale<K>;
  axis: ResolvedAxis<K>;
} {
  const { keys, bandwidth, gap, padStart, padEnd, contentOffsetStart, contentOffsetEnd, scaleTo, disabledKeys } = spec;
  const disabledSet = new Set<K>(disabledKeys ?? []);
  const items = (keys as K[]).map((k) => ({
    key: k,
    isEnabled: !disabledSet.has(k),
  }));
  const bw = stripSuffixFromCssNumber(bandwidth);
  const scale = makeFixedEnumBandScale(items, {
    bandwidth: bw,
    gap,
    padStart,
    padEnd,
    contentOffsetStart,
    contentOffsetEnd,
    scaleTo,
  });
  const domain = scale.getDomain() as K[];
  const axis: ResolvedAxis<K> = {
    domain,
    indexMap: buildIndexMap(domain),
    getX0: (k) => scale.getX0(k),
    getX1: (k) => scale.getX1(k),
    getContentX0: (k) => scale.getContentX0(k),
    getContentX1: (k) => scale.getContentX1(k),
  };
  return { scale, axis };
}

/** Build a scale and resolved axis from an `EntriesAxisSpec`. */
function resolveEntriesSpec<K extends string>(spec: EntriesAxisSpec<K>): {
  scale: EnumBandScale<K>;
  axis: ResolvedAxis<K>;
} {
  const { entries, gap, padStart, padEnd, contentOffsetStart, contentOffsetEnd, scaleTo } = spec;
  const scale = makeEnumBandScale(entries, {
    gap,
    padStart,
    padEnd,
    contentOffsetStart,
    contentOffsetEnd,
    scaleTo,
  });
  const domain = scale.getDomain() as K[];
  const axis: ResolvedAxis<K> = {
    domain,
    indexMap: buildIndexMap(domain),
    getX0: (k) => scale.getX0(k),
    getX1: (k) => scale.getX1(k),
    getContentX0: (k) => scale.getContentX0(k),
    getContentX1: (k) => scale.getContentX1(k),
  };
  return { scale, axis };
}

/** Compute span end key: starting from `startKey` in `domain`, advance `span - 1` steps. */
function resolveSpanEndKey<K extends string>(
  startKey: K,
  spanCount: number,
  domain: K[],
): K {
  if (spanCount <= 1) return startKey;
  const startIdx = domain.indexOf(startKey);
  if (startIdx < 0) return startKey;
  const endIdx = Math.min(startIdx + spanCount - 1, domain.length - 1);
  return domain[endIdx];
}

/**
 * Build a 2-D grid from row and column axis specifications.
 *
 * Each axis accepts:
 * - `{ keys, bandwidth, ... }` — builds a `FixedEnumBandScale`.
 * - `{ entries, ... }` — builds an `EnumBandScale` from pre-made layout entries.
 * - A pre-built `EnumBandScale` or `FixedEnumBandScale` instance (escape hatch).
 *
 * Cell addresses accept literal keys OR numeric indexes derived from the
 * trailing `-N` suffix of each key (e.g. `"row-3"` → index `3`).
 *
 * @example
 * const grid = makeGrid({
 *   rows: { keys: ["row-0", "row-1", "row-2"] as const, bandwidth: 40, gap: 4 },
 *   columns: { keys: ["col-0", "col-1"] as const, bandwidth: 80, gap: 8 },
 * });
 * const pos = grid.getCellPosition("row-1", "col-0"); // or getCellPosition(1, 0)
 * const rect = grid.getCellRect("row-0", "col-0", { colSpan: 2 });
 */
export function makeGrid<RowKey extends string, ColKey extends string>(options: {
  rows: AxisSpec<RowKey>;
  columns: AxisSpec<ColKey>;
}): Grid<RowKey, ColKey> {
  const { rows: rowSpec, columns: colSpec } = options;

  // Resolve row axis
  let rowScale: FixedEnumBandScale<RowKey> | EnumBandScale<RowKey>;
  let rowAxis: ResolvedAxis<RowKey>;
  if (isPrebuilt(rowSpec)) {
    rowScale = rowSpec as FixedEnumBandScale<RowKey> | EnumBandScale<RowKey>;
    rowAxis = resolvePrebuilt(rowScale);
  } else if (isKeysSpec(rowSpec)) {
    const r = resolveKeysSpec(rowSpec);
    rowScale = r.scale;
    rowAxis = r.axis;
  } else if (isEntriesSpec(rowSpec)) {
    const r = resolveEntriesSpec(rowSpec);
    rowScale = r.scale;
    rowAxis = r.axis;
  } else {
    throw new Error("makeGrid: unrecognized row AxisSpec");
  }

  // Resolve column axis
  let colScale: FixedEnumBandScale<ColKey> | EnumBandScale<ColKey>;
  let colAxis: ResolvedAxis<ColKey>;
  if (isPrebuilt(colSpec)) {
    colScale = colSpec as FixedEnumBandScale<ColKey> | EnumBandScale<ColKey>;
    colAxis = resolvePrebuilt(colScale);
  } else if (isKeysSpec(colSpec)) {
    const r = resolveKeysSpec(colSpec);
    colScale = r.scale;
    colAxis = r.axis;
  } else if (isEntriesSpec(colSpec)) {
    const r = resolveEntriesSpec(colSpec);
    colScale = r.scale;
    colAxis = r.axis;
  } else {
    throw new Error("makeGrid: unrecognized column AxisSpec");
  }

  function getCellPosition(
    row: RowKey | ExtractIndexFromKey<RowKey>,
    col: ColKey | ExtractIndexFromKey<ColKey>,
  ): CellPosition {
    const rKey = resolveKey(row as RowKey | number, rowAxis.indexMap);
    const cKey = resolveKey(col as ColKey | number, colAxis.indexMap);
    const x = colAxis.getX0(cKey) ?? 0;
    const y = rowAxis.getX0(rKey) ?? 0;
    return { x, y };
  }

  function getCellRect(
    row: RowKey | ExtractIndexFromKey<RowKey>,
    col: ColKey | ExtractIndexFromKey<ColKey>,
    span?: SpanOptions,
  ): CellRect {
    const rKey = resolveKey(row as RowKey | number, rowAxis.indexMap);
    const cKey = resolveKey(col as ColKey | number, colAxis.indexMap);

    const rowSpan = span?.rowSpan ?? 1;
    const colSpan = span?.colSpan ?? 1;

    const rEndKey = resolveSpanEndKey(rKey, rowSpan, rowAxis.domain);
    const cEndKey = resolveSpanEndKey(cKey, colSpan, colAxis.domain);

    const x = colAxis.getX0(cKey) ?? 0;
    const y = rowAxis.getX0(rKey) ?? 0;
    const x1 = colAxis.getX1(cEndKey) ?? x;
    const y1 = rowAxis.getX1(rEndKey) ?? y;

    return { x, y, width: x1 - x, height: y1 - y };
  }

  function getContentCellRect(
    row: RowKey | ExtractIndexFromKey<RowKey>,
    col: ColKey | ExtractIndexFromKey<ColKey>,
  ): CellRect {
    const rKey = resolveKey(row as RowKey | number, rowAxis.indexMap);
    const cKey = resolveKey(col as ColKey | number, colAxis.indexMap);

    const x = colAxis.getContentX0(cKey) ?? 0;
    const y = rowAxis.getContentX0(rKey) ?? 0;
    const x1 = colAxis.getContentX1(cKey) ?? x;
    const y1 = rowAxis.getContentX1(rKey) ?? y;

    return { x, y, width: x1 - x, height: y1 - y };
  }

  return {
    rowScale,
    colScale,
    getCellPosition,
    getCellRect,
    getContentCellRect,
  };
}
