const { npmRunAll } = require('./esm.mjs')

// Didn't manage to get this ito the last breaking change, so adding a cjs as the primary export
// maintiains a compatible layer for cjs consumers. If we export esm by default, the best cjs can
// get is a default exoport field (breaking).
//
// TODO: Next breaking change, drop this file in favor of a named ESM export.
//
// ESM consumers can import 'npm-run-all2/esm.js' directly if they want to bypass this indirect.
module.exports = npmRunAll
