/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const { test, describe, before, after, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const nodeApi = require('../lib')
const { delay, removeResult, runAll, runPar, runSeq } = require('./lib/util')

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

/**
 * Throws an assertion error if a given promise comes to be fulfilled.
 *
 * @param {Promise} p - A promise to check.
 * @returns {Promise} A promise which is checked.
 */
function shouldFail (p) {
  return p.then(
    () => assert(false, 'should fail'),
    () => null // OK!
  )
}

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[fail] it should fail', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => removeResult())
  afterEach(() => delay(1000))

  describe('if an invalid option exists.', () => {
    test('npm-run-all command', async () => await shouldFail(runAll(['--invalid'])))
    test('run-s command', async () => await shouldFail(runSeq(['--parallel'])))
    test('run-p command', async () => await shouldFail(runPar(['--sequential'])))

    test('npm-run-all command with --race without --parallel', async () => await shouldFail(runAll(['--race'])))
    test('npm-run-all command with --r without --parallel', async () => await shouldFail(runAll(['--r'])))
    test('run-s command with --race', async () => await shouldFail(runSeq(['--race'])))
    test('run-s command with --r', async () => await shouldFail(runSeq(['--r'])))
  })

  describe('if invalid `options.taskList` is given.', () => {
    test('Node API', async () => await shouldFail(nodeApi('test-task:append a', { taskList: { invalid: 0 } })))
  })

  describe('if unknown tasks are given:', () => {
    test('Node API', async () => await shouldFail(nodeApi('unknown-task')))
    test('npm-run-all command', async () => await shouldFail(runAll(['unknown-task'])))
    test('run-s command', async () => await shouldFail(runSeq(['unknown-task'])))
    test('run-p command', async () => await shouldFail(runPar(['unknown-task'])))
  })

  describe('if unknown tasks are given (2):', () => {
    test('Node API', async () => await shouldFail(nodeApi(['test-task:append:a', 'unknown-task'])))
    test('npm-run-all command', async () => await shouldFail(runAll(['test-task:append:a', 'unknown-task'])))
    test('run-s command', async () => await shouldFail(runSeq(['test-task:append:a', 'unknown-task'])))
    test('run-p command', async () => await shouldFail(runPar(['test-task:append:a', 'unknown-task'])))
  })

  describe('if package.json is not found:', () => {
    before(() => process.chdir('no-package-json'))
    after(() => process.chdir('..'))

    test('Node API', async () => await shouldFail(nodeApi(['test-task:append:a'])))
    test('npm-run-all command', async () => await shouldFail(runAll(['test-task:append:a'])))
    test('run-s command', async () => await shouldFail(runSeq(['test-task:append:a'])))
    test('run-p command', async () => await shouldFail(runPar(['test-task:append:a'])))
  })

  describe('if package.json does not have scripts field:', () => {
    before(() => process.chdir('no-scripts'))
    after(() => process.chdir('..'))

    test('Node API', async () => await shouldFail(nodeApi(['test-task:append:a'])))
    test('npm-run-all command', async () => await shouldFail(runAll(['test-task:append:a'])))
    test('run-s command', async () => await shouldFail(runSeq(['test-task:append:a'])))
    test('run-p command', async () => await shouldFail(runPar(['test-task:append:a'])))
  })

  describe('if tasks exited with non-zero code:', () => {
    test('Node API', async () => await shouldFail(nodeApi('test-task:error')))
    test('npm-run-all command', async () => await shouldFail(runAll(['test-task:error'])))
    test('run-s command', async () => await shouldFail(runSeq(['test-task:error'])))
    test('run-p command', async () => await shouldFail(runPar(['test-task:error'])))
  })

  describe('if tasks exited via a signal:', () => {
    test('Node API', async () => await shouldFail(nodeApi('test-task:abort')))
    test('npm-run-all command', async () => await shouldFail(runAll(['test-task:abort'])))
    test('run-s command', async () => await shouldFail(runSeq(['test-task:abort'])))
    test('run-p command', async () => await shouldFail(runPar(['test-task:abort'])))
    test('with correct exit code', async () => {
      try {
        await nodeApi('test-task:abort')
        assert(false, 'should fail')
      } catch (err) {
        // In NodeJS versions > 6, the child process correctly sends back
        // the signal + code of null. In NodeJS versions <= 6, the child
        // process does not set the signal, and sets the code to 1.
        const code = Number(process.version.match(/^v(\d+)/)[1]) > 6 ? 134 : 1
        assert(err.code === code, 'should have correct exit code')
      }
    })
  })
})
