/**
 * @module run-task
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { Readable, Writable } from 'node:stream'
 * @import { ChildProcess, SpawnOptions } from 'node:child_process'
 * @import { PrefixState } from './create-prefix-transform-stream.js'
 * @import { PackageInfo } from './index.js'
 */

/**
 * @typedef {PrefixState & { enabled: boolean, width: number }} LabelState
 * @typedef RunTaskOptions
 * @property {Readable | null} stdin - Stream to send messages to child process stdin.
 * @property {Writable | null} stdout - Stream to receive child process stdout.
 * @property {Writable | null} stderr - Stream to receive child process stderr.
 * @property {string[]} prefixOptions - Options inserted before the task name.
 * @property {LabelState} labelState - Shared output-label state.
 * @property {boolean} printName - Print task names before running each task.
 * @property {PackageInfo | null} packageInfo - package.json metadata.
 * @property {string | null | undefined} [npmPath] - Path to npm.
 *
 * @typedef RunTaskResult
 * @property {string} task - Task name.
 * @property {number | null} code - Exit code.
 * @property {NodeJS.Signals | null} signal - Exit signal.
 *
 * @typedef {Promise<RunTaskResult> & { abort: () => void }} AbortableRunTaskPromise
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import fs from 'node:fs'
import path from 'node:path'
import mod from 'node:module'

import ansiStyles from 'ansi-styles'
import { parse as parseArgs } from 'shell-quote'
import which from 'which'

import createHeader from './create-header.js'
import createPrefixTransform from './create-prefix-transform-stream.js'
import spawn from './spawn.js'

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

/** @typedef {'cyan' | 'green' | 'magenta' | 'yellow' | 'red'} LabelColor */
const colors = /** @type {const} */ (['cyan', 'green', 'magenta', 'yellow', 'red'])

let colorIndex = 0
/** @type {Map<string, LabelColor>} */
const taskNamesToColors = new Map()

/**
 * Select a color from given task name.
 *
 * @param {string} taskName - The task name.
 * @returns {LabelColor} A color name provided by `ansi-styles`
 */
function selectColor (taskName) {
  let color = taskNamesToColors.get(taskName)
  if (!color) {
    color = colors[colorIndex] ?? 'cyan'
    colorIndex = (colorIndex + 1) % colors.length
    taskNamesToColors.set(taskName, color)
  }
  return color
}

/**
 * Wraps stdout/stderr with a transform stream to add the task name as prefix.
 *
 * @param {string} taskName - The task name.
 * @param {Writable | null} source - An output stream to be wrapped.
 * @param {LabelState} labelState - An label state for the transform stream.
 * @returns {Writable | null} `source` or the created wrapped stream.
 */
function wrapLabeling (taskName, source, labelState) {
  if (source == null || !labelState.enabled) {
    return source
  }

  const label = taskName.padEnd(labelState.width)
  const isTTY = Boolean((/** @type {Writable & { isTTY?: boolean }} */ (source)).isTTY)
  const color = isTTY ? /** @type {{ open: string, close: string }} */ (ansiStyles[selectColor(taskName)]) : { open: '', close: '' }
  const prefix = `${color.open}[${label}]${color.close} `
  const stream = createPrefixTransform(prefix, labelState)

  stream.pipe(source)

  return stream
}

/**
 * Converts a given stream to an option for `child_process.spawn`.
 *
 * @param {Readable | Writable | null} stream - An original stream to convert.
 * @param {Readable | Writable} std - A standard stream for this option.
 * @returns {'ignore' | 'pipe' | Readable | Writable} An option for `child_process.spawn`.
 */
function detectStreamKind (stream, std) {
  return (
    stream == null
      ? 'ignore' // `|| !std.isTTY` is needed for the workaround of https://github.com/nodejs/node/issues/5620
      : stream !== std || !(/** @type {Readable & { isTTY?: boolean }} */ (std)).isTTY
        ? 'pipe'
        : stream
  )
}

/**
 * Ensure the output of shell-quote's `parse()` is acceptable input to npm-cli.
 *
 * The `parse()` method of shell-quote sometimes returns special objects in its
 * output array, e.g. if it thinks some elements should be globbed. But npm-cli
 * only accepts strings and will throw an error otherwise.
 *
 * See https://github.com/substack/node-shell-quote#parsecmd-env
 *
 * @param {unknown} arg - Item in the output of shell-quote's `parse()`.
 * @returns {string} A valid argument for npm-cli.
 */
function cleanTaskArg (arg) {
  if (typeof arg === 'string') {
    return arg
  }
  if (arg && typeof arg === 'object') {
    if ('pattern' in arg && typeof arg.pattern === 'string') {
      return arg.pattern
    }
    if ('op' in arg && typeof arg.op === 'string') {
      return arg.op
    }
  }
  return ''
}

