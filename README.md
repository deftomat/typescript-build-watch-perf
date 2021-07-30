# typescript-build-watch-perf

Repo for issue https://github.com/microsoft/TypeScript/issues/45082


`tsc -b -w` is way slower than `tsc -w` when change is detected.

**Steps to reproduce:**

- Run `tsc -b -w --diagnostics` and `tsc -w --diagnostics` in `packages/api`
- Make simple change in `packages/api/stack.ts` file

