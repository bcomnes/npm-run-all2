/**
 * @author Bret Comnes
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import nodeApi from '#lib'
import parseCLIArgs from '#bin/common/parse-cli-args.js'
import BufferStream from './lib/buffer-stream.cjs'

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

const ESC = String.fromCharCode(0x1b)
const ANSI_CSI = new RegExp(`${ESC}\\[`)
const ANSI_256_COLOR = new RegExp(`${ESC}\\[38;5;\\d+m`)

/**
 * A BufferStream that presents itself as a TTY with a configurable color depth,
 * so that selectColor() applies ANSI codes rather than returning empty strings.
 */
class TtyBufferStream extends BufferStream {
  /** @param {number} [colorDepth] - Value returned by getColorDepth() (4=16-color, 8=256-color). */
  constructor (colorDepth = 4) {
    super()
    this.isTTY = true
    this._colorDepth = colorDepth
  }

  getColorDepth () { return this._colorDepth }
}

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

describe('[color-mode] CLI argument parsing', () => {
  for (const mode of /** @type {const} */ (['auto', 'none', '16', '256'])) {
    test(`--color-mode ${mode}`, () => {
      const set = parseCLIArgs(['--color-mode', mode])
      assert.strictEqual(set.colorMode, mode)
    })
  }

  test('invalid --color-mode value throws', () => {
    assert.throws(
      () => parseCLIArgs(['--color-mode', 'truecolor']),
      /Invalid Option/
    )
  })
})

describe('[color-mode] label color output via Node API', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  test('colorMode none: no ANSI codes in output', async () => {
    const stdout = new TtyBufferStream(8)
    await nodeApi('test-task:echo hello', { stdout, silent: true, printLabel: true, colorMode: 'none' })
    assert.doesNotMatch(stdout.value, ANSI_CSI)
  })

  test('colorMode 16: named ANSI codes present, no 256-color codes', async () => {
    const stdout = new TtyBufferStream(4)
    await nodeApi('test-task:echo hello', { stdout, silent: true, printLabel: true, colorMode: '16' })
    assert.match(stdout.value, ANSI_CSI)
    assert.doesNotMatch(stdout.value, ANSI_256_COLOR)
  })

  test('colorMode 256: ANSI codes present', async () => {
    const stdout = new TtyBufferStream(8)
    await nodeApi('test-task:echo hello', { stdout, silent: true, printLabel: true, colorMode: '256' })
    assert.match(stdout.value, ANSI_CSI)
  })

  test('colorMode auto with depth 1 (no-color terminal): no ANSI codes', async () => {
    const stdout = new TtyBufferStream(1)
    await nodeApi('test-task:echo hello', { stdout, silent: true, printLabel: true, colorMode: 'auto' })
    assert.doesNotMatch(stdout.value, ANSI_CSI)
  })

  test('colorMode auto with depth 4 (16-color terminal): named ANSI codes, no 256-color codes', async () => {
    const stdout = new TtyBufferStream(4)
    await nodeApi('test-task:echo hello', { stdout, silent: true, printLabel: true, colorMode: 'auto' })
    assert.match(stdout.value, ANSI_CSI)
    assert.doesNotMatch(stdout.value, ANSI_256_COLOR)
  })

  test('colorMode auto with depth 8 (256-color terminal): ANSI codes present', async () => {
    const stdout = new TtyBufferStream(8)
    await nodeApi('test-task:echo hello', { stdout, silent: true, printLabel: true, colorMode: 'auto' })
    assert.match(stdout.value, ANSI_CSI)
  })

  test('colorMode 256: combined palette emits ansi256 codes beyond the 14 named colors', async () => {
    // 'test-task:echo hello' has already claimed index 0 above.
    // These 15 unique names claim indices 1–15; indices 14–15 exceed COLORS_NAMED.length (14)
    // and therefore fall into the COLORS_256 branch, producing \x1b[38;5;Xm sequences.
    const tasks = Array.from({ length: 15 }, (_, i) => `test-task:echo color-task-${i}`)
    const stdout = new TtyBufferStream(8)
    stdout.setMaxListeners(tasks.length + 10)
    await nodeApi(tasks, { stdout, silent: true, printLabel: true, colorMode: '256', parallel: true })
    assert.match(stdout.value, ANSI_256_COLOR)
  })
})
