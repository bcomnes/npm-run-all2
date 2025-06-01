'use strict'

const appendResult = require('./lib/util.cjs').appendResult
appendResult(String(process.env.npm_package_config_test))
