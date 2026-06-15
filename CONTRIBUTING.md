# Contributing to visual-toolkit

Thanks for your interest in contributing. This is a pnpm monorepo of typed D3 /
SVG utilities. The packages are ESM-first, built with `tsup`, tested with
`vitest`, and type-checked with `tsc`.

## Prerequisites

- Node `>= 20`
- pnpm `11` (`corepack enable` will provision the version pinned in
  `package.json`'s `packageManager` field)

## Getting started

```sh
pnpm install
pnpm build      # build all packages
pnpm test       # run all package test suites
pnpm typecheck  # type-check every package
pnpm lint       # eslint (flat config + @stylistic)
pnpm docs:dev   # run the Astro Starlight docs site locally
```

## Workflow

1. Branch off `main`.
2. Make your change. Keep edits focused and match the surrounding code style —
   the lint step enforces formatting (`pnpm lint:fix` auto-applies it).
3. Add or update tests; new behavior needs coverage. Tests are colocated with
   source (`*.test.ts` next to the file under test).
4. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` before opening a
   PR — CI runs the same gates.
5. **Add a changeset** for any change that should appear in a package's
   changelog / version bump:

   ```sh
   pnpm changeset
   ```

   Pick the affected packages and the semver level (patch / minor / major) and
   write a short, user-facing note. Internal-only changes (docs, CI, tests) do
   not need one.

## Conventions

- **No banner comments** — use JSDoc/TSDoc on exported symbols instead.
- **No generic `types.ts` / `utils.ts` filenames** — name files by what they
  hold.
- File ordering: constants and types first, private before public, argument
  types declared above the function that consumes them.
- Tests are colocated (no `__tests__` directories).

## Releasing

Releases are changeset-driven. `pnpm version` consumes pending changesets to
bump versions and write `CHANGELOG.md` entries; `pnpm release` builds and
publishes to npm.
