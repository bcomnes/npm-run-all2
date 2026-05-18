/**
 * @author Bret Comnes
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import nodeApi from '#lib'
import { delay, result, removeResult, runAll, runPar, runSeq } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[node-run]', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => delay(1000).then(removeResult))

  describe('should run tasks sequentially with --node-run:', () => {
    test('Node API', async () => {
      const results = await nodeApi(
        ['test-task:append a', 'test-task:append b'],
        { parallel: false, nodeRun: true }
      )
      assert.ok(results != null)
      assert.strictEqual(results.length, 2)
      assert.strictEqual(results[0]?.code, 0)
      assert.strictEqual(results[1]?.code, 0)
      assert.strictEqual(result(), 'aabb')
    })

    test('run-s command (--node-run)', async () => {
      await runSeq(['--node-run', 'test-task:append a', 'test-task:append b'])
      assert.strictEqual(result(), 'aabb')
    })

    test('run-s command (-x)', async () => {
      await runSeq(['-x', 'test-task:append a', 'test-task:append b'])
      assert.strictEqual(result(), 'aabb')
    })

    test('npm-run-all command (--node-run)', async () => {
      await runAll(['--node-run', 'test-task:append a', 'test-task:append b'])
      assert.strictEqual(result(), 'aabb')
    })
  })

  describe('should run tasks in parallel with --node-run:', () => {
    /** @param {string | null} r */
    function assertParallelResult (r) {
      assert.ok(
        r === 'abab' || r === 'baba' || r === 'abba' || r === 'baab',
        `Expected interleaved parallel output but got: ${r}`
      )
    }

    test('Node API', async () => {
      const results = await nodeApi(
        ['test-task:append a', 'test-task:append b'],
        { parallel: true, nodeRun: true }
      )
      assert.ok(results != null)
      assert.strictEqual(results.length, 2)
      assert.ok(results.every(r => r.code === 0))
      assertParallelResult(result())
    })

    test('run-p command (--node-run)', async () => {
      await runPar(['--node-run', 'test-task:append a', 'test-task:append b'])
      assertParallelResult(result())
    })

    test('run-p command (-x)', async () => {
      await runPar(['-x', 'test-task:append a', 'test-task:append b'])
      assertParallelResult(result())
    })

    test('npm-run-all command (-p --node-run)', async () => {
      await runAll(['-p', '--node-run', 'test-task:append a', 'test-task:append b'])
      assertParallelResult(result())
    })
  })

  describe('should not run pre/post lifecycle scripts with --node-run:', () => {
    test('Node API', async () => {
      const results = await nodeApi(
        ['test-task:node-run-lifecycle'],
        { parallel: false, nodeRun: true }
      )
      assert.ok(results != null)
      assert.strictEqual(results[0]?.code, 0)
      // With npm, pre/post hooks would produce "premainpost". node --run skips them.
      assert.strictEqual(result(), 'main')
    })

    test('run-s command', async () => {
      await runSeq(['--node-run', 'test-task:node-run-lifecycle'])
      assert.strictEqual(result(), 'main')
    })
  })
})
