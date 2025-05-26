/**
 * @module spawn
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Launches a new process with the given command.
 * This is {@link ./spawn-posix.js:spawn} or {@link ./spawn-win32.js:spawn}
 * @private
 */

export default async function spawn (command, args, options) {
  const spawn = process.platform === 'win32'
    ? (await import('./spawn-win32.js')).default
    : (await import('./spawn-posix.js')).default

  return spawn(command, args, options)
}
