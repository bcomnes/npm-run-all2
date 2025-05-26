/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
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

module.exports = function spawnWithKill (command, args) {
  return new Promise((resolve, reject) => {
    const cp = spawn(command, args, {})
    cp.on('exit', resolve)
    cp.on('error', reject)

    setTimeout(() => cp.kill(), 1000)
  })
}
