# @visual-toolkit/d3-band-scales

Typed band-scale factories built on `d3-scale` — fixed-width and variable-width ordinal bands with gap, padding, content-offset, and grid support.

## Install

```sh
npm install @visual-toolkit/d3-band-scales
# peer dep
npm install d3-scale
```

## API

| Export | Description |
|---|---|
| `makeFixedBandScale(data, opts)` | All bands share the same pixel width and gap |
| `makeEnumBandScale(items, opts?)` | Each item carries its own `bandwidth` and optional `gap`; key is a string literal |
| `makeDynamicBandScale(data, opts)` | Per-item bandwidth selected via a callback |
| `makeFixedEnumBandScale(items, opts?)` | Like `makeFixedBandScale` but keys are string literals; disabled items filtered |
| `makeGrid({ rows, columns })` | 2-D grid from two axis specs; cells addressed by key or numeric index |
| `calculateLengthFromFixedBandsWithGaps(n, opts)` | Total pixel span for N equal bands; accepts optional `padStart`/`padEnd` |
| `calculateLengthFromDynamicBands(bandwidths, gap, opts?)` | Total pixel span for variable-width bands; accepts optional `padStart`/`padEnd` |
| `calculateFitScaleFactor(contentLength, containerLength)` | Uniform scale factor that maps content to a given length |

Types re-exported from `@visual-toolkit/d3-helpers` for consumer convenience: `Id`, `Optional`, `Extent`, `AnyCssNumber`, `PixelOrNumber`, `RemOrNumber`, `EmOrNumber`.

## padStart / padEnd

All four band factories accept `{ padStart?, padEnd? }` options (`AnyCssNumber` values):

| Option | Effect |
|---|---|
| `padStart` | Leading margin. The first band's x0 is offset by this amount. Included in `getRange()` and `getExtent()`. |
| `padEnd` | Trailing margin. Extends `maxX` / `getRange()` by this amount after the last band. |

Both paddings are included in `getRange()` and `getExtent()`. `getExtent().min` is always `0`.

`calculateLengthFromFixedBandsWithGaps` and `calculateLengthFromDynamicBands` also accept optional `padStart`/`padEnd` so the computed length matches what the scale reports.

**`rem`/`em` values are NOT converted to px.** The numeric part is used as-is after the unit suffix is stripped. This applies to all `AnyCssNumber` option fields.

**Removed:** `initialX` option (replaced by `padStart`). Use `padStart` for a leading margin.

## contentOffsetStart / contentOffsetEnd

All four band factories accept `{ contentOffsetStart?, contentOffsetEnd? }` options. These are **inner per-band insets**, distinct from `padStart`/`padEnd`:

| Concept | Option(s) | Effect | In `getRange()`? |
|---|---|---|---|
| Outer margins | `padStart`, `padEnd` | Push bands inward / extend total length | Yes |
| Inner insets | `contentOffsetStart`, `contentOffsetEnd` | Narrow the usable area inside each band | No |

Accessors added by these options:

| Accessor | Fixed | Dynamic/Enum | Returns |
|---|---|---|---|
| `getContentX0(input)` | `x0 + contentOffsetStart` | `x0 + perItemStart` | `undefined` for unknown input |
| `getContentX1(input)` | `x1 − contentOffsetEnd` | `x1 − perItemEnd` | `undefined` for unknown input |
| `getContentBandwidth()`/`getContentBandwidth(input)` | zero-arg, constant | per-input | clamped to 0 if offsets ≥ bandwidth |

For `DynamicBandScale` (and `EnumBandScale`), per-item selector overrides mirror the `gap`/`selectGap` precedence: `selectContentOffsetStart`/`selectContentOffsetEnd` return `undefined` to fall back to the global value.

`EnumLayoutEntry` exposes `contentOffsetStart?` / `contentOffsetEnd?` fields wired via those selectors.

`FixedEnumBandScale` inherits the global options (per-entry not supported — underlying factory is global-only).

## scaleTo / getScaleFactor

All four band factories accept a `scaleTo` option that stretches or shrinks the entire layout so it fits a target pixel length:

```ts
import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";

const scale = makeFixedBandScale(items, {
  selectId: (d) => d.id,
  bandwidth: 80,
  gap: 12,
  scaleTo: 500, // fit to exactly 500px
});

scale.getScaleFactor(); // → 500 / naturalRange (≈ 1.404 for 4 items)
scale.getBandwidth();   // → 80 * k (pre-scaled)
scale.getX0("C");       // → scaled position
scale.getX1("D");       // → 500 (fills container)
```

`scaleTo: 'content'` (default) skips scaling — the natural layout is returned unchanged.  
Read the applied factor back via `getScaleFactor()`.

## AnyCssNumber

All `bandwidth`, `gap`, `padStart`, `padEnd`, `contentOffsetStart`, `contentOffsetEnd`, and `scaleTo` options accept `AnyCssNumber`:

```ts
type AnyCssNumber = number | `${string}px` | `${string}rem` | `${string}em`
```

Examples: `80`, `"80px"`, `"12.5px"`, `"1e2px"`, `"1.5rem"`, `"2em"` all parse correctly.

