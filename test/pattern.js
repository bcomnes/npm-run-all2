/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import nodeApi from '#lib'
import BufferStream from './lib/buffer-stream.cjs'
import { result, removeResult, runAll, runPar, runSeq } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[pattern] it should run matched tasks if glob like patterns are given.', async () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))
  beforeEach(() => removeResult())

  describe('"test-task:append:*" to "test-task:append:a" and "test-task:append:b"', () => {
    test('Node API', async () => {
      await nodeApi('test-task:append:*')
      assert.strictEqual(result(), 'aabb')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:append:*'])
      assert.strictEqual(result(), 'aabb')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:append:*'])
      assert.strictEqual(result(), 'aabb')
    })

    test('run-p command', async () => {
      await runPar(['test-task:append:*'])
      const validResults = new Set(['abab', 'abba', 'baba', 'baab'])
      const actual = result()
      assert.ok(actual != null, 'result should not be null')
      assert.ok(validResults.has(actual), `Unexpected result: ${actual}`)
    })
  })

  describe('"test-task:append:**" to "test-task:append:a", "test-task:append:a:c", "test-task:append:a:d", and "test-task:append:b"', () => {
    test('Node API', async () => {
      await nodeApi('test-task:append:**')
      assert.strictEqual(result(), 'aaacacadadbb')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:append:**'])
      assert.strictEqual(result(), 'aaacacadadbb')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:append:**'])
      assert.strictEqual(result(), 'aaacacadadbb')
    })
  })

  // should act same way as section above
  describe('"test-task:append:**:*" to "test-task:append:a", "test-task:append:a:c", "test-task:append:a:d", and "test-task:append:b"', () => {
    test('Node API', async () => {
      await nodeApi('test-task:append:**:*')
      assert.strictEqual(result(), 'aaacacadadbb')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:append:**:*'])
      assert.strictEqual(result(), 'aaacacadadbb')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:append:**:*'])
      assert.strictEqual(result(), 'aaacacadadbb')
    })
  })

  describe('(should ignore duplications) "test-task:append:b" "test-task:append:*" to "test-task:append:b", "test-task:append:a"', () => {
    test('Node API', async () => {
      await nodeApi(['test-task:append:b', 'test-task:append:*'])
      assert.strictEqual(result(), 'bbaa')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:append:b', 'test-task:append:*'])
      assert.strictEqual(result(), 'bbaa')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:append:b', 'test-task:append:*'])
      assert.strictEqual(result(), 'bbaa')
    })

    test('run-p command', async () => {
      await runPar(['test-task:append:b', 'test-task:append:*'])

      const actual = result()
      const validResults = new Set(['baba', 'baab', 'abab', 'abba'])

      assert.ok(actual != null, 'result should not be null')
      assert.ok(validResults.has(actual), `Unexpected result: ${actual}`)
    })
  })

  describe('"a" should not match to "test-task:append:a"', () => {
    test('Node API', async () => {
      try {
        await nodeApi('a')
        assert.fail('should not match')
      } catch (err) {
        assert.ok(err instanceof Error, 'err should be an Error')
        assert.match(err.message, /not found/i, `Expected error message to contain 'not found', but got: ${err.message}`)
      }
    })

    test('npm-run-all command', async () => {
      const stderr = new BufferStream()
      try {
        await runAll(['a'], undefined, stderr)
        assert.fail('should not match')
      } catch (_err) {
        assert.match(stderr.value, /not found/i, `Expected stderr to contain 'not found', but got: ${stderr.value}`)
      }
    })

    test('run-s command', async () => {
      const stderr = new BufferStream()
      try {
        await runSeq(['a'], undefined, stderr)
        assert.fail('should not match')
      } catch (_err) {
        assert.match(stderr.value, /not found/i, `Expected stderr to contain 'not found', but got: ${stderr.value}`)
      }
    })

    test('run-p command', async () => {
      const stderr = new BufferStream()
      try {
        await runPar(['a'], undefined, stderr)
        assert.fail('should not match')
      } catch (_err) {
        assert.match(stderr.value, /not found/i, `Expected stderr to contain 'not found', but got: ${stderr.value}`)
      }
    })
  })

  describe('"!test-task:**" is a glob that matches nothing, so it should succeed silently', () => {
    test('Node API', async () => {
      const result = await nodeApi('!test-task:**')
      assert.deepStrictEqual(result, [])
    })

    test('npm-run-all command', async () => {
      await runAll(['!test-task:**'])
    })

    test('run-s command', async () => {
      await runSeq(['!test-task:**'])
    })

    test('run-p command', async () => {
      await runPar(['!test-task:**'])
    })
  })

  describe('"nonexistent:*" is a glob that matches nothing, so it should succeed silently', () => {
    test('Node API', async () => {
      const result = await nodeApi('nonexistent:*')
      assert.deepStrictEqual(result, [])
    })

    test('npm-run-all command', async () => {
      await runAll(['nonexistent:*'])
    })

    test('run-s command', async () => {
      await runSeq(['nonexistent:*'])
    })

    test('run-p command', async () => {
      await runPar(['nonexistent:*'])
    })
  })

  describe('"!test" "?test" to "!test", "?test"', () => {
    test('Node API', async () => {
      await nodeApi(['!test', '?test'])
      const r = result()
      assert.ok(r != null, 'result should not be null')
      assert.strictEqual(r.trim(), 'XQ')
    })

    test('npm-run-all command', async () => {
      await runAll(['!test', '?test'])
      const r = result()
      assert.ok(r != null, 'result should not be null')
      assert.strictEqual(r.trim(), 'XQ')
    })

    test('run-s command', async () => {
      await runSeq(['!test', '?test'])
      const r = result()
      assert.ok(r != null, 'result should not be null')
      assert.strictEqual(r.trim(), 'XQ')
    })

    test('run-p command', async () => {
      await runPar(['!test', '?test'])
      const r = result()
      assert.ok(r != null, 'result should not be null')
      const actual = r.trim()
      assert.ok(actual === 'XQ' || actual === 'QX', `Expected result to be 'XQ' or 'QX', but got: ${actual}`)
    })
  })
})
