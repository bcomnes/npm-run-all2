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

      assert.ok(validResults.has(actual), `Unexpected result: ${actual}`)
    })
  })

  describe('"a" should not match to "test-task:append:a"', () => {
    test('Node API', async () => {
      try {
        await nodeApi('a')
        assert.fail('should not match')
      } catch (err) {
        assert.match(err.message, /not found/i, `Expected error message to contain 'not found', but got: ${err.message}`)
      }
    })

    test('npm-run-all command', async () => {
      const stderr = new BufferStream()
      try {
        await runAll(['a'], null, stderr)
        assert.fail('should not match')
      } catch (_err) {
        assert.match(stderr.value, /not found/i, `Expected stderr to contain 'not found', but got: ${stderr.value}`)
      }
    })

    test('run-s command', async () => {
      const stderr = new BufferStream()
      try {
        await runSeq(['a'], null, stderr)
        assert.fail('should not match')
      } catch (_err) {
        assert.match(stderr.value, /not found/i, `Expected stderr to contain 'not found', but got: ${stderr.value}`)
      }
    })

    test('run-p command', async () => {
      const stderr = new BufferStream()
      try {
        await runPar(['a'], null, stderr)
        assert.fail('should not match')
      } catch (_err) {
        assert.match(stderr.value, /not found/i, `Expected stderr to contain 'not found', but got: ${stderr.value}`)
      }
    })
  })

  describe('"!test-task:**" should not match to anything', () => {
    test('Node API', async () => {
      try {
        await nodeApi('!test-task:**')
        assert.fail('should not match')
      } catch (err) {
        assert.match(err.message, /not found/i, `Expected error message to contain 'not found', but got: ${err.message}`)
      }
    })

    test('npm-run-all command', async () => {
      const stderr = new BufferStream()
      try {
        await runAll(['!test-task:**'], null, stderr)
        assert.fail('should not match')
      } catch (_err) {
        assert.match(stderr.value, /not found/i, `Expected stderr to contain 'not found', but got: ${stderr.value}`)
      }
    })

    test('run-s command', async () => {
      const stderr = new BufferStream()
      try {
        await runSeq(['!test-task:**'], null, stderr)
        assert.fail('should not match')
      } catch (_err) {
        assert.match(stderr.value, /not found/i, `Expected stderr to contain 'not found', but got: ${stderr.value}`)
      }
    })

    test('run-p command', async () => {
      const stderr = new BufferStream()
      try {
        await runPar(['!test-task:**'], null, stderr)
        assert.fail('should not match')
      } catch (_err) {
        assert.match(stderr.value, /not found/i, `Expected stderr to contain 'not found', but got: ${stderr.value}`)
      }
    })
  })

  describe('"!test" "?test" to "!test", "?test"', () => {
    test('Node API', async () => {
      await nodeApi(['!test', '?test'])
      assert.strictEqual(result().trim(), 'XQ')
    })

    test('npm-run-all command', async () => {
      await runAll(['!test', '?test'])
      assert.strictEqual(result().trim(), 'XQ')
    })

    test('run-s command', async () => {
      await runSeq(['!test', '?test'])
      assert.strictEqual(result().trim(), 'XQ')
    })

    test('run-p command', async () => {
      await runPar(['!test', '?test'])
      const actual = result().trim()
      assert.ok(actual === 'XQ' || actual === 'QX', `Expected result to be 'XQ' or 'QX', but got: ${actual}`)
    })
  })
})
