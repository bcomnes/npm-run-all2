/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const spawn = require('../../lib/spawn').default

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<unknown>}
 */
module.exports = async function spawnWithKill (command, args) {
  const cp = await spawn(command, args, {})
  return await new Promise((resolve, reject) => {
    cp.on('exit', resolve)
    cp.on('error', reject)
    setTimeout(() => cp.kill(), 1000)
  })
}
