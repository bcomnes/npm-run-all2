'use strict'

const appendResult = require('./lib/util.cjs').appendResult
appendResult(JSON.stringify(process.argv.slice(2)))
