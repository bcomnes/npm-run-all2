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
import { runAll, runPar, runSeq } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[aggregated-output] npm-run-all', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  /**
     * create expected text
     * @param {string} term  the term to use when creating a line
     * @returns {string} the complete line
     */
  function createExpectedOutput (term) {
    return `[${term}]__[${term}]`
  }

  describe('should not intermingle output of various commands', () => {
    const EXPECTED_PARALLELIZED_TEXT = [
      createExpectedOutput('second'),
      createExpectedOutput('third'),
      createExpectedOutput('first'),
      '',
    ].join('\n')

    let stdout = null

    beforeEach(() => {
      stdout = new BufferStream()
    })

    test('Node API with parallel', async () => {
      await nodeApi(
        ['test-task:delayed first 5000', 'test-task:delayed second 1000', 'test-task:delayed third 3000'],
        { stdout, parallel: true, silent: true, aggregateOutput: true }
      )
      assert.strictEqual(stdout.value, EXPECTED_PARALLELIZED_TEXT)
    })

    test('Node API without parallel should fail', async () => {
      try {
        await nodeApi(
          ['test-task:delayed first 5000', 'test-task:delayed second 1000', 'test-task:delayed third 3000'],
          { stdout, silent: true, aggregateOutput: true }
        )
      } catch (_err) {
        return
      }
      assert.fail('should fail')
    })

    test('npm-run-all command with parallel', async () => {
      await runAll(
        ['--parallel', 'test-task:delayed first 5000', 'test-task:delayed second 1000', 'test-task:delayed third 3000', '--silent', '--aggregate-output'],
        stdout
      )
      assert.strictEqual(stdout.value, EXPECTED_PARALLELIZED_TEXT)
    })

    test('npm-run-all command without parallel should fail', async () => {
      try {
        await runAll(
          ['test-task:delayed first 5000', 'test-task:delayed second 1000', 'test-task:delayed third 3000', '--silent', '--aggregate-output'],
          stdout
        )
      } catch (_err) {
        return
      }
      assert.fail('should fail')
    })

    test('run-s command should fail', async () => {
      try {
        await runSeq(
          ['test-task:delayed first 5000', 'test-task:delayed second 1000', 'test-task:delayed third 3000', '--silent', '--aggregate-output'],
          stdout
        )
      } catch (_err) {
        return
      }
      assert.fail('should fail')
    })

    test('run-p command', async () => {
      await runPar(
        [
          'test-task:delayed first 5000',
          'test-task:delayed second 1000',
          'test-task:delayed third 3000',
          '--silent', '--aggregate-output',
        ],
        stdout
      )
      assert.strictEqual(stdout.value, EXPECTED_PARALLELIZED_TEXT)
    })
  })
})
