/**
 * @module read-package-json
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const fs = require('fs')
const joinPath = require('path').join
const parseJson5 = require('json5').parse
const parseJson = require('json-parse-even-better-errors')
const normalizePackageData = require('npm-normalize-package-bin')

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Reads the package.json in the current directory.
 *
 * @returns {object} package.json's information.
 */
module.exports = function readPackageJson () {
  try {
    let path = joinPath(process.cwd(), 'package.json5')
    let isJson5 = true

    if (!fs.existsSync(path)) {
      path = joinPath(process.cwd(), 'package.json')
      isJson5 = false
    }

    const rawPkg = fs.readFileSync(path, 'utf8')
    let body = null

    if (isJson5) {
      // Read package.json5
      body = parseJson5(rawPkg)
    } else {
      body = parseJson(rawPkg)
    }

    normalizePackageData(body)
    return Promise.resolve({
      taskList: Object.keys(body.scripts || {}),
      packageInfo: { path, body },
    })
  } catch (err) {
    return Promise.reject(err)
  }
}
