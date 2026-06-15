# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).
It holds in-flight changesets — one Markdown file per intended release note,
each declaring which packages bump and at what semver level.

Add one with:

```sh
pnpm changeset
```

`pnpm version` consumes the pending changesets to bump versions and write
CHANGELOG entries; `pnpm release` builds and publishes. See the
[common questions](https://github.com/changesets/changesets/blob/main/docs/common-questions.md)
for more.
