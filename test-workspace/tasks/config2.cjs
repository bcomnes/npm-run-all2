'use strict'

const appendResult = require('./lib/util.cjs').appendResult
appendResult(`${process.env.npm_config_test}\n${process.env.npm_config_test2}\n${process.env.npm_config_test3}`)
