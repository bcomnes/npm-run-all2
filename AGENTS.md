# Agent Guidelines

- Write Markdown prose with one sentence per line. Use one newline between sentences to keep them in the same paragraph; two newlines create a new paragraph.
- Never use inline type imports.
- Always favor `@import` syntax at the top of JavaScript files for JSDoc types.
- Use `npm install --ignore-scripts` to install dependencies; this repository intentionally does not commit a package lockfile.
- Run `npm test` for the complete validation suite and `npm run check` for focused lint and type checks.
- This repository does not require declaration builds during normal development; run them only for publishing or when debugging generated types.
- After running a declaration build, use the existing cleanup scripts and do not leave generated declarations in the working tree.
- Preserve behavior across the supported Node.js versions and Windows, macOS, and Linux.
- When handling PR review comments, validate that each comment is correct before making changes; maintainer comments are almost always valid, but review bot comments may be wrong, and after addressing a comment, always reply with what was done.
