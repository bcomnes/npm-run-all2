/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import nodeApi from 'npm-run-all2'
import BufferStream from './lib/buffer-stream.cjs'
import { runAll, runPar, runSeq } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[print-label] npm-run-all', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  describe('should print labels at the head of every line:', () => {
    const EXPECTED_TEXT = [
      '[test-task:echo abc] abcabc',
      '[test-task:echo abc] abc',
      '[test-task:echo abc] abcabc',
      '[test-task:echo abc] abc',
      '[test-task:echo abc] abc',
      '[test-task:echo abc] abc',
      '[test-task:echo abc] abc',
      '[test-task:echo abc] abc',
      '[test-task:echo abc] ',
      '[test-task:echo abc] abc',
      '[test-task:echo abc] abcabc',
      '[test-task:echo abc] ',
      '[test-task:echo abc] ',
      '[test-task:echo abc] ',
      '[test-task:echo abc] abc',
    ].join('\n')

    test('Node API', async () => {
      const stdout = new BufferStream()
      await nodeApi('test-task:echo abc', { stdout, silent: true, printLabel: true })
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })

    test('npm-run-all command (--print-label)', async () => {
      const stdout = new BufferStream()
      await runAll(['test-task:echo abc', '--silent', '--print-label'], stdout)
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })

    test('run-s command (--print-label)', async () => {
      const stdout = new BufferStream()
      await runSeq(['test-task:echo abc', '--silent', '--print-label'], stdout)
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })

    test('run-p command (--print-label)', async () => {
      const stdout = new BufferStream()
      await runPar(['test-task:echo abc', '--silent', '--print-label'], stdout)
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })

    test('npm-run-all command (-l)', async () => {
      const stdout = new BufferStream()
      await runAll(['test-task:echo abc', '--silent', '-l'], stdout)
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })

    test('run-s command (-l)', async () => {
      const stdout = new BufferStream()
      await runSeq(['test-task:echo abc', '--silent', '-l'], stdout)
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })

    test('run-p command (-l)', async () => {
      const stdout = new BufferStream()
      await runPar(['test-task:echo abc', '--silent', '-l'], stdout)
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })
  })

  describe('should print all labels with the same width:', () => {
    const EXPECTED_TEXT = [
      '[test-task:echo a   ] aa',
      '[test-task:echo a   ] a',
      '[test-task:echo a   ] aa',
      '[test-task:echo a   ] a',
      '[test-task:echo a   ] a',
      '[test-task:echo a   ] a',
      '[test-task:echo a   ] a',
      '[test-task:echo a   ] a',
      '[test-task:echo a   ] ',
      '[test-task:echo a   ] a',
      '[test-task:echo a   ] aa',
      '[test-task:echo a   ] ',
      '[test-task:echo a   ] ',
      '[test-task:echo a   ] ',
      '[test-task:echo a   ] a',
      '[test-task:echo abcd] abcdabcd',
      '[test-task:echo abcd] abcd',
      '[test-task:echo abcd] abcdabcd',
      '[test-task:echo abcd] abcd',
      '[test-task:echo abcd] abcd',
      '[test-task:echo abcd] abcd',
      '[test-task:echo abcd] abcd',
      '[test-task:echo abcd] abcd',
      '[test-task:echo abcd] ',
      '[test-task:echo abcd] abcd',
      '[test-task:echo abcd] abcdabcd',
      '[test-task:echo abcd] ',
      '[test-task:echo abcd] ',
      '[test-task:echo abcd] ',
      '[test-task:echo abcd] abcd',
      '[test-task:echo ab  ] abab',
      '[test-task:echo ab  ] ab',
      '[test-task:echo ab  ] abab',
      '[test-task:echo ab  ] ab',
      '[test-task:echo ab  ] ab',
      '[test-task:echo ab  ] ab',
      '[test-task:echo ab  ] ab',
      '[test-task:echo ab  ] ab',
      '[test-task:echo ab  ] ',
      '[test-task:echo ab  ] ab',
      '[test-task:echo ab  ] abab',
      '[test-task:echo ab  ] ',
      '[test-task:echo ab  ] ',
      '[test-task:echo ab  ] ',
      '[test-task:echo ab  ] ab',
    ].join('\n')

    test('Node API', async () => {
      const stdout = new BufferStream()
      await nodeApi(
        ['test-task:echo a', 'test-task:echo abcd', 'test-task:echo ab'],
        { stdout, silent: true, printLabel: true }
      )
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })

    test('npm-run-all command', async () => {
      const stdout = new BufferStream()
      await runAll(
        ['test-task:echo a', 'test-task:echo abcd', 'test-task:echo ab', '--silent', '--print-label'],
        stdout
      )
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })

    test('run-s command', async () => {
      const stdout = new BufferStream()
      await runSeq(
        ['test-task:echo a', 'test-task:echo abcd', 'test-task:echo ab', '--silent', '--print-label'],
        stdout
      )
      assert.strictEqual(stdout.value, EXPECTED_TEXT)
    })
  })

  describe('should work printing labels in parallel:', () => {
    const EXPECTED_LINES = [
      '\n[test-task:echo a   ] ',
      '\n[test-task:echo a   ] a',
      '\n[test-task:echo ab  ] ',
      '\n[test-task:echo ab  ] ab',
      '\n[test-task:echo abcd] ',
      '\n[test-task:echo abcd] abcd',
    ]
    const UNEXPECTED_PATTERNS = [
      /aab(cd)?/,
      /ab(cd)?a\b/,
      /\n\n/,
    ]

    test('Node API', async () => {
      const stdout = new BufferStream()
      await nodeApi(
        ['test-task:echo a', 'test-task:echo abcd', 'test-task:echo ab'],
        { stdout, parallel: true, printLabel: true }
      )
      for (const line of EXPECTED_LINES) {
        assert.ok(stdout.value.includes(line), `Expected output to include "${line}"`)
      }
      for (const pattern of UNEXPECTED_PATTERNS) {
        assert.doesNotMatch(stdout.value, pattern, `Expected output not to match pattern ${pattern}`)
      }
    })

    test('npm-run-all command', async () => {
      const stdout = new BufferStream()
      await runAll(
        ['--parallel', 'test-task:echo a', 'test-task:echo abcd', 'test-task:echo ab', '--print-label'],
        stdout
      )
      for (const line of EXPECTED_LINES) {
        assert.ok(stdout.value.includes(line), `Expected output to include "${line}"`)
      }
      for (const pattern of UNEXPECTED_PATTERNS) {
        assert.doesNotMatch(stdout.value, pattern, `Expected output not to match pattern ${pattern}`)
      }
    })

    test('run-p command', async () => {
      const stdout = new BufferStream()
      await runPar(
        ['test-task:echo a', 'test-task:echo abcd', 'test-task:echo ab', '--print-label'],
        stdout
      )
      for (const line of EXPECTED_LINES) {
        assert.ok(stdout.value.includes(line), `Expected output to include "${line}"`)
      }
      for (const pattern of UNEXPECTED_PATTERNS) {
        assert.doesNotMatch(stdout.value, pattern, `Expected output not to match pattern ${pattern}`)
      }
    })
  })
})
