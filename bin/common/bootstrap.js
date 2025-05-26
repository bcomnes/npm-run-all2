/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

export default async function bootstrap (name) {
  const argv = process.argv.slice(2)

  switch (argv[0]) {
    case undefined:
    case '-h':
    case '--help': {
      const { default: help } = await import(`../${name}/help.js`)
      return help(process.stdout)
    }

    case '-v':
    case '--version': {
      const { default: version } = await import('./version.js')
      return version(process.stdout)
    }

    default: {
      // https://github.com/mysticatea/npm-run-all/issues/105
      // Avoid MaxListenersExceededWarnings.
      process.stdout.setMaxListeners(0)
      process.stderr.setMaxListeners(0)
      process.stdin.setMaxListeners(0)

      // Main
      const { default: main } = await import(`../${name}/main.js`)
      return main(
        argv,
        process.stdout,
        process.stderr
      ).then(
        () => {
          // I'm not sure why, but maybe the process never exits
          // on Git Bash (MINGW64)
          process.exit(0)
        },
        () => {
          process.exit(1)
        }
      )
    }
  }
}
