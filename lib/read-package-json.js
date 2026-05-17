/**
 * @module read-package-json
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { PackageInfo } from './index.js'
 */

/**
 * @typedef ReadPackageJsonResult
 * @property {string[]} taskList - npm script names.
 * @property {PackageInfo} packageInfo - package.json metadata.
 */

import readPackage from 'read-package-json-fast'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import { join as joinPath } from 'path'

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Reads the package.json in the current directory.
 *
 * @returns {Promise<ReadPackageJsonResult>} package.json's information.
 */
export default function readPackageJson () {
  const path = joinPath(process.cwd(), 'package.json')
  return readPackage(path).then(body => ({
    taskList: Object.keys(body.scripts || {}),
    packageInfo: { path, body },
  }))
}
