const mod = require('node:module')

// to use V8's code cache to speed up instantiation time
mod.enableCompileCache?.()

const { default: npmRunAll } = require('./esm.mjs')

// Didn't manage to get this into the last breaking change, so adding a cjs as the primary export
// maintains a compatible layer for cjs consumers. If we export esm by default, the best cjs can
// get is a default export field (breaking).
//
// TODO: Next breaking change, drop this file in favor of a named ESM export.
//
// ESM consumers can import 'npm-run-all2/esm.js' directly if they want to bypass this indirect.
module.exports = npmRunAll
