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
import createHeader from '../lib/create-header.js'
import readPackageJson from '../lib/read-package-json.js'
import BufferStream from './lib/buffer-stream.cjs'
import { runAll, runPar, runSeq } from './lib/util.cjs'
import ansiStyles from 'ansi-styles'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[print-name] npm-run-all', () => {
  let packageInfo = null

  before(() => {
    process.chdir('test-workspace')
    return readPackageJson().then(info => {
      packageInfo = info.packageInfo
    })
  })
  after(() => process.chdir('..'))

  describe('should print names before running tasks:', () => {
    test('Node API', async () => {
      const stdout = new BufferStream()
      await nodeApi('test-task:echo abc', { stdout, silent: true, printName: true })
      const header = createHeader('test-task:echo abc', packageInfo, false, ansiStyles)
      assert.strictEqual(stdout.value.slice(0, header.length), header)
    })

    test('npm-run-all command (--print-name)', async () => {
      const stdout = new BufferStream()
      await runAll(['test-task:echo abc', '--silent', '--print-name'], stdout)
      const header = createHeader('test-task:echo abc', packageInfo, false, ansiStyles)
      assert.strictEqual(stdout.value.slice(0, header.length), header)
    })

    test('run-s command (--print-name)', async () => {
      const stdout = new BufferStream()
      await runSeq(['test-task:echo abc', '--silent', '--print-name'], stdout)
      const header = createHeader('test-task:echo abc', packageInfo, false, ansiStyles)
      assert.strictEqual(stdout.value.slice(0, header.length), header)
    })

    test('run-p command (--print-name)', async () => {
      const stdout = new BufferStream()
      await runPar(['test-task:echo abc', '--silent', '--print-name'], stdout)
      const header = createHeader('test-task:echo abc', packageInfo, false, ansiStyles)
      assert.strictEqual(stdout.value.slice(0, header.length), header)
    })

    test('npm-run-all command (-n)', async () => {
      const stdout = new BufferStream()
      await runAll(['test-task:echo abc', '--silent', '-n'], stdout)
      const header = createHeader('test-task:echo abc', packageInfo, false, ansiStyles)
      assert.strictEqual(stdout.value.slice(0, header.length), header)
    })

    test('run-s command (-n)', async () => {
      const stdout = new BufferStream()
      await runSeq(['test-task:echo abc', '--silent', '-n'], stdout)
      const header = createHeader('test-task:echo abc', packageInfo, false, ansiStyles)
      assert.strictEqual(stdout.value.slice(0, header.length), header)
    })

    test('run-p command (-n)', async () => {
      const stdout = new BufferStream()
      await runPar(['test-task:echo abc', '--silent', '-n'], stdout)
      const header = createHeader('test-task:echo abc', packageInfo, false, ansiStyles)
      assert.strictEqual(stdout.value.slice(0, header.length), header)
    })
  })
})
