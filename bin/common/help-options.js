/**
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { ArgscloptsParseArgsOptionsConfig } from 'argsclopts'
 */

/**
 * Get shared option metadata for help formatting, independently of CLI parsing.
 *
 * @param {boolean} [singleMode=false] - Whether -s means --silent instead of --sequential.
 * @returns {ArgscloptsParseArgsOptionsConfig} Options documented in command help.
 */
export function getHelpOptions (singleMode = false) {
  return {
    'aggregate-output': {
      type: 'boolean',
      help: 'Avoid interleaving output by delaying printing of each command\'s output until it has finished. Valid only in parallel mode.'
    },
    'continue-on-error': {
      type: 'boolean',
      short: 'c',
      help: 'Continue executing other/subsequent tasks even if a task throws an error. The command still exits with a non-zero code if one or more tasks fail.'
    },
    'color-mode': {
      type: 'string',
      helpLabel: '--color-mode <mode>',
      help: 'Override the color palette for task labels with --print-label: auto (default, detect terminal capabilities), none (disable colors), 16 (named colors), or 256 (ANSI colors).'
    },
    'max-parallel': {
      type: 'string',
      helpLabel: '--max-parallel <number>',
      help: 'Set the maximum number of tasks running in parallel. Default is unlimited. Valid only in parallel mode.'
    },
    'npm-path': {
      type: 'string',
      helpLabel: '--npm-path <string>',
      help: 'Set the path to npm. Defaults to the npm_execpath environment variable, or "npm" if undefined. In that case, npm must be found in PATH.'
    },
    'print-label': {
      type: 'boolean',
      short: 'l',
      help: 'Print the task name as a prefix on each line of output. Tools in tasks may stop coloring their output with this option.'
    },
    'print-name': {
      type: 'boolean',
      short: 'n',
      help: 'Print the task name before running each task.'
    },
    parallel: {
      type: 'boolean',
      short: 'p',
      helpLabel: '-p, --parallel <tasks>',
      help: 'Run a group of tasks in parallel. For example, "npm-run-all -p foo bar" is similar to "npm run foo & npm run bar".'
    },
    race: {
      type: 'boolean',
      short: 'r',
      help: 'Kill all tasks when a task finishes with exit code zero. Valid only in parallel mode.'
    },
    sequential: {
      type: 'boolean',
      ...(!singleMode ? { short: 's' } : {}),
      helpLabel: singleMode ? '--sequential <tasks>' : '-s, --sequential <tasks>',
      help: 'Run a group of tasks sequentially. For example, "npm-run-all -s foo bar" is similar to "npm run foo && npm run bar". --serial is a synonym of --sequential.'
    },

    silent: {
      type: 'boolean',
      ...(singleMode ? { short: 's' } : {}),
      help: 'Set the log level of npm to silent.'
    },
    'node-run': {
      type: 'boolean',
      short: 'x',
      help: 'Use `node --run` to execute scripts instead of the package manager. This is faster but intentionally omits pre/post lifecycle hooks and npm_* environment variables. node_modules/.bin is still added to PATH. Sets NODE_RUN_SCRIPT_NAME and NODE_RUN_PACKAGE_JSON_PATH instead. Can also be enabled project-wide by setting `"npm-run-all2": { "nodeRun": true }` in package.json.'
    },

    help: {
      type: 'boolean',
      short: 'h',
      help: 'Print this help text.'
    },
    version: {
      type: 'boolean',
      short: 'v',
      help: 'Print the version number.'
    }
  }
}
