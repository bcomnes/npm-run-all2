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
import nodeApi from 'npm-run-all2'
import spawnWithKill from './lib/spawn-with-kill.cjs'
import { delay, result, removeResult, runAll, runSeq } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[sequential] npm-run-all', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => delay(1000).then(removeResult))

  describe('should run tasks sequentially:', () => {
    test('Node API', async () => {
      const results = await nodeApi(['test-task:append a', 'test-task:append b'], { parallel: false })
      assert.strictEqual(results.length, 2)
      assert.strictEqual(results[0].name, 'test-task:append a')
      assert.strictEqual(results[0].code, 0)
      assert.strictEqual(results[1].name, 'test-task:append b')
      assert.strictEqual(results[1].code, 0)
      assert.strictEqual(result(), 'aabb')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:append a', 'test-task:append b'])
      assert.strictEqual(result(), 'aabb')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:append a', 'test-task:append b'])
      assert.strictEqual(result(), 'aabb')
    })
  })

  describe('should not run subsequent tasks if a task exited with a non-zero code:', () => {
    test('Node API', async () => {
      try {
        await nodeApi(['test-task:append2 a', 'test-task:error', 'test-task:append2 b'])
      } catch (err) {
        assert.strictEqual(err.results.length, 3)
        assert.strictEqual(err.results[0].name, 'test-task:append2 a')
        assert.strictEqual(err.results[0].code, 0)
        assert.strictEqual(err.results[1].name, 'test-task:error')
        assert.strictEqual(err.results[1].code, 1)
        assert.strictEqual(err.results[2].name, 'test-task:append2 b')
        assert.strictEqual(err.results[2].code, undefined)
        assert.strictEqual(result(), 'aa')
        return
      }
      assert.fail('should fail')
    })

    test('npm-run-all command', async () => {
      try {
        await runAll(['test-task:append2 a', 'test-task:error', 'test-task:append2 b'])
      } catch (_err) {
        assert.strictEqual(result(), 'aa')
        return
      }
      assert.fail('should fail')
    })

    test('run-s command', async () => {
      try {
        await runSeq(['test-task:append2 a', 'test-task:error', 'test-task:append2 b'])
      } catch (_err) {
        assert.strictEqual(result(), 'aa')
        return
      }
      assert.fail('should fail')
    })
  })

  describe('should remove intersected tasks from two or more patterns:', () => {
    test('Node API', async () => {
      await nodeApi(['test-task:*:a', '*:append:a'], { parallel: false })
      assert.strictEqual(result(), 'aa')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:*:a', '*:append:a'])
      assert.strictEqual(result(), 'aa')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:*:a', '*:append:a'])
      assert.strictEqual(result(), 'aa')
    })
  })

  describe('should not remove duplicate tasks from two or more the same pattern:', () => {
    test('Node API', async () => {
      await nodeApi(['test-task:*:a', 'test-task:*:a'], { parallel: false })
      assert.strictEqual(result(), 'aaaa')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:*:a', 'test-task:*:a'])
      assert.strictEqual(result(), 'aaaa')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:*:a', 'test-task:*:a'])
      assert.strictEqual(result(), 'aaaa')
    })
  })

  describe("should kill child processes when it's killed", () => {
    test('npm-run-all command', async () => {
      await spawnWithKill(
        'node',
        ['../bin/npm-run-all.js', 'test-task:append2 a']
      )
      assert.ok(result() == null || result() === 'a', `Expected result to be null or 'a', but got: ${result()}`)
    })

    test('run-s command', async () => {
      await spawnWithKill(
        'node',
        ['../bin/run-s/index.js', 'test-task:append2 a']
      )
      assert.ok(result() == null || result() === 'a', `Expected result to be null or 'a', but got: ${result()}`)
    })
  })

  describe('should continue on error when --continue-on-error option was specified:', () => {
    test('Node API', async () => {
      try {
        await nodeApi(['test-task:append a', 'test-task:error', 'test-task:append b'], { continueOnError: true })
      } catch (_err) {
        console.log(result()) // TODO: Spurious failures windows
        assert.strictEqual(result(), 'aabb')
        return
      }
      assert(false, 'should fail')
    })

    test('npm-run-all command (--continue-on-error)', async () => {
      try {
        await runAll(['--continue-on-error', 'test-task:append a', 'test-task:error', 'test-task:append b'])
      } catch (_err) {
        assert.strictEqual(result(), 'aabb')
        return
      }
      assert.fail('should fail')
    })

    test('run-s command (--continue-on-error)', async () => {
      try {
        await runSeq(['--continue-on-error', 'test-task:append a', 'test-task:error', 'test-task:append b'])
      } catch (_err) {
        assert.strictEqual(result(), 'aabb')
        return
      }
      assert.fail('should fail')
    })

    test('npm-run-all command (-c)', async () => {
      try {
        await runAll(['-c', 'test-task:append a', 'test-task:error', 'test-task:append b'])
      } catch (_err) {
        assert.strictEqual(result(), 'aabb')
        return
      }
      assert.fail('should fail')
    })

    test('run-s command (-c)', async () => {
      try {
        await runSeq(['-c', 'test-task:append a', 'test-task:error', 'test-task:append b'])
      } catch (_err) {
        assert.strictEqual(result(), 'aabb')
        return
      }
      assert.fail('should fail')
    })
  })
})
