/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import BufferStream from './lib/buffer-stream.cjs'
import { result, removeResult } from './lib/util.cjs'
import spawn from 'cross-spawn'

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

/**
 * Execute a command.
 * @param {string} command A command to execute.
 * @param {string[]} args Arguments for the command.
 * @returns {Promise<void>} The result of child process's stdout.
 */
function exec (command, args) {
  return new Promise((resolve, reject) => {
    const stderr = new BufferStream()
    const cp = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] })

    cp.stderr.pipe(stderr)
    cp.on('exit', (exitCode) => {
      if (exitCode) {
        reject(new Error(`Exited with ${exitCode}: ${stderr.value}`))
        return
      }
      resolve()
    })
    cp.on('error', reject)
  })
}

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[yarn]', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => removeResult())

  describe("'yarn run' command", () => {
    test("should run 'npm-run-all' in scripts with yarn.", async () => {
      await exec('yarn', ['run', 'test-task:yarn'])
      assert.strictEqual(result(), 'aabb')
    })
  })
})