// ------------------------------------------------------------------------------
// Interface
// ------------------------------------------------------------------------------

/**
 * Run a npm-script of a given name.
 * The return value is a promise which has an extra method: `abort()`.
 * The `abort()` kills the child process to run the npm-script.
 *
 * @param {string} task - A npm-script name to run.
 * @param {RunTaskOptions} options - An option object.
 * @returns {AbortableRunTaskPromise}
 *   A promise object which becomes fulfilled when the npm-script is completed.
 *   This promise object has an extra method: `abort()`.
 * @private
 */
export default function runTask (task, options) {
  /** @type {ChildProcess | null} */
  let cp = null

  async function asyncRunTask () {
    const stdin = options.stdin
    const stdout = wrapLabeling(task, options.stdout, options.labelState)
    const stderr = wrapLabeling(task, options.stderr, options.labelState)
    const stdinKind = detectStreamKind(stdin, process.stdin)
    const stdoutKind = detectStreamKind(stdout, process.stdout)
    const stderrKind = detectStreamKind(stderr, process.stderr)
    /** @type {SpawnOptions} */
    const spawnOptions = { stdio: [stdinKind, stdoutKind, stderrKind] }

    // Print task name.
    if (options.printName && stdout != null) {
      stdout.write(createHeader(
        task,
        options.packageInfo,
        Boolean((/** @type {Writable & { isTTY?: boolean }} */ (stdout)).isTTY)
      ))
    }

    // Execute.
    let npmPath = options.npmPath
    if (!npmPath && process.env['npm_execpath']) {
      const npmExecPath = process.env['npm_execpath']
      const basename = path.basename(npmExecPath)
      let newBasename = basename
      if (basename.startsWith('npx')) {
        newBasename = basename.replace('npx', 'npm')
      } else if (basename.startsWith('pnpx')) {
        newBasename = basename.replace('pnpx', 'pnpm')
      }

      npmPath = newBasename !== basename
        ? path.join(path.dirname(npmExecPath), newBasename)
        : npmExecPath
    }

    const npmPathIsJs = typeof npmPath === 'string' && /\.(c|m)?js/.test(path.extname(npmPath))
    let execPath = (npmPathIsJs ? process.execPath : npmPath || 'npm')

    if (!npmPath && !process.env['npm_execpath'] && options.packageInfo != null) {
      // When a script is being run via pnpm, npmPath and npm_execpath will be null or undefined
      // Attempt to figure out whether we're running via pnpm
      const projectRoot = path.dirname(options.packageInfo.path)
      const hasPnpmLockfile = fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))
      const whichPnpmResults = await which('pnpm', { nothrow: true })
      const pnpmFound = whichPnpmResults?.status
      const pnpmWhichOutput = whichPnpmResults?.output
      if (hasPnpmLockfile && import.meta.dirname.split(path.sep).includes('.pnpm') && pnpmFound && pnpmWhichOutput) {
        execPath = pnpmWhichOutput
      }
    }

    const isYarn = process.env['npm_config_user_agent']?.startsWith('yarn')
    const isPnpm = Boolean(process.env['PNPM_SCRIPT_SRC_DIR'])
    const isNpm = !isYarn && !isPnpm

    const spawnArgs = ['run']

    if (npmPathIsJs && npmPath) {
      spawnArgs.unshift(npmPath)
    }
    if (isNpm) {
      Array.prototype.push.apply(spawnArgs, options.prefixOptions)
    } else if (options.prefixOptions.indexOf('--silent') !== -1) {
      spawnArgs.push('--silent')
    }
    Array.prototype.push.apply(spawnArgs, parseArgs(task).map(cleanTaskArg))

    await mod.flushCompileCache?.()

    const child = await spawn(execPath, spawnArgs, spawnOptions)
    cp = child

    // Piping stdio.
    if (stdinKind === 'pipe' && stdin != null && child.stdin != null) {
      stdin.pipe(child.stdin)
    }
    if (stdoutKind === 'pipe' && stdout != null && child.stdout != null) {
      child.stdout.pipe(stdout, { end: false })
    }
    if (stderrKind === 'pipe' && stderr != null && child.stderr != null) {
      child.stderr.pipe(stderr, { end: false })
    }

    return new Promise((resolve, reject) => {
      // Register
      child.on('error', (err) => {
        cp = null
        reject(err)
      })
      child.on('close', (code, signal) => {
        cp = null
        resolve({ task, code, signal })
      })
    })
  }

  const promise = /** @type {AbortableRunTaskPromise} */ (/** @type {unknown} */ (asyncRunTask()))

  promise.abort = function abort () {
    if (cp != null) {
      cp.kill()
      cp = null
    }
  }

  return promise
}
