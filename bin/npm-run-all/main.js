/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { Writable } from 'node:stream'
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import runAll from '#lib'
import parseCLIArgs from '#bin/common/parse-cli-args.js'

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
    const argv = parseCLIArgs(args)

    const promise = argv.groups.reduce(
      (prev, group) => {
        if (group.patterns.length === 0) {
          return prev
        }
        return prev.then(() => runAll(
          group.patterns,
          {
            stdout,
            stderr,
            stdin,
            parallel: group.parallel,
            maxParallel: group.parallel ? argv.maxParallel : 1,
            continueOnError: argv.continueOnError,
            printLabel: argv.printLabel,
            printName: argv.printName,
            config: argv.config,
            packageConfig: argv.packageConfig,
            silent: argv.silent,
            arguments: argv.rest,
            race: group.parallel && argv.race,
            npmPath: argv.npmPath,
            aggregateOutput: group.parallel && argv.aggregateOutput,
            nodeRun: argv.nodeRun,
            colorMode: argv.colorMode,
          }
        ))
      },
      /** @type {Promise<unknown>} */ (Promise.resolve(null))
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
