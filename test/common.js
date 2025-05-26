/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import { test, describe, beforeEach, before, after } from 'node:test'
import assert from 'node:assert/strict'
import nodeApi from 'npm-run-all2'
import BufferStream from './lib/buffer-stream.cjs'
import { result, removeResult, runAll, runPar, runSeq } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('common', async () => {
  before(async () => process.chdir('test-workspace'))
  after(async () => process.chdir('..'))

  beforeEach(async () => removeResult())

  describe('should print a help text if arguments are nothing.', async () => {
    test('npm-run-all command', async () => {
      const buf = new BufferStream()
      await runAll([], buf)
      assert.match(buf.value, /Usage:/, 'Expected output to contain usage information')
    })

    test('run-s command', async () => {
      const buf = new BufferStream()
      await runSeq([], buf)
      assert.match(buf.value, /Usage:/, 'Expected output to contain usage information')
    })

    test('run-p command', async () => {
      const buf = new BufferStream()
      await runPar([], buf)
      assert.match(buf.value, /Usage:/, 'Expected output to contain usage information')
    })
  })

  describe('should print a help text if the first argument is --help (-h)', async () => {
    test('npm-run-all command (-h)', async () => {
      const buf = new BufferStream()
      await runAll(['-h'], buf)
      assert.match(buf.value, /Usage:/, 'Expected output to contain usage information')
    })

    test('run-s command (-h)', async () => {
      const buf = new BufferStream()
      await runSeq(['-h'], buf)
      assert.match(buf.value, /Usage:/, 'Expected output to contain usage information')
    })

    test('run-p command (-h)', async () => {
      const buf = new BufferStream()
      await runPar(['-h'], buf)
      assert.match(buf.value, /Usage:/, 'Expected output to contain usage information')
    })

    test('npm-run-all command (--help)', async () => {
      const buf = new BufferStream()
      await runAll(['--help'], buf)
      assert.match(buf.value, /Usage:/, 'Expected output to contain usage information')
    })

    test('run-s command (--help)', async () => {
      const buf = new BufferStream()
      await runSeq(['--help'], buf)
      assert.match(buf.value, /Usage:/, 'Expected output to contain usage information')
    })

    test('run-p command (--help)', async () => {
      const buf = new BufferStream()
      await runPar(['--help'], buf)
      assert.match(buf.value, /Usage:/, 'Expected output to contain usage information')
    })
  })

  describe('should print a version number if the first argument is --version (-v)', async () => {
    test('npm-run-all command (-v)', async () => {
      const buf = new BufferStream()
      await runAll(['-v'], buf)
      assert.match(buf.value, /v[0-9]+\.[0-9]+\.[0-9]+/, 'Expected output to contain version number')
    })

    test('run-s command (-v)', async () => {
      const buf = new BufferStream()
      await runSeq(['-v'], buf)
      assert.match(buf.value, /v[0-9]+\.[0-9]+\.[0-9]+/, 'Expected output to contain version number')
    })

    test('run-p command (-v)', async () => {
      const buf = new BufferStream()
      await runPar(['-v'], buf)
      assert.match(buf.value, /v[0-9]+\.[0-9]+\.[0-9]+/, 'Expected output to contain version number')
    })

    test('npm-run-all command (--version)', async () => {
      const buf = new BufferStream()
      await runAll(['--version'], buf)
      assert.match(buf.value, /v[0-9]+\.[0-9]+\.[0-9]+/, 'Expected output to contain version number')
    })

    test('run-s command (--version)', async () => {
      const buf = new BufferStream()
      await runSeq(['--version'], buf)
      assert.match(buf.value, /v[0-9]+\.[0-9]+\.[0-9]+/, 'Expected output to contain version number')
    })

    test('run-p command (--version)', async () => {
      const buf = new BufferStream()
      await runPar(['--version'], buf)
      assert.match(buf.value, /v[0-9]+\.[0-9]+\.[0-9]+/, 'Expected output to contain version number')
    })
  })

  describe('should do nothing if a task list is empty.', async () => {
    test('Node API', async () => {
      await nodeApi(null)
      assert.strictEqual(result(), null)
    })
  })

  describe('should run a task by npm (check an environment variable):', async () => {
    test('Node API', async () => {
      await nodeApi('test-task:package-config')
      assert.strictEqual(result(), 'OK')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:package-config'])
      assert.strictEqual(result(), 'OK')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:package-config'])
      assert.strictEqual(result(), 'OK')
    })

    test('run-p command', async () => {
      await runPar(['test-task:package-config'])
      assert.strictEqual(result(), 'OK')
    })
  })

  describe('stdin can be used in tasks:', async () => {
    test('Node API', async () => {
      await nodeApi('test-task:stdin')
      assert.strictEqual(result().trim(), 'STDIN')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:stdin'])
      assert.strictEqual(result().trim(), 'STDIN')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:stdin'])
      assert.strictEqual(result().trim(), 'STDIN')
    })

    test('run-p command', async () => {
      await runPar(['test-task:stdin'])
      assert.strictEqual(result().trim(), 'STDIN')
    })
  })

  describe('stdout can be used in tasks:', async () => {
    test('Node API', async () => {
      await nodeApi('test-task:stdout')
      assert.strictEqual(result(), 'STDOUT')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:stdout'])
      assert.strictEqual(result(), 'STDOUT')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:stdout'])
      assert.strictEqual(result(), 'STDOUT')
    })

    test('run-p command', async () => {
      await runPar(['test-task:stdout'])
      assert.strictEqual(result(), 'STDOUT')
    })
  })

  describe('stderr can be used in tasks:', async () => {
    test('Node API', async () => {
      await nodeApi('test-task:stderr')
      assert.strictEqual(result(), 'STDERR')
    })

    test('npm-run-all command', async () => {
      await runAll(['test-task:stderr'])
      assert.strictEqual(result(), 'STDERR')
    })

    test('run-s command', async () => {
      await runSeq(['test-task:stderr'])
      assert.strictEqual(result(), 'STDERR')
    })

    test('run-p command', async () => {
      await runPar(['test-task:stderr'])
      assert.strictEqual(result(), 'STDERR')
    })
  })

  describe('should be able to use `restart` built-in task:', async () => {
    test('Node API', async () => await nodeApi('restart'))
    test('npm-run-all command', async () => await runAll(['restart']))
    test('run-s command', async () => await runSeq(['restart']))
    test('run-p command', async () => await runPar(['restart']))
  })

  describe('should be able to use `env` built-in task:', async () => {
    test('Node API', async () => await nodeApi('env'))
    test('npm-run-all command', async () => await runAll(['env']))
    test('run-s command', async () => await runSeq(['env']))
    test('run-p command', async () => await runPar(['env']))
  })

  if (process.platform === 'win32') {
    describe('issue14', async () => {
      test('Node API', async () => await nodeApi('test-task:issue14:win32'))
      test('npm-run-all command', async () => await runAll(['test-task:issue14:win32']))
      test('run-s command', async () => await runSeq(['test-task:issue14:win32']))
      test('run-p command', async () => await runPar(['test-task:issue14:win32']))
    })
  } else {
    describe('issue14', async () => {
      test('Node API', async () => await nodeApi('test-task:issue14:posix'))
      test('npm-run-all command', async () => await runAll(['test-task:issue14:posix']))
      test('run-s command', async () => await runSeq(['test-task:issue14:posix']))
      test('run-p command', async () => await runPar(['test-task:issue14:posix']))
    })
  }

  describe('should not print log if silent option was given:', async () => {
    test('Node API', async () => {
      const stdout = new BufferStream()
      const stderr = new BufferStream()

      await assert.rejects(async () => {
        await nodeApi('test-task:error', { silent: true, stdout, stderr })
      })

      assert.strictEqual(stdout.value, '')
      assert.strictEqual(stderr.value, '')
    })

    /**
     * Strip unknown istanbul's warnings.
     * @param {string} str - The string to be stripped.
     * @returns {string} The stripped string.
     */
    function stripIstanbulWarnings (str) {
      return str.replace(/File \[.+?] ignored, nothing could be mapped\r?\n/, '')
    }

    test('npm-run-all command', async () => {
      const stdout = new BufferStream()
      const stderr = new BufferStream()

      await assert.rejects(async () => {
        await runAll(['--silent', 'test-task:error'], stdout, stderr)
      })

      assert.strictEqual(stdout.value, '')
      assert.strictEqual(stripIstanbulWarnings(stderr.value), '')
    })

    test('run-s command', async () => {
      const stdout = new BufferStream()
      const stderr = new BufferStream()

      await assert.rejects(async () => {
        await runSeq(['--silent', 'test-task:error'], stdout, stderr)
      })

      assert.strictEqual(stdout.value, '')
      assert.strictEqual(stripIstanbulWarnings(stderr.value), '')
    })

    test('run-p command', async () => {
      const stdout = new BufferStream()
      const stderr = new BufferStream()

      await assert.rejects(async () => {
        await runPar(['--silent', 'test-task:error'], stdout, stderr)
      })

      assert.strictEqual(stdout.value, '')
      assert.strictEqual(stripIstanbulWarnings(stderr.value), '')
    })
  })

  // https://github.com/mysticatea/npm-run-all/issues/105
  describe('should not print MaxListenersExceededWarning when it runs 10 tasks:', async () => {
    const tasks = Array.from({ length: 10 }, () => 'test-task:append:a')

    test('npm-run-all command', async () => {
      const buf = new BufferStream()
      await runAll(tasks, null, buf)
      assert.doesNotMatch(buf.value, /MaxListenersExceededWarning/, 'Should not show MaxListenersExceededWarning')
    })

    test('run-s command', async () => {
      const buf = new BufferStream()
      await runSeq(tasks, null, buf)
      assert.doesNotMatch(buf.value, /MaxListenersExceededWarning/, 'Should not show MaxListenersExceededWarning')
    })

    test('run-p command', async () => {
      const buf = new BufferStream()
      await runPar(tasks, null, buf)
      assert.doesNotMatch(buf.value, /MaxListenersExceededWarning/, 'Should not show MaxListenersExceededWarning')
    })
  })
})
