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
const { strictEqual } = assert

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[argument-placeholders]', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => removeResult())

  describe("If arguments preceded by '--' are nothing, '{1}' should be empty:", () => {
    test('Node API', async () => {
      await nodeApi('test-task:dump {1}')
      strictEqual(result(), '[]')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:dump {1}'])
      strictEqual(result(), '[]')
    })

    test("npm-run-all command (only '--' exists)", async () => {
      await runAll(['test-task:dump {1}', '--'])
      strictEqual(result(), '[]')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:dump {1}'])
      strictEqual(result(), '[]')
    })

    test("run-s command (only '--' exists)", async () => {
      await runSeq(['test-task:dump {1}', '--'])
      strictEqual(result(), '[]')
    })

    test('run-p command', async () => {
      await runPar(['test-task:dump {1}'])
      strictEqual(result(), '[]')
    })

    test("run-p command (only '--' exists)", async () => {
      await runPar(['test-task:dump {1}', '--'])
      strictEqual(result(), '[]')
    })
  })

  describe("'{1}' should be replaced by the 1st argument preceded by '--':", () => {
    test('Node API', async () => {
      await nodeApi('test-task:dump {1}', { arguments: ['1st', '2nd'] })
      strictEqual(result(), '["1st"]')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:dump {1}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st"]')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:dump {1}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st"]')
    })

    test('run-p command', async () => {
      await runPar(['test-task:dump {1}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st"]')
    })
  })

  describe("'{2}' should be replaced by the 2nd argument preceded by '--':", () => {
    test('Node API', async () => {
      await nodeApi('test-task:dump {2}', { arguments: ['1st', '2nd'] })
      strictEqual(result(), '["2nd"]')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:dump {2}', '--', '1st', '2nd'])
      strictEqual(result(), '["2nd"]')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:dump {2}', '--', '1st', '2nd'])
      strictEqual(result(), '["2nd"]')
    })

    test('run-p command', async () => {
      await runPar(['test-task:dump {2}', '--', '1st', '2nd'])
      strictEqual(result(), '["2nd"]')
    })
  })

  describe("'{@}' should be replaced by the every argument preceded by '--':", () => {
    test('Node API', async () => {
      await nodeApi('test-task:dump {@}', { arguments: ['1st', '2nd'] })
      strictEqual(result(), '["1st","2nd"]')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:dump {@}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st","2nd"]')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:dump {@}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st","2nd"]')
    })

    test('run-p command', async () => {
      await runPar(['test-task:dump {@}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st","2nd"]')
    })
  })

  describe("'{*}' should be replaced by the all arguments preceded by '--':", () => {
    test('Node API', async () => {
      await nodeApi('test-task:dump {*}', { arguments: ['1st', '2nd'] })
      strictEqual(result(), '["1st 2nd"]')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:dump {*}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st 2nd"]')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:dump {*}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st 2nd"]')
    })

    test('run-p command', async () => {
      await runPar(['test-task:dump {*}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st 2nd"]')
    })
  })

  describe("'{%}' should be unfolded into one command for each argument following '--':", () => {
    test('Node API', async () => {
      await nodeApi('test-task:dump {%}', { arguments: ['1st', '2nd'] })
      strictEqual(result(), '["1st"]["2nd"]')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:dump {%}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st"]["2nd"]')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:dump {%}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st"]["2nd"]')
    })

    test('run-p command', async () => {
      await runPar(['test-task:dump {%}', '--', '1st', '2nd'])
      const value = result()
      assert.ok(value === '["1st"]["2nd"]' || value === '["2nd"]["1st"]', `Expected value to be either '["1st"]["2nd"]' or '["2nd"]["1st"]', but got '${value}'`)
    })
  })

  describe("Every '{1}', '{2}', '{@}' and '{*}' should be replaced by the arguments preceded by '--':", () => {
    test('Node API', async () => {
      await nodeApi('test-task:dump {1} {2} {3} {@} {*}', { arguments: ['1st', '2nd'] })
      strictEqual(result(), '["1st","2nd","1st","2nd","1st 2nd"]')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:dump {1} {2} {3} {@} {*}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st","2nd","1st","2nd","1st 2nd"]')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:dump {1} {2} {3} {@} {*}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st","2nd","1st","2nd","1st 2nd"]')
    })

    test('run-p command', async () => {
      await runPar(['test-task:dump {1} {2} {3} {@} {*}', '--', '1st', '2nd'])
      strictEqual(result(), '["1st","2nd","1st","2nd","1st 2nd"]')
    })
  })

  describe("'{1:-foo}' should be replaced by 'foo' if arguments are nothing:", () => {
    test('Node API', async () => {
      await nodeApi('test-task:dump {1:-foo} {1}')
      strictEqual(result(), '["foo"]')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:dump {1:-foo} {1}'])
      strictEqual(result(), '["foo"]')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:dump {1:-foo} {1}'])
      strictEqual(result(), '["foo"]')
    })

    test('run-p command', async () => {
      await runPar(['test-task:dump {1:-foo} {1}'])
      strictEqual(result(), '["foo"]')
    })
  })

  describe("'{1:=foo}' should be replaced by 'foo' and should affect following '{1}' if arguments are nothing:", () => {
    test('Node API', async () => {
      await nodeApi('test-task:dump {1:=foo} {1}')
      strictEqual(result(), '["foo","foo"]')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:dump {1:=foo} {1}'])
      strictEqual(result(), '["foo","foo"]')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:dump {1:=foo} {1}'])
      strictEqual(result(), '["foo","foo"]')
    })

    test('run-p command', async () => {
      await runPar(['test-task:dump {1:=foo} {1}'])
      strictEqual(result(), '["foo","foo"]')
    })
  })
})
