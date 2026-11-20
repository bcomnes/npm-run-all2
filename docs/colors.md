# Preserving colors in child tools

Some tools stop coloring their output when it is connected to a pipe instead of a terminal (TTY).
`--print-label` uses pipes to add labels to child stdout and stderr.
`--aggregate-output` buffers child stdout through a pipe.
It does not buffer stderr, but some tools check stdout to decide whether to color either stream.
The Node API options `printLabel` and `aggregateOutput` work the same way.

`npm-run-all2` preserves the ANSI colors that child tools produce.
It does not set `FORCE_COLOR`, add tool-specific flags, or create a pseudo-terminal.
The `--color-mode` option only controls task label colors.

## Using `FORCE_COLOR`

Many tools support the `FORCE_COLOR` environment variable to enable colors even when output is piped.
Set it before running `npm-run-all`, `run-p`, or `run-s` so child tools inherit it:

```sh
FORCE_COLOR=1 run-p --aggregate-output 'lint:*'
```

Check for conflicting settings such as `NO_COLOR`, `NODE_DISABLE_COLORS`, and `--no-color`.
Different tools handle these settings differently, so `FORCE_COLOR=1` does not always take priority.
Do not assume `FORCE_COLOR=0` disables colors either.
Some color libraries treat any value, or the presence of the variable, as a request to enable colors.

## Tool-specific options

Add tool-specific flags to the script that runs the tool, not to `npm-run-all` itself:

```json
{
  "scripts": {
    "lint:types": "tsc --noEmit --pretty true",
    "lint:js": "eslint --color .",
    "lint": "run-p --aggregate-output lint:*"
  }
}
```

The following notes are based on upstream documentation and source code, not runtime tests.
Behavior can differ between versions and with custom formatters, reporters, or plugins.

| Tool | How to force colors | Notes |
| --- | --- | --- |
| [TypeScript `tsc`][typescript-pretty] | `tsc --pretty true`, or `"pretty": true` in `compilerOptions` | In [TypeScript 5.9.3][typescript-source], pretty diagnostics are only automatic when stdout is a TTY and `NO_COLOR` is not set. `FORCE_COLOR` does not control diagnostic colors. Pretty output also adds source context. |
| [Vitest][vitest-source] | `FORCE_COLOR=1 vitest run` or `vitest run --color` | Vitest 4.0.0 reporters use [tinyrainbow 3.0.3][tinyrainbow-source]. `NO_COLOR` or `--no-color` still wins. Live summaries and keyboard shortcuts need a real terminal. Use `--reporter=verbose` for more detail. |
| [es-check][es-check-source] | None for piped stdout in 9.8.1 and 9.9.0 | These versions check for a TTY before `FORCE_COLOR`. `--noColor` and `--no-color` can only disable colors. [Version 7.2.1][es-check-older] supports `FORCE_COLOR=1`. |
| [ESLint][eslint-color] | `eslint --color`, or `FORCE_COLOR=1` with the default formatter | Custom formatters may handle colors differently. |
| [Stylelint][stylelint-color] | `stylelint --color`, or `FORCE_COLOR=1` | Custom formatters may handle colors differently. |
| [Vite][vite-source] | `FORCE_COLOR=1` | Uses [picocolors][picocolors-source], where a nonempty `NO_COLOR` wins. Vite does not document a `--color` flag. |
| [Rollup][rollup-source] | Colors are on by default | Does not require a TTY, so piped output may already have colors. `FORCE_COLOR=0` or a nonempty `NO_COLOR` disables them. Diagnostics go to stderr. |
| [Prettier][prettier-source] | `prettier --color`, or `FORCE_COLOR=1` | Only affects diagnostic messages, not formatted source. A nonempty `NO_COLOR` or `--no-color` wins. |

For tools without a working override, report the color-detection limitation upstream.
Forcing colors does not restore interactive features or progress displays.
When reporting missing colors, include the tool version, formatter or reporter, environment variables, and affected stream.
Also mention whether `--print-label`, `--aggregate-output`, or both are enabled.

[typescript-pretty]: https://www.typescriptlang.org/tsconfig/pretty.html
[typescript-source]: https://github.com/microsoft/TypeScript/blob/v5.9.3/src/compiler/executeCommandLine.ts
[vitest-source]: https://github.com/vitest-dev/vitest/blob/v4.0.0/packages/vitest/src/node/reporters/base.ts
[tinyrainbow-source]: https://github.com/tinylibs/tinyrainbow/blob/v3.0.3/src/index.ts
[es-check-source]: https://github.com/yowainwright/es-check/blob/v9.9.0/lib/core/logger.js
[es-check-older]: https://github.com/yowainwright/es-check/blob/7.2.1/index.js
[eslint-color]: https://eslint.org/docs/latest/use/command-line-interface#--color-and---no-color
[stylelint-color]: https://stylelint.io/user-guide/options/#color
[vite-source]: https://github.com/vitejs/vite/blob/main/packages/vite/src/node/logger.ts
[picocolors-source]: https://github.com/alexeyraspopov/picocolors/blob/main/picocolors.js
[rollup-source]: https://github.com/rollup/rollup/blob/master/src/utils/colors.ts
[prettier-source]: https://github.com/prettier/prettier/blob/main/src/cli/logger.js
