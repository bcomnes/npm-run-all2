/**
 * @module spawn-win32
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { ChildProcess, SpawnOptions } from 'node:child_process'
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import crossSpawn from 'cross-spawn'

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

/**
 * Kills the new process and its sub processes forcibly.
 * @this {ChildProcess}
 * @returns {boolean}
 */
function kill () {
  if (this.pid == null) {
    return false
  }
  crossSpawn('taskkill', ['/F', '/T', '/PID', String(this.pid)])
  return true
}

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Launches a new process with the given command.
 * This is almost same as `child_process.spawn`.
 *
 * This returns a `ChildProcess` instance.
 * `kill` method of the instance kills the new process and its sub processes forcibly.
 *
 * @param {string} command - The command to run.
 * @param {string[]} args - List of string arguments.
 * @param {SpawnOptions} options - Options.
 * @returns {ChildProcess} A ChildProcess instance of new process.
 * @private
 */
export default function spawn (command, args, options) {
  const child = crossSpawn(command, args, options)
  child.kill = kill

  return child
}
