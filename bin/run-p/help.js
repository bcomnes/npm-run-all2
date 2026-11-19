/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { Writable } from 'node:stream'
 */

import { getOptionsHelp } from '../common/help.js'

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Print a help text.
 *
 * @param {Writable} output - A writable stream to print.
 * @returns {Promise<null>} Always a fulfilled promise.
 * @private
 */
export default function printHelp (output) {
  output.write(`
Usage:
    $ run-p [--help | -h | --version | -v]
    $ run-p [OPTIONS] <tasks>

    Run given npm-scripts in parallel.

    <tasks> : A list of npm-scripts' names and Glob-like patterns.

Options:
${getOptionsHelp('run-p')}
    Shorthand aliases can be combined.
    For example, '-clns' equals to '-c -l -n -s'.

Examples:
    $ run-p watch:**
    $ run-p --print-label "build:** -- --watch"
    $ run-p -sl "build:** -- --watch"
    $ run-p start-server start-browser start-electron

See Also:
    https://github.com/bcomnes/npm-run-all2#readme
`)

  return Promise.resolve(null)
}
