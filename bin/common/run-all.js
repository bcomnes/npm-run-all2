/**
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { NpmRunAllOptions, NpmRunAllResult } from '../../lib/index.js'
 */

import runAll from '#lib'
import readPackageJson from '#lib/read-package-json.js'

/**
 * Resolves CLI-only package settings before invoking the Node API.
 *
 * @param {string[]} patterns - Script patterns to run.
 * @param {NpmRunAllOptions} options - Parsed CLI options.
 * @returns {Promise<null | NpmRunAllResult[]>} Task results.
 */
export default async function runAllWithPackageConfig (patterns, options) {
  const { packageInfo } = await readPackageJson()
  const config = packageInfo.body['npm-run-all2']
  const packageNodeRun = config != null &&
    typeof config === 'object' &&
    !Array.isArray(config) &&
    'nodeRun' in config &&
    config.nodeRun === true

  return runAll(patterns, {
    ...options,
    nodeRun: options.nodeRun === true || packageNodeRun,
  })
}
