# @visual-toolkit/d3-discontinuous-scale

A piecewise-linear scale that compresses or skips gaps in an otherwise continuous domain — useful for time axes where weekends or holidays should be collapsed without changing the visual weight of the surrounding data.

## Install

```sh
npm install @visual-toolkit/d3-discontinuous-scale
# peer dep
npm install d3-scale
```

## API

| Export | Description |
|---|---|
| `makeDiscontinuousLinearScale(data, opts)` | Build a piecewise-linear scale that compresses/skips gaps between non-adjacent domain values |
| `NumberLike` | A value that can be treated as a number (number, Date, or valueOf object) |
| `SkipEntry<T>` | Marks a gap/break in a discontinuous domain |
| `AxisTick<T>` | A single rendered tick on a discontinuous axis |
| `TemporalExtent<T>` | A temporal extent `{ earliest, latest }` for Date domains |
| `NumericRange` | `{ start: number; span: number }` — the content range for numeric domains |

## range option

**Breaking change from previous API:** the `range` field now uses `{ start, span }` instead of `{ min, max }` for numeric domains.

| Old | New |
|---|---|
| `range: { min: 0, max: 300 }` | `range: { start: 0, span: 300 }` |

- `start` — pixel offset of the first domain value.
- `span` — true content span. The last tick lands exactly at `start + span`.

For Date domains the option is still `TemporalExtent<Date>` with `{ earliest, latest }`. Internally `start = earliest.valueOf()` and `span = latest.valueOf() - earliest.valueOf()`.

## Usage

```ts
import { makeDiscontinuousLinearScale } from "@visual-toolkit/d3-discontinuous-scale";

const values = [0, 1, 2, /* gap */ 100, 101, 102];

const scale = makeDiscontinuousLinearScale(values, {
  range: { start: 0, span: 300 },
  selectValue: (d) => d,
  convertValueToKey: (d) => String(d),
  calculateDistance: (a, b) => a - b,
  getRelativeValueFromDistance: (v, dist) => v - dist,
  minToSkip: 1, // gaps larger than 1 unit are compressed
});

scale.getX(0);   // → 0
scale.getX(2);   // → some value well below 150 (gap is compressed)
scale.getX(100); // → picks up after the compressed gap region

// Unknown keys return undefined
scale.getX(999);  // → undefined
scale.getBin(999); // → undefined

// Inspect bins
const bin = scale.getBin(100);
console.log(bin?.isSkip); // false — 100 is a real data point

// Axis ticks (per sub-scale)
const ticksPerSegment = scale.getTicks([5]);
const allTicks = scale.getAllTicks(5);
```

### Working-day example

```ts
// start=20 (padLeft), span=700 so the last tick lands at 720 (= 20 + 700)
const scale = makeDiscontinuousLinearScale(hours, {
  range: { start: padLeft, span: svgWidth - padLeft },
  selectValue: (h) => h,
  convertValueToKey: (h) => String(h),
  calculateDistance: (a, b) => a - b,
  getRelativeValueFromDistance: (v, dist) => v - dist,
  minToSkip: 1,
});
```

## Empty data and unknown keys

- **Empty data**: constructing a scale with no data does not crash. `getX()` and `getBin()` return `undefined`, `getTicks()` returns `[]`.
- **Unknown keys**: `getX()` and `getBin()` return `undefined` for domain values not present in the data.
