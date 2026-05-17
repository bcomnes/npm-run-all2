/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

const OVERWRITE_OPTION = /^--([^:]+?):([^=]+?)(?:=(.+))?$/
const CONFIG_OPTION = /^--([^=]+?)(?:=(.+))$/
const PACKAGE_CONFIG_PATTERN = /^npm_package_config_(.+)$/
const CONCAT_OPTIONS = /^-[clnprs]+$/

/**
 * @typedef {Record<string, string>} ConfigMap
 * @typedef {Record<string, ConfigMap>} PackageConfigMap
 * @typedef CliGroup
 * @property {boolean} parallel - Whether this group runs in parallel.
 * @property {string[]} patterns - Task patterns in this group.
 * @typedef {Partial<CliGroup>} InitialValues
 * @typedef ArgumentSetOptions
 * @property {boolean} [singleMode] - The flag to be single group mode.
 */

/**
 * Overwrites a specified package config.
 *
 * @param {PackageConfigMap} config - A config object to be overwritten.
 * @param {string} packageName - A package name to overwrite.
 * @param {string} variable - A variable name to overwrite.
 * @param {string} value - A new value to overwrite.
 * @returns {void}
 */
function overwriteConfig (config, packageName, variable, value) {
  const scope = config[packageName] || (config[packageName] = {})
  scope[variable] = value
}

/**
 * Creates a package config object.
 * This checks `process.env` and creates the default value.
 *
 * @returns {PackageConfigMap} Created config object.
 */
function createPackageConfig () {
  /** @type {PackageConfigMap} */
  const retv = {}
  const packageName = process.env['npm_package_name']
  if (!packageName) {
    return retv
  }

  for (const key of Object.keys(process.env)) {
    const m = PACKAGE_CONFIG_PATTERN.exec(key)
    if (m != null && m[1] && process.env[key] != null) {
      overwriteConfig(retv, packageName, m[1], process.env[key])
    }
  }

  return retv
}

/**
 * Adds a new group into a given list.
 *
 * @param {CliGroup[]} groups - A group list to add.
 * @param {InitialValues} [initialValues] - A key-value map for the default of new value.
 * @returns {void}
 */
function addGroup (groups, initialValues) {
  groups.push({
    parallel: false,
    patterns: [],
    ...(initialValues || {})
  })
}

/**
 * ArgumentSet is values of parsed CLI arguments.
 * This class provides the getter to get the last group.
 */
class ArgumentSet {
  /**
     * @param {InitialValues} [initialValues] - A key-value map for the default of new value.
     * @param {ArgumentSetOptions} [options] - A key-value map for the options.
     */
  constructor (initialValues, options) {
    /** @type {ConfigMap} */
    this.config = {}
    /** @type {boolean} */
    this.continueOnError = false
    /** @type {CliGroup[]} */
    this.groups = []
    /** @type {number} */
    this.maxParallel = 0
    /** @type {string | null} */
    this.npmPath = null
    /** @type {PackageConfigMap} */
    this.packageConfig = createPackageConfig()
    /** @type {boolean} */
    this.printLabel = false
    /** @type {boolean} */
    this.printName = false
    /** @type {boolean} */
    this.race = false
    /** @type {boolean} */
    this.aggregateOutput = false
    /** @type {string[]} */
    this.rest = []
    /** @type {boolean} */
    this.silent = process.env['npm_config_loglevel'] === 'silent'
    /** @type {boolean} */
    this.singleMode = Boolean(options?.singleMode)

    addGroup(this.groups, initialValues)
  }

  /**
     * Gets the last group.
     */
  get lastGroup () {
    const group = this.groups[this.groups.length - 1]
    if (!group) {
      throw new Error('No argument group exists.')
    }
    return group
  }

  /**
     * Gets "parallel" flag.
     */
  get parallel () {
    return this.groups.some(g => g.parallel)
  }
}

/**
 * Parses CLI arguments.
 *
 * @param {ArgumentSet} set - The parsed CLI arguments.
 * @param {string[]} args - CLI arguments.
 * @returns {ArgumentSet} set itself.
 */
function parseCLIArgsCore (set, args) {
  LOOP: // eslint-disable-line no-labels
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i]
    if (arg == null) {
      continue
    }

    switch (arg) {
      case '--':
        set.rest = args.slice(1 + i)
        break LOOP // eslint-disable-line no-labels

      case '--color':
      case '--no-color':
        // do nothing.
        break

      case '-c':
      case '--continue-on-error':
        set.continueOnError = true
        break

      case '-l':
      case '--print-label':
        set.printLabel = true
        break

      case '-n':
      case '--print-name':
        set.printName = true
        break

      case '-r':
      case '--race':
        set.race = true
        break

      case '--silent':
        set.silent = true
        break

      case '--max-parallel':
        {
          const rawMaxParallel = args[++i]
          set.maxParallel = parseInt(rawMaxParallel ?? '', 10)
          if (!Number.isFinite(set.maxParallel) || set.maxParallel <= 0) {
            throw new Error(`Invalid Option: --max-parallel ${rawMaxParallel ?? ''}`)
          }
        }
        break

      case '-s':
      case '--sequential':
      case '--serial':
        if (set.singleMode && arg === '-s') {
          set.silent = true
          break
        }
        if (set.singleMode) {
          throw new Error(`Invalid Option: ${arg}`)
        }
        addGroup(set.groups)
        break

      case '--aggregate-output':
        set.aggregateOutput = true
        break

      case '-p':
      case '--parallel':
        if (set.singleMode) {
          throw new Error(`Invalid Option: ${arg}`)
        }
        addGroup(set.groups, { parallel: true })
        break

      case '--npm-path':
        set.npmPath = args[++i] || null
        break

      default: {
        let matched = null
        if ((matched = OVERWRITE_OPTION.exec(arg))) {
          overwriteConfig(
            set.packageConfig,
            matched[1] ?? '',
            matched[2] ?? '',
            matched[3] ?? args[++i] ?? ''
          )
        } else if ((matched = CONFIG_OPTION.exec(arg))) {
          const configName = matched[1]
          if (configName) {
            set.config[configName] = matched[2] ?? ''
          }
        } else if (CONCAT_OPTIONS.test(arg)) {
          parseCLIArgsCore(
            set,
            arg.slice(1).split('').map(c => `-${c}`)
          )
        } else if (arg.startsWith('-')) {
          throw new Error(`Invalid Option: ${arg}`)
        } else {
          set.lastGroup.patterns.push(arg)
        }

        break
      }
    }
  }

  if (!set.parallel && set.aggregateOutput) {
    throw new Error('Invalid Option: --aggregate-output (without parallel)')
  }
  if (!set.parallel && set.race) {
    const race = args.indexOf('--race') !== -1 ? '--race' : '-r'
    throw new Error(`Invalid Option: ${race} (without parallel)`)
  }
  if (!set.parallel && set.maxParallel !== 0) {
    throw new Error('Invalid Option: --max-parallel (without parallel)')
  }

  return set
}

/**
 * Parses CLI arguments.
 *
 * @param {string[]} args - CLI arguments.
 * @param {InitialValues} [initialValues] - A key-value map for the default of new value.
 * @param {ArgumentSetOptions} [options] - A key-value map for the options.
 * @returns {ArgumentSet} The parsed CLI arguments.
 */
export default function parseCLIArgs (args, initialValues, options) {
  return parseCLIArgsCore(new ArgumentSet(initialValues, options), args)
}
