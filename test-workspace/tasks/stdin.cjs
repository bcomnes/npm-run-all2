'use strict'

const appendResult = require('./lib/util.cjs').appendResult

process.stdin.on('data', (chunk) => {
  appendResult(chunk.toString())
  process.exit(0)
})
setTimeout(() => {
  process.exit(1)
}, 5000)