## makeGrid

`makeGrid` builds a 2-D grid from row and column axis specifications.

### Axis specifications

Each axis accepts one of three forms:

| Form | Type | Effect |
|---|---|---|
| `{ keys, bandwidth, gap?, ... }` | `KeysAxisSpec` | Builds a `FixedEnumBandScale`; `disabledKeys` excludes entries |
| `{ entries, gap?, ... }` | `EntriesAxisSpec` | Builds an `EnumBandScale` from pre-made `EnumLayoutEntry[]` |
| A pre-built scale instance | `PrebuiltAxisSpec` | Used directly (escape hatch) |

### Dual addressing

Cells are addressed by **literal key** or by the **numeric index** embedded in the trailing `-N` suffix of each key (e.g. `"row-3"` → index `3`):

```ts
const grid = makeGrid({
  rows: { keys: ["row-0", "row-1", "row-2"] as const, bandwidth: 40, gap: 4 },
  columns: { keys: ["col-0", "col-1"] as const, bandwidth: 80, gap: 8 },
});

grid.getCellPosition("row-1", "col-0"); // literal key addressing
grid.getCellPosition(1, 0);             // numeric index addressing — same result
```

### Cell helpers

| Method | Returns |
|---|---|
| `getCellPosition(row, col)` | `{ x, y }` — top-left corner |
| `getCellRect(row, col, span?)` | `{ x, y, width, height }` — full bounding rect; `rowSpan`/`colSpan` supported |
| `getContentCellRect(row, col)` | Content-inset rect (no span — offsets are per-cell) |

### Exposed scales

`grid.rowScale` and `grid.colScale` are the resolved `FixedEnumBandScale` or `EnumBandScale` instances, so all per-axis accessors remain available.

## Type extractors

Utility types for inferring key and index generics from scale instances:

```ts
import type {
  ExtractKeyFromEnumBandScale,
  ExtractKeyFromFixedEnumBandScale,
  ExtractIndexFromKey,
  ExtractIndexesFromEnumBandScale,
  ExtractIndexesFromFixedEnumBandScale,
} from "@visual-toolkit/d3-band-scales";

const scale = makeEnumBandScale([
  { key: "col-0", bandwidth: 50 },
  { key: "col-1", bandwidth: 80 },
]);

type K = ExtractKeyFromEnumBandScale<typeof scale>; // "col-0" | "col-1"
type I = ExtractIndexesFromEnumBandScale<typeof scale>; // 0 | 1
type IX = ExtractIndexFromKey<"section-a-7">; // 7
```

## Usage

### Fixed-width bands

```ts
import { makeFixedBandScale } from "@visual-toolkit/d3-band-scales";

const scale = makeFixedBandScale(
  [{ id: "jan" }, { id: "feb" }, { id: "mar" }],
  { selectId: (d) => d.id, bandwidth: 80, gap: 8, padStart: 16 }
);

scale.getX0("jan"); // → 16  (padStart)
scale.getX0("feb"); // → 104 (16 + 80 + 8)
scale.getRange();   // → 16 + 3*80 + 2*8 = 272
scale.getAllBands(); // → [{ x0, x1, cx }, ...]
```

### Variable-width bands

```ts
import { makeDynamicBandScale } from "@visual-toolkit/d3-band-scales";

const data = [
  { id: "A", width: 120 },
  { id: "B", width: 60 },
];

const scale = makeDynamicBandScale(data, {
  selectId: (d) => d.id,
  selectBandwidth: (d) => d.width,
  gap: 12,
  contentOffsetStart: 20,
  contentOffsetEnd: 8,
});

scale.getContentX0("A");         // → 20
scale.getContentX1("A");         // → 112  (120 − 8)
scale.getContentBandwidth("A");  // → 92   (120 − 20 − 8)
```

### Enum band scales

```ts
import { makeEnumBandScale } from "@visual-toolkit/d3-band-scales";

const scale = makeEnumBandScale([
  { key: "col-0", bandwidth: 50, gap: 8 },
  { key: "col-1", bandwidth: 80 },
  { key: "col-2", bandwidth: 60, gap: 12 },
], { gap: 10 });
```

### Grid layout

```ts
import { makeGrid } from "@visual-toolkit/d3-band-scales";

const grid = makeGrid({
  rows: { keys: ["row-0", "row-1", "row-2"] as const, bandwidth: 40, gap: 4 },
  columns: {
    entries: [
      { key: "col-0", bandwidth: 80 },
      { key: "col-1", bandwidth: 120 },
    ],
    gap: 8,
  },
});

const pos = grid.getCellPosition("row-1", "col-0"); // or getCellPosition(1, 0)
const rect = grid.getCellRect("row-0", "col-0", { colSpan: 2 });
const contentRect = grid.getContentCellRect(0, 0);
```

## Empty domain and duplicate ids

- **Empty domain**: all methods return safe defaults — `getRange()` → `0`, `getExtent()` → `{ min: 0, max: 0 }`, `getAllBands()` → `[]`.
- **Duplicate ids**: the first occurrence is kept and a `console.warn` listing the duplicates is emitted. The extent and length are computed from the deduplicated domain.
