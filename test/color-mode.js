/**
 * @author Bret Comnes
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { styleText } from 'node:util'
import nodeApi from '#lib'
import parseCLIArgs from '#bin/common/parse-cli-args.js'
import BufferStream from './lib/buffer-stream.cjs'

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

const ESC = String.fromCharCode(0x1b)
const ANSI_CSI = new RegExp(`${ESC}\\[`)
const ANSI_256_COLOR = new RegExp(`${ESC}\\[38;5;\\d+m`)
const ANSI_TRUECOLOR = new RegExp(`${ESC}\\[38;2;\\d+;\\d+;\\d+m`)
const ANSI_COLOR = new RegExp(`${ESC}\\[(?:\\d+;)*\\d+m`, 'g')
const supportsHexColors = (() => {
  try {
    styleText('#00ffff', '', { validateStream: false })
    return true
  } catch {
    return false
  }
})()

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

  for (const [colorMode, depth, extended] of /** @type {const} */ ([
    ['16', 24, false],
    ['auto', 8, false],
    ['auto', 24, true],
    ['256', 4, true],
  ])) {
    test(`colorMode ${colorMode} at depth ${depth}: distinct palette colors and runtime fallback`, async () => {
      const tasks = Array.from({ length: 15 }, (_, i) => `test-task:echo color-task-${i}`)
      const stdout = new TtyBufferStream(depth)
      stdout.setMaxListeners(tasks.length + 10)
      await nodeApi(tasks, { stdout, silent: true, printLabel: true, colorMode, parallel: true })
      const colors = new Set(stdout.value.match(ANSI_COLOR))
      colors.delete(`${ESC}[39m`)
      assert.equal(colors.size, extended && supportsHexColors ? 15 : 14)
      if (extended && supportsHexColors) {
        assert.match(stdout.value, ANSI_TRUECOLOR)
      } else {
        assert.doesNotMatch(stdout.value, ANSI_TRUECOLOR)
      }
      assert.doesNotMatch(stdout.value, ANSI_256_COLOR)

      const repeated = new TtyBufferStream(depth)
      await nodeApi('test-task:echo color-task-0', { stdout: repeated, silent: true, printLabel: true, colorMode })
      const repeatedColor = repeated.value.match(ANSI_COLOR)?.[0]
      assert.ok(repeatedColor)
      assert.ok(stdout.value.includes(`${repeatedColor}[test-task:echo color-task-0`))
    })
  }

  test('forced extended colors still leave non-TTY output uncolored', async () => {
    const stdout = new BufferStream()
    await nodeApi('test-task:echo hello', { stdout, silent: true, printLabel: true, colorMode: '256' })
    assert.doesNotMatch(stdout.value, ANSI_CSI)
  })
})
