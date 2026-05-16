/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { Writable } from 'node:stream'
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import runAll from '../../lib/index.js'
import parseCLIArgs from '../common/parse-cli-args.js'

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Parses arguments, then run specified npm-scripts.
 *
 * @param {string[]} args - Arguments to parse.
 * @param {Writable} stdout - A writable stream to print logs.
 * @param {Writable} stderr - A writable stream to print errors.
 * @returns {Promise<unknown>} A promise which comes to be fulfilled when all npm-scripts are completed.
 * @private
 */
export default function npmRunAll (args, stdout, stderr) {
  try {
    const stdin = process.stdin
    const argv = parseCLIArgs(args, { parallel: false }, { singleMode: true })
    const group = argv.lastGroup

    if (group.patterns.length === 0) {
      return Promise.resolve(null)
    }

    const promise = runAll(
      group.patterns,
      {
        stdout,
        stderr,
        stdin,
        parallel: group.parallel,
        continueOnError: argv.continueOnError,
        printLabel: argv.printLabel,
        printName: argv.printName,
        config: argv.config,
        packageConfig: argv.packageConfig,
        silent: argv.silent,
        arguments: argv.rest,
        npmPath: argv.npmPath,
      }
    )

    if (!argv.silent) {
      promise.catch(
        /**
         * @param {unknown} err - The rejection reason.
         */
        err => {
          const message = err instanceof Error ? err.message : String(err)
          console.error('ERROR:', message)
        }
      )
    }

    return promise
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('ERROR:', message)

    return Promise.reject(err)
  }
}
