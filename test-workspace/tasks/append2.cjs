'use strict'

const appendResult = require('./lib/util.cjs').appendResult

appendResult(process.argv[2])
setTimeout(() => {
  appendResult(process.argv[2])
  process.exit(0)
}, 3000)

// SIGINT/SIGTERM Handling.
process.on('SIGINT', () => {
  process.exit(0)
})
process.on('SIGTERM', () => {
  process.exit(0)
})
