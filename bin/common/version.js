/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Print a version text.
 *
 * @param {stream.Writable} output - A writable stream to print.
 * @returns {Promise} Always a fulfilled promise.
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
