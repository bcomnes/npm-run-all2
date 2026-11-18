/**
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, test } from 'node:test'
import allHelp from '../bin/npm-run-all/help.js'
import parallelHelp from '../bin/run-p/help.js'
import sequentialHelp from '../bin/run-s/help.js'
import BufferStream from './lib/buffer-stream.cjs'

const execFileAsync = promisify(execFile)
const commands = /** @type {const} */ ([
  ['npm-run-all', allHelp],
  ['run-p', parallelHelp],
  ['run-s', sequentialHelp]
])

describe('[cli-help] stream output', () => {
  for (const [command, printHelp] of commands) {
    test(`${command} documents only its relevant options`, async () => {
      const output = new BufferStream()
      assert.equal(await printHelp(output), null)
      assert.match(output.value, new RegExp(`Usage:\\s+\\$ ${command} `))
      assert.match(output.value, /--continue-on-error, -c\s+Continue/)
      if (command !== 'run-s') {
        assert.match(output.value, /--max-parallel <number>\s+Set/)
      }
      if (command === 'npm-run-all') {
        assert.match(output.value, /-p, --parallel <tasks>\s+Run/)
      }
      const optionList = output.value.split('Options:\n')[1]?.split('\n    Shorthand aliases')[0]
      assert.ok(optionList)
      let continuationLines = 0
      for (const line of optionList.split('\n').filter(Boolean)) {
        assert.ok(line.length <= 79, `${command}: help line exceeds 79 columns: ${line}`)
        if (!/^ {4}\S/.test(line)) {
          assert.match(line, /^ {27}\S/, `${command}: continuation line must start at column 27`)
          continuationLines++
        }
      }
      assert.ok(continuationLines > 0, `${command}: long descriptions should wrap`)
      // The npm-path description legitimately says "if undefined."
      assert.doesNotMatch(output.value.replace('if undefined.', ''), /\bundefined\b/)
      const options = output.value.split('Options:')[1]?.split('Examples:')[0]?.replace(/\s+/g, ' ')
      assert.ok(options)
      for (const flag of ['--continue-on-error', '--print-label', '--print-name', '--silent', '--npm-path', '--node-run', '--help', '--version']) {
        assert.ok(options.includes(flag), `${command} should document ${flag}`)
      }
      assert.match(options, /--color-mode <mode>/)
      assert.match(options, /auto \(default/)
      assert.match(options, /none \(disable colors\)/)
      assert.match(options, /16 \(named colors\)/)
      assert.match(options, /256 \(ANSI colors\)/)
      if (command === 'npm-run-all') {
        assert.match(options, /-p, --parallel <tasks>/)
        assert.match(options, /-s, --sequential <tasks>/)
        assert.match(options, /--serial/)
      } else {
        assert.doesNotMatch(options, /--parallel|--sequential|--serial/)
        assert.match(options, /(?:-s, --silent|--silent, -s)/)
      }
      for (const flag of ['--race', '--aggregate-output', '--max-parallel']) {
        assert.equal(options.includes(flag), command !== 'run-s', `${command}: ${flag}`)
      }
    })
  }
})

describe('[cli-help] entrypoint precedence', () => {
  for (const [command] of commands) {
    const entrypoint = fileURLToPath(new URL(`../bin/${command}/index.js`, import.meta.url))

    test(`${command} prints help when no arguments or help comes first`, async () => {
      for (const args of [[], ['--help', '--version', '--invalid'], ['-h', '-v', '--invalid']]) {
        const { stdout, stderr } = await execFileAsync(process.execPath, [entrypoint, ...args], { timeout: 10000 })
        assert.match(stdout, new RegExp(`Usage:\\s+\\$ ${command} `))
        assert.doesNotMatch(stdout.replace('if undefined.', ''), /\bundefined\b/)
        assert.equal(stderr, '')
      }
    })

    test(`${command} prints only the version when version comes first`, async () => {
      const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
      for (const args of [['--version', '--help', '--invalid'], ['-v', '-h', '--invalid']]) {
        const { stdout, stderr } = await execFileAsync(process.execPath, [entrypoint, ...args], { timeout: 10000 })
        assert.equal(stdout.trim(), `v${version}`)
        assert.equal(stderr, '')
      }
    })

    test(`${command} does not recognize help or version after a parser flag`, async () => {
      // No task names are supplied, and parsing must fail before any task can run.
      for (const flag of ['--help', '-h', '--version', '-v']) {
        await assert.rejects(
          execFileAsync(process.execPath, [entrypoint, '--print-name', flag], { timeout: 10000 }),
          { code: 1, stdout: '', stderr: `ERROR: Invalid Option: ${flag}\n` }
        )
      }
    })
  }
})
