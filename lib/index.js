/**
 * @module index
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { Readable, Writable } from 'node:stream'
 * @import { PackageJson } from 'read-package-json-fast'
 */

/**
 * @typedef {string | number | boolean | null | undefined} ConfigValue
 * @typedef {Record<string, ConfigValue>} ConfigMap
 * @typedef {Record<string, ConfigMap>} PackageConfigMap
 * @typedef PackageInfo
 * @property {string} path - The package.json file path.
 * @property {PackageJson} body - The package.json body.
 *
 * @typedef NpmRunAllOptions
 * @property {boolean} [parallel] - Run scripts in parallel when true; sequentially otherwise.
 * @property {Readable | null} [stdin] - Input stream for child process stdin.
 * @property {Writable | null} [stdout] - Output stream for child process stdout.
 * @property {Writable | null} [stderr] - Output stream for child process stderr.
 * @property {string[] | null} [taskList] - Actual npm script names. Reads package.json when omitted.
 * @property {ConfigMap | null} [config] - npm config values passed as `--key=value`.
 * @property {PackageConfigMap | null} [packageConfig] - Package config values passed as `--pkg:key=value`.
 * @property {string[]} [arguments] - Arguments used to replace placeholders.
 * @property {boolean} [silent] - Pass `--silent` to npm.
 * @property {boolean} [continueOnError] - Continue after failures.
 * @property {boolean} [printLabel] - Prefix each output line with its task name.
 * @property {boolean} [printName] - Print task names before running tasks.
 * @property {number} [maxParallel] - Maximum parallelism when `parallel` is true.
 * @property {string | null} [npmPath] - Path to npm.
 * @property {boolean} [race] - Abort other tasks after one parallel task succeeds.
 * @property {boolean} [aggregateOutput] - Buffer each task's stdout and write it after task completion.
 * @property {boolean} [nodeRun] - Use `node --run` instead of the package manager to run scripts.
 *
 * @typedef NpmRunAllResult
 * @property {string} name - Task name.
 * @property {number | undefined} code - Exit code, or undefined if the task was aborted before completion.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import shellQuote from 'shell-quote'
import matchTasks from './match-tasks.js'
import readPackageJson from './read-package-json.js'
import runTasks from './run-tasks.js'

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

const ARGS_PATTERN = /\{(!)?([*@%]|\d+)([^}]+)?}/g
const ARGS_UNPACK_PATTERN = /\{(!)?([%])([^}]+)?}/g

/**
 * Converts a given value to an array.
 *
 * @param {string|string[]|null|undefined} x - A value to convert.
 * @returns {string[]} An array.
 */
function toArray (x) {
  if (x == null) {
    return []
  }
  return Array.isArray(x) ? x : [x]
}

/**
 * Replaces argument placeholders (such as `{1}`) by arguments.
 *
 * @param {string[]} patterns - Patterns to replace.
 * @param {string[]} args - Arguments to replace.
 * @returns {string[]} replaced
 */
function applyArguments (patterns, args) {
  const defaults = Object.create(null)

  const unfoldedPatterns = patterns
    .flatMap(pattern => {
      const match = ARGS_UNPACK_PATTERN.exec(pattern)
      if (match && match[2] === '%') {
        const result = []
        for (let i = 0, length = args.length; i < length; i++) {
          const argPosition = i + 1
          result.push(pattern.replace(ARGS_UNPACK_PATTERN, (whole, indirectionMark, id, options) => {
            if (indirectionMark != null || options != null || id !== '%') {
              throw Error(`Invalid Placeholder: ${whole}`)
            }
            return `{${argPosition}}`
          }))
        }
        return result
      }
      return pattern
    })

  return unfoldedPatterns.map(pattern => pattern.replace(ARGS_PATTERN, (whole, indirectionMark, id, options) => {
    if (indirectionMark != null) {
      throw Error(`Invalid Placeholder: ${whole}`)
    }
    if (id === '@') {
      return shellQuote.quote(args)
    }
    if (id === '*') {
      return shellQuote.quote([args.join(' ')])
    }

    const position = parseInt(id, 10)
    if (position >= 1 && position <= args.length) {
      return shellQuote.quote([args[position - 1] ?? ''])
    }

    // Address default values
    if (options != null) {
      const prefix = options.slice(0, 2)

      if (prefix === ':=') {
        defaults[id] = shellQuote.quote([options.slice(2)])
        return defaults[id]
      }
      if (prefix === ':-') {
        return shellQuote.quote([options.slice(2)])
      }

      throw Error(`Invalid Placeholder: ${whole}`)
    }
    if (defaults[id] != null) {
      return defaults[id]
    }

    return ''
  }))
}

/**
 * Parse patterns.
 * In parsing process, it replaces argument placeholders (such as `{1}`) by arguments.
 *
 * @param {string|string[]} patternOrPatterns - Patterns to run.
 *      A pattern is a npm-script name or a Glob-like pattern.
 * @param {string[]} args - Arguments to replace placeholders.
 * @returns {string[]} Parsed patterns.
 */
