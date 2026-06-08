# @visual-toolkit/d3-helpers

Shared scale contracts, CSS number utilities, SVG prop helpers, and the `selectOrCreate` D3 selection helper.

## Install

```sh
npm install @visual-toolkit/d3-helpers
# peer dep
npm install d3-selection
```

## API

### Scale contracts (types)

| Export | Description |
|---|---|
| `Id` | Opaque string identifier |
| `Optional<T>` | `T \| undefined` |
| `Extent` | `{ min: number; max: number }` |
| `ExtractSuffixFromString<T, Sep>` | Template-literal suffix extractor |
| `ToNumber<T>` | Convert numeric-string literal to number type |

**Removed:** `Pair<T>`, `Options<T>` (use `Partial<T>` directly).

### CSS numbers

| Export | Description |
|---|---|
| `PixelOrNumber` | `number \| \`${string}px\`` |
| `RemOrNumber` | `number \| \`${string}rem\`` |
| `EmOrNumber` | `number \| \`${string}em\`` |
| `AnyCssNumber` | Union of all CSS unit types |
| `stripPxFromPixels(v)` | Parse `"24px"` → `24`, `"12.5px"` → `12.5`; number passthrough. Uses `parseFloat` |
| `stripPxFromPixelsIfExists(v)` | Like above but returns `undefined` when absent |
| `stripSuffixFromCssNumber(v)` | Strip `px`/`rem`/`em` suffix via `parseFloat`. Note: `rem`/`em` values are NOT converted to px — the numeric part is used as-is |

**Removed:** `stripSuffixFromCssNumberIfExists` (use `v !== undefined ? stripSuffixFromCssNumber(v) : undefined` inline).

### SVG helpers

| Export | Description |
|---|---|
| `makeTranslateTransformFromPoint(rect)` | Build a `translate(x, y)` string |
| `applyRectangleAsProps(rect, transforms?)` | Spread x/y as `transform`, width/height as numbers |
| `applyDimensionAsProps(rect, transforms?)` | Spread width/height from a partial Dimension |
| `applyPointAsProps(rect, transforms?)` | Spread x/y from a partial Point |
| `estimateSvgTextSize(opts)` | Character-count heuristic for SVG text width |

### D3 selection helper

| Export | Description |
|---|---|
| `selectOrCreate(className, parent, tagName)` | Select or append a D3 child element by class name |

```ts
import { select } from "d3-selection";
import { selectOrCreate } from "@visual-toolkit/d3-helpers";

const $svg = select(svgElement);
// Returns an existing <g class="zoom-group"> or creates and appends one.
const $g = selectOrCreate<SVGGElement, unknown>("zoom-group", $svg, "g");
```

**Removed from public API:** `makeEntityGroupFactory` (deleted), `makeEntitiesFromRange` (internal).
