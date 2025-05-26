/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import { execSync } from 'child_process'
import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import nodeApi from 'npm-run-all2'
import { result, removeResult, runAll, runPar, runSeq } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe("[package-config] it should have an ability to overwrite package's config:", () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => removeResult())

  const [major] = execSync('npm --version', { encoding: 'utf8' }).trim().split('.')

  const supportsOverrides = major <= 6

  if (supportsOverrides) {
    test('Node API should address "packageConfig" option', async () => {
      await nodeApi('test-task:package-config', { packageConfig: { 'npm-run-all-test': { test: 'OVERWRITTEN' } } })
      assert.strictEqual(result(), 'OVERWRITTEN')
    })

    test('Node API should address "packageConfig" option for multiple variables', async () => {
      await nodeApi('test-task:package-config2', { packageConfig: { 'npm-run-all-test': { test: '1', test2: '2', test3: '3' } } })
      assert.strictEqual(result(), '1\n2\n3')
    })

    describe('CLI commands should address "--a:b=c" style options', () => {
      test('npm-run-all command', async () => {
        await runAll(['test-task:package-config', '--npm-run-all-test:test=OVERWRITTEN'])
        assert.strictEqual(result(), 'OVERWRITTEN')
      })

      test('run-s command', async () => {
        await runSeq(['test-task:package-config', '--npm-run-all-test:test=OVERWRITTEN'])
        assert.strictEqual(result(), 'OVERWRITTEN')
      })

      test('run-p command', async () => {
        await runPar(['test-task:package-config', '--npm-run-all-test:test=OVERWRITTEN'])
        assert.strictEqual(result(), 'OVERWRITTEN')
      })
    })

    describe('CLI commands should address "--a:b=c" style options for multiple variables', () => {
      test('npm-run-all command', async () => {
        await runAll(['test-task:package-config2', '--npm-run-all-test:test=1', '--npm-run-all-test:test2=2', '--npm-run-all-test:test3=3'])
        assert.strictEqual(result(), '1\n2\n3')
      })

      test('run-s command', async () => {
        await runSeq(['test-task:package-config2', '--npm-run-all-test:test=1', '--npm-run-all-test:test2=2', '--npm-run-all-test:test3=3'])
        assert.strictEqual(result(), '1\n2\n3')
      })

      test('run-p command', async () => {
        await runPar(['test-task:package-config2', '--npm-run-all-test:test=1', '--npm-run-all-test:test2=2', '--npm-run-all-test:test3=3'])
        assert.strictEqual(result(), '1\n2\n3')
      })
    })

    describe('CLI commands should address "--a:b c" style options', () => {
      test('npm-run-all command', async () => {
        await runAll(['test-task:package-config', '--npm-run-all-test:test', 'OVERWRITTEN'])
        assert.strictEqual(result(), 'OVERWRITTEN')
      })

      test('run-s command', async () => {
        await runSeq(['test-task:package-config', '--npm-run-all-test:test', 'OVERWRITTEN'])
        assert.strictEqual(result(), 'OVERWRITTEN')
      })

      test('run-p command', async () => {
        await runPar(['test-task:package-config', '--npm-run-all-test:test', 'OVERWRITTEN'])
        assert.strictEqual(result(), 'OVERWRITTEN')
      })
    })

    describe('CLI commands should transfer overwriting nested commands.', () => {
      test('npm-run-all command', async () => {
        await runAll(['test-task:nested-package-config', '--npm-run-all-test:test', 'OVERWRITTEN'])
        assert.strictEqual(result(), 'OVERWRITTEN')
      })

      test('run-s command', async () => {
        await runSeq(['test-task:nested-package-config', '--npm-run-all-test:test', 'OVERWRITTEN'])
        assert.strictEqual(result(), 'OVERWRITTEN')
      })

      test('run-p command', async () => {
        await runPar(['test-task:nested-package-config', '--npm-run-all-test:test', 'OVERWRITTEN'])
        assert.strictEqual(result(), 'OVERWRITTEN')
      })
    })
  }
})