function parsePatterns (patternOrPatterns, args) {
  const patterns = toArray(patternOrPatterns)
  const hasPlaceholder = patterns.some(pattern => ARGS_PATTERN.test(pattern))

  return hasPlaceholder ? applyArguments(patterns, args) : patterns
}

/**
 * Converts a given config object to an `--:=` style option array.
 *
 * @param {PackageConfigMap} config -
 *   A map-like object to overwrite package configs.
 *   Keys are package names.
 *   Every value is a map-like object (Pairs of variable name and value).
 * @returns {string[]} `--:=` style options.
 */
function toOverwriteOptions (config) {
  /** @type {string[]} */
  const options = []

  for (const packageName of Object.keys(config)) {
    const packageConfig = config[packageName]
    if (!packageConfig) {
      continue
    }

    for (const variableName of Object.keys(packageConfig)) {
      const value = packageConfig[variableName]

      options.push(`--${packageName}:${variableName}=${value}`)
    }
  }

  return options
}

/**
 * Converts a given config object to an `--a=b` style option array.
 *
 * @param {ConfigMap} config -
 *   A map-like object to set configs.
 * @returns {string[]} `--a=b` style options.
 */
function toConfigOptions (config) {
  return Object.keys(config).map(key => `--${key}=${config[key]}`)
}

/**
 * Gets the maximum length.
 *
 * @param {number} length - The current maximum length.
 * @param {string} name - A name.
 * @returns {number} The maximum length.
 */
function maxLength (length, name) {
  return Math.max(name.length, length)
}

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Runs npm-scripts which are matched with given patterns.
 *
 * @param {string|string[]} patternOrPatterns - Patterns to run.
 *   A pattern is a npm-script name or a Glob-like pattern.
 * @param {NpmRunAllOptions} [options] Optional.
 * @returns {Promise<null | NpmRunAllResult[]>}
 *   A promise object which becomes fulfilled when all npm-scripts are completed.
 */
export default function npmRunAll (patternOrPatterns, options) {
  const stdin = (options && options.stdin) || null
  const stdout = (options && options.stdout) || null
  const stderr = (options && options.stderr) || null
  const taskList = (options && options.taskList) || null
  const config = (options && options.config) || null
  const packageConfig = (options && options.packageConfig) || null
  const args = (options && options.arguments) || []
  const parallel = Boolean(options && options.parallel)
  const silent = Boolean(options && options.silent)
  const continueOnError = Boolean(options && options.continueOnError)
  const printLabel = Boolean(options && options.printLabel)
  const printName = Boolean(options && options.printName)
  const race = Boolean(options && options.race)
  const maxParallel = parallel ? ((options && options.maxParallel) || 0) : 1
  const aggregateOutput = Boolean(options && options.aggregateOutput)
  const npmPath = options && options.npmPath
  const nodeRun = Boolean(options && options.nodeRun)
  try {
    const patterns = parsePatterns(patternOrPatterns, args)
    if (patterns.length === 0) {
      return Promise.resolve(null)
    }
    if (taskList != null && Array.isArray(taskList) === false) {
      throw new Error('Invalid options.taskList')
    }
    if (typeof maxParallel !== 'number' || maxParallel < 0) {
      throw new Error('Invalid options.maxParallel')
    }
    if (!parallel && aggregateOutput) {
      throw new Error('Invalid options.aggregateOutput; It requires options.parallel')
    }
    if (!parallel && race) {
      throw new Error('Invalid options.race; It requires options.parallel')
    }

    const prefixOptions = [
      ...(silent ? ['--silent'] : []),
      ...(packageConfig ? toOverwriteOptions(packageConfig) : []),
      ...(config ? toConfigOptions(config) : []),
    ]

    return (async () => {
      const x = taskList != null
        ? { taskList, packageInfo: null }
        : await readPackageJson()
      const tasks = matchTasks(x.taskList, patterns)
      const labelWidth = tasks.reduce(maxLength, 0)

      const pkgConfig = x.packageInfo?.body?.['npm-run-all2']
      const effectiveNodeRun = nodeRun || Boolean(pkgConfig && typeof pkgConfig === 'object' && 'nodeRun' in pkgConfig && pkgConfig['nodeRun'])

      return runTasks(tasks, {
        stdin,
        stdout,
        stderr,
        prefixOptions,
        continueOnError,
        labelState: {
          enabled: printLabel,
          width: labelWidth,
          lastPrefix: null,
          lastIsLinebreak: true,
        },
        printName,
        packageInfo: x.packageInfo,
        race,
        maxParallel,
        npmPath,
        aggregateOutput,
        nodeRun: effectiveNodeRun,
      })
    })()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Promise.reject(new Error(message))
  }
}
