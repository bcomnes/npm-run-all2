/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { Writable } from 'node:stream'
 */

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const __dirname = import.meta.dirname

/**
 * Print a version text.
 *
 * @param {Writable} output - A writable stream to print.
 * @returns {Promise<null>} Always a fulfilled promise.
 * @private
 */
export default async function printVersion (output) {
  const packageJson = JSON.parse(
    await readFile(resolve(__dirname, '../../package.json'), 'utf8')
  )
  const version = packageJson.version

  output.write(`v${version}\n`)

  return Promise.resolve(null)
}
