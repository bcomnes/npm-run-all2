/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import runAll from 'npm-run-all2'
import parseCLIArgs from '../common/parse-cli-args.js'

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Parses arguments, then run specified npm-scripts.
 *
 * @param {string[]} args - Arguments to parse.
 * @param {stream.Writable} stdout - A writable stream to print logs.
 * @param {stream.Writable} stderr - A writable stream to print errors.
 * @returns {Promise} A promise which comes to be fulfilled when all npm-scripts are completed.
 * @private
 */
export default function npmRunAll (args, stdout, stderr) {
  try {
    const stdin = process.stdin
    const argv = parseCLIArgs(args, { parallel: true }, { singleMode: true })
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
        maxParallel: argv.maxParallel,
        continueOnError: argv.continueOnError,
        printLabel: argv.printLabel,
        printName: argv.printName,
        config: argv.config,
        packageConfig: argv.packageConfig,
        silent: argv.silent,
        arguments: argv.rest,
        race: argv.race,
        npmPath: argv.npmPath,
        aggregateOutput: argv.aggregateOutput,
      }
    )

    if (!argv.silent) {
      promise.catch(err => {
        console.error('ERROR:', err.message)
      })
    }

    return promise
  } catch (err) {
    console.error('ERROR:', err.message)

    return Promise.reject(err)
  }
}
