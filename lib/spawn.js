/**
 * @module spawn
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { ChildProcess, SpawnOptions } from 'node:child_process'
 */

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Launches a new process with the given command.
 * This is {@link ./spawn-posix.js:spawn} or {@link ./spawn-win32.js:spawn}
 * @private
 */

/**
 * @param {string} command - The command to run.
 * @param {string[]} args - List of string arguments.
 * @param {SpawnOptions} options - Options.
 * @returns {Promise<ChildProcess>}
 */
export default async function spawn (command, args, options) {
  const spawn = process.platform === 'win32'
    ? (await import('./spawn-win32.js')).default
    : (await import('./spawn-posix.js')).default

  return spawn(command, args, options)
}
