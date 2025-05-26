/**
 * @module read-package-json
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
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
 * @returns {object} package.json's information.
 */
export default function readPackageJson () {
  const path = joinPath(process.cwd(), 'package.json')
  return readPackage(path).then(body => ({
    taskList: Object.keys(body.scripts || {}),
    packageInfo: { path, body },
  }))
}
