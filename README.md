# visual-toolkit

A monorepo of typed D3 and SVG utilities built on `d3-scale`. All packages are ESM-first, built with tsup, tested with vitest, and ship full type declarations with source maps.

---

## Packages

| Package | Description |
|---|---|
| [`@visual-toolkit/d3-band-scales`](packages/d3-band-scales) | Typed band-scale factories — fixed-width, variable-width, enum-keyed, and fitted accessors |
| [`@visual-toolkit/d3-discontinuous-scale`](packages/d3-discontinuous-scale) | Piecewise-linear scale that compresses or skips gaps in an otherwise continuous domain |
| [`@visual-toolkit/d3-helpers`](packages/d3-helpers) | Shared scale contracts, CSS number utilities, SVG helpers, entity range utilities, and the `selectOrCreate` D3 helper |

---

## Docs

An Astro Starlight docs site with interactive demos and a TypeDoc-generated API
reference lives in [`docs/`](docs):

```sh
pnpm install
pnpm docs:dev
```

Then open `http://localhost:4321` in your browser. Every guide page pairs a
minimal always-visible usage snippet with a live demo (sliders/knobs where they
help) and a collapsed full demo source. The API Reference section is generated
from the packages' TypeScript types and JSDoc via `starlight-typedoc` at build
time. The guide covers: fixed bands, dynamic/variable bands, a calendar-grid
example, enum scales, grid layout, composing scales, transform & fit, the
discontinuous linear scale, and the band-math / svg / `selectOrCreate` /
css-number helpers.

---

## Roadmap

Future packages planned:
- `@visual-toolkit/three-helpers` — three.js geometry and scene utilities
- `@visual-toolkit/geo-helpers` — GeoJSON / TopoJSON projection helpers

---

## Dev quickstart

```sh
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test
```

Requires Node >= 20 and pnpm.
