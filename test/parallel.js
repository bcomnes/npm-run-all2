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
import { delay, result, removeResult, runAll, runPar } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[parallel]', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => removeResult())

  describe('should run tasks on parallel when was given --parallel option:', () => {
    test('Node API', async () => {
      const results = await nodeApi(['test-task:append a', 'test-task:append b'], { parallel: true })
      assert.strictEqual(results.length, 2)
      assert.strictEqual(results[0].name, 'test-task:append a')
      assert.strictEqual(results[0].code, 0)
      assert.strictEqual(results[1].name, 'test-task:append b')
      assert.strictEqual(results[1].code, 0)
      assert.ok(
        result() === 'abab' ||
                result() === 'baba' ||
                result() === 'abba' ||
                result() === 'baab',
        `Expected result to match one of the patterns but got: ${result()}`
      )
    })

    test('npm-run-all command', async () => {
      await runAll(['--parallel', 'test-task:append a', 'test-task:append b'])
      assert.ok(
        result() === 'abab' ||
                result() === 'baba' ||
                result() === 'abba' ||
                result() === 'baab',
        `Expected result to match one of the patterns but got: ${result()}`
      )
    })

    test('run-p command', async () => {
      await runPar(['test-task:append a', 'test-task:append b'])
      assert.ok(
        result() === 'abab' ||
                result() === 'baba' ||
                result() === 'abba' ||
                result() === 'baab',
        `Expected result to match one of the patterns but got: ${result()}`
      )
    })
  })

  describe('should kill all tasks when was given --parallel option if a task exited with a non-zero code:', () => {
    test('Node API', async () => {
      try {
        await nodeApi(['test-task:append2 a', 'test-task:error'], { parallel: true })
      } catch (err) {
        assert.strictEqual(err.results.length, 2)
        assert.strictEqual(err.results[0].name, 'test-task:append2 a')
        assert.strictEqual(err.results[0].code, undefined)
        assert.strictEqual(err.results[1].name, 'test-task:error')
        assert.strictEqual(err.results[1].code, 1)
        assert.ok(result() == null || result() === 'a', `Expected result to be null or 'a', but got: ${result()}`)
        return
      }
      assert.fail('should fail')
    })

    test('npm-run-all command', async () => {
      try {
        await runAll(['--parallel', 'test-task:append2 a', 'test-task:error'])
      } catch (_err) {
        assert.ok(result() == null || result() === 'a', `Expected result to be null or 'a', but got: ${result()}`)
        return
      }
      assert.fail('should fail')
    })

    test('run-p command', async () => {
      try {
        await runPar(['test-task:append2 a', 'test-task:error'])
      } catch (_err) {
        assert.ok(result() == null || result() === 'a', `Expected result to be null or 'a', but got: ${result()}`)
        return
      }
      assert.fail('should fail')
    })
  })

  describe('should remove intersected tasks from two or more patterns:', () => {
    test('Node API', async () => {
      await nodeApi(['test-task:*:a', '*:append:a'], { parallel: true })
      assert.strictEqual(result(), 'aa')
    })

    test('npm-run-all command', async () => {
      await runAll(['--parallel', 'test-task:*:a', '*:append:a'])
      assert.strictEqual(result(), 'aa')
    })

    test('run-p command', async () => {
      await runPar(['test-task:*:a', '*:append:a'])
      assert.strictEqual(result(), 'aa')
    })
  })

  describe('should not remove duplicate tasks from two or more the same pattern:', () => {
    test('Node API', async () => {
      await nodeApi(['test-task:*:a', 'test-task:*:a'], { parallel: true })
      assert.strictEqual(result(), 'aaaa')
    })

    test('npm-run-all command', async () => {
      await runAll(['--parallel', 'test-task:*:a', 'test-task:*:a'])
      assert.strictEqual(result(), 'aaaa')
    })

    test('run-p command', async () => {
      await runPar(['test-task:*:a', 'test-task:*:a'])
      assert.strictEqual(result(), 'aaaa')
    })
  })

  describe("should kill child processes when it's killed", () => {
    test('npm-run-all command', async () => {
      await spawnWithKill(
        'node',
        ['../bin/npm-run-all/index.js', '--parallel', 'test-task:append2 a']
      )
      assert.ok(result() == null || result() === 'a', `Expected result to be null or 'a', but got: ${result()}`)
    })

    test('run-p command', async () => {
      await spawnWithKill(
        'node',
        ['../bin/run-p/index.js', 'test-task:append2 a']
      )
      assert.ok(result() == null || result() === 'a', `Expected result to be null or 'a', but got: ${result()}`)
    })
  })

  describe('should continue on error when --continue-on-error option was specified:', () => {
    test('Node API', async () => {
      try {
        await nodeApi(['test-task:append a', 'test-task:error', 'test-task:append b'], { parallel: true, continueOnError: true })
      } catch (_err) {
        console.log(result()) // TODO: This is randomly failing
        assert.ok(
          result() === 'abab' ||
                    result() === 'baba' ||
                    result() === 'abba' ||
                    result() === 'baab',
          `Expected result to match one of the patterns but got: ${result()}`
        )
        return
      }
      assert.fail('should fail.')
    })

    test('npm-run-all command (--continue-on-error)', async () => {
      try {
        await runAll(['--continue-on-error', '--parallel', 'test-task:append a', 'test-task:error', 'test-task:append b'])
      } catch (_err) {
        assert.ok(
          result() === 'abab' ||
                    result() === 'baba' ||
                    result() === 'abba' ||
                    result() === 'baab',
          `Expected result to match one of the patterns but got: ${result()}`
        )
        return
      }
      assert.fail('should fail.')
    })

    test('npm-run-all command (-c)', async () => {
      try {
        await runAll(['-cp', 'test-task:append a', 'test-task:error', 'test-task:append b'])
      } catch (_err) {
        assert.ok(
          result() === 'abab' ||
                    result() === 'baba' ||
                    result() === 'abba' ||
                    result() === 'baab',
          `Expected result to match one of the patterns but got: ${result()}`
        )
        return
      }
      assert.fail('should fail.')
    })

    test('run-p command (--continue-on-error)', async () => {
      try {
        await runPar(['--continue-on-error', 'test-task:append a', 'test-task:error', 'test-task:append b'])
      } catch (_err) {
        assert.ok(
          result() === 'abab' ||
                    result() === 'baba' ||
                    result() === 'abba' ||
                    result() === 'baab',
          `Expected result to match one of the patterns but got: ${result()}`
        )
        return
      }
      assert.fail('should fail.')
    })

    test('run-p command (-c)', async () => {
      try {
        await runPar(['-c', 'test-task:append a', 'test-task:error', 'test-task:append b'])
      } catch (_err) {
        assert.ok(
          result() === 'abab' ||
                    result() === 'baba' ||
                    result() === 'abba' ||
                    result() === 'baab',
          `Expected result to match one of the patterns but got: ${result()}`
        )
        return
      }
      assert.fail('should fail.')
    })
  })

  describe('should abort other tasks when a task finished, when --race option was specified:', () => {
    test('Node API', async () => {
      await nodeApi(['test-task:append1 a', 'test-task:append2 b'], { parallel: true, race: true })
      await delay(5000)
      assert.ok(result() === 'a' || result() === 'ab' || result() === 'ba', `Expected result to be 'a', 'ab' or 'ba', but got: ${result()}`)
    })

    test('npm-run-all command (--race)', async () => {
      await runAll(['--race', '--parallel', 'test-task:append1 a', 'test-task:append2 b'])
      await delay(5000)
      assert.ok(result() === 'a' || result() === 'ab' || result() === 'ba', `Expected result to be 'a', 'ab' or 'ba', but got: ${result()}`)
    })

    test('npm-run-all command (-r)', async () => {
      await runAll(['-rp', 'test-task:append1 a', 'test-task:append2 b'])
      await delay(5000)
      assert.ok(result() === 'a' || result() === 'ab' || result() === 'ba', `Expected result to be 'a', 'ab' or 'ba', but got: ${result()}`)
    })

    test('run-p command (--race)', async () => {
      await runPar(['--race', 'test-task:append1 a', 'test-task:append2 b'])
      await delay(5000)
      assert.ok(result() === 'a' || result() === 'ab' || result() === 'ba', `Expected result to be 'a', 'ab' or 'ba', but got: ${result()}`)
    })

    test('run-p command (-r)', async () => {
      await runPar(['-r', 'test-task:append1 a', 'test-task:append2 b'])
      await delay(5000)
      assert.ok(result() === 'a' || result() === 'ab' || result() === 'ba', `Expected result to be 'a', 'ab' or 'ba', but got: ${result()}`)
    })

    test('run-p command (no -r)', async () => {
      await runPar(['test-task:append1 a', 'test-task:append2 b'])
      await delay(5000)
      assert.ok(result() === 'abb' || result() === 'bab', `Expected result to be 'abb' or 'bab', but got: ${result()}`)
    })
  })

  describe('should run tasks in parallel-2 when was given --max-parallel 2 option:', () => {
    test('Node API', async () => {
      const results = await nodeApi(['test-task:append a', 'test-task:append b', 'test-task:append c'], { parallel: true, maxParallel: 2 })
      assert.strictEqual(results.length, 3)
      assert.strictEqual(results[0].name, 'test-task:append a')
      assert.strictEqual(results[0].code, 0)
      assert.strictEqual(results[1].name, 'test-task:append b')
      assert.strictEqual(results[1].code, 0)
      assert.strictEqual(results[2].name, 'test-task:append c')
      assert.strictEqual(results[2].code, 0)
      assert.ok(
        result() === 'ababcc' ||
                result() === 'babacc' ||
                result() === 'abbacc' ||
                result() === 'baabcc',
        `Expected result to match one of the patterns but got: ${result()}`
      )
    })

    test('npm-run-all command', async () => {
      await runAll(['--parallel', 'test-task:append a', 'test-task:append b', 'test-task:append c', '--max-parallel', '2'])
      assert.ok(
        result() === 'ababcc' ||
                result() === 'babacc' ||
                result() === 'abbacc' ||
                result() === 'baabcc',
        `Expected result to match one of the patterns but got: ${result()}`
      )
    })

    test('run-p command', async () => {
      await runPar(['test-task:append a', 'test-task:append b', 'test-task:append c', '--max-parallel', '2'])
      assert.ok(
        result() === 'ababcc' ||
                result() === 'babacc' ||
                result() === 'abbacc' ||
                result() === 'baabcc',
        `Expected result to match one of the patterns but got: ${result()}`
      )
    })
  })
})
