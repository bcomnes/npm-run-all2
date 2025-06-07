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
import { result, removeResult, runAll, runPar, runSeq } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[config] it should have an ability to set config variables:', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => removeResult())

  test('Node API should address "config" option', async () => {
    await nodeApi('test-task:config', { config: { test: 'this is a config' } })
    assert.strictEqual(result(), 'this is a config')
  })

  test('Node API should address "config" option for multiple variables', async () => {
    await nodeApi('test-task:config2', { config: { test: '1', test2: '2', test3: '3' } })
    assert.strictEqual(result(), '1\n2\n3')
  })

  describe('CLI commands should address "--a=b" style options', () => {
    test('npm-run-all command', async () => {
      await runAll(['test-task:config', '--test=GO'])
      assert.strictEqual(result(), 'GO')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:config', '--test=GO'])
      assert.strictEqual(result(), 'GO')
    })

    test('run-p command', async () => {
      await runPar(['test-task:config', '--test=GO'])
      assert.strictEqual(result(), 'GO')
    })
  })

  describe('CLI commands should address "--b=c" style options for multiple variables', () => {
    test('npm-run-all command', async () => {
      await runAll(['test-task:config2', '--test=1', '--test2=2', '--test3=3'])
      assert.strictEqual(result(), '1\n2\n3')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:config2', '--test=1', '--test2=2', '--test3=3'])
      assert.strictEqual(result(), '1\n2\n3')
    })

    test('run-p command', async () => {
      await runPar(['test-task:config2', '--test=1', '--test2=2', '--test3=3'])
      assert.strictEqual(result(), '1\n2\n3')
    })
  })

  describe('CLI commands should transfer configs to nested commands.', () => {
    test('npm-run-all command', async () => {
      await runAll(['test-task:nested-config', '--test=GO DEEP'])
      assert.strictEqual(result(), 'GO DEEP')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:nested-config', '--test=GO DEEP'])
      assert.strictEqual(result(), 'GO DEEP')
    })

    test('run-p command', async () => {
      await runPar(['test-task:nested-config', '--test=GO DEEP'])
      assert.strictEqual(result(), 'GO DEEP')
    })
  })
})
