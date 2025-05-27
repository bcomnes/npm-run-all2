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
import { result, removeResult, runAll } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[mixed] npm-run-all', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => removeResult())

  test('should run a mix of sequential and parallel tasks (has the default group):', async () => {
    await runAll([
      'test-task:append a',
      '-p', 'test-task:append b', 'test-task:append c',
      '-s', 'test-task:append d', 'test-task:append e',
    ])
    assert.ok(
      result() === 'aabcbcddee' ||
            result() === 'aabccbddee' ||
            result() === 'aacbbcddee' ||
            result() === 'aacbcbddee',
      `Expected result to match one of the patterns but got: ${result()}`
    )
  })

  test("should run a mix of sequential and parallel tasks (doesn't have the default group):", async () => {
    await runAll([
      '-p', 'test-task:append b', 'test-task:append c',
      '-s', 'test-task:append d', 'test-task:append e',
    ])
    assert.ok(
      result() === 'bcbcddee' ||
            result() === 'bccbddee' ||
            result() === 'cbbcddee' ||
            result() === 'cbcbddee',
      `Expected result to match one of the patterns but got: ${result()}`
    )
  })

  test('should not throw errors for --race and --max-parallel options if --parallel exists:', async () =>
    await runAll([
      'test-task:append a',
      '-p', 'test-task:append b', 'test-task:append c',
      '-s', 'test-task:append d', 'test-task:append e',
      '-r',
    ]))
})
