/**
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'
import parseCLIArgs from '#bin/common/parse-cli-args.js'

describe('[parse-cli-args] legacy characterization', () => {
  /** @type {[string, string | undefined][]} */
  let saved = []

  beforeEach(() => {
    const keys = Object.keys(process.env).filter(key =>
      key === 'npm_package_name' || key === 'npm_config_loglevel' || key.startsWith('npm_package_config_')
    )
    saved = keys.map(key => [key, process.env[key]])
    for (const key of keys) delete process.env[key]
  })

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key === 'npm_package_name' || key === 'npm_config_loglevel' || key.startsWith('npm_package_config_')) {
        delete process.env[key]
      }
    }
    for (const [key, value] of saved) {
      if (value !== undefined) process.env[key] = value
    }
  })

  test('defaults include one empty sequential group', () => {
    const set = parseCLIArgs([])
    assert.deepEqual({ ...set }, {
      config: {},
      continueOnError: false,
      groups: [{ parallel: false, patterns: [] }],
      maxParallel: 0,
      npmPath: null,
      packageConfig: {},
      printLabel: false,
      printName: false,
      race: false,
      aggregateOutput: false,
      colorMode: 'auto',
      rest: [],
      silent: false,
      singleMode: false,
      nodeRun: undefined
    })
    assert.equal(set.parallel, false)
    assert.equal(set.lastGroup, set.groups[0])
  })

  test('group switches preserve order, duplicates, and empty groups', () => {
    const set = parseCLIArgs(['clean', '-p', 'build', 'build', '--parallel', '-s', 'lint', '--serial', 'test', '--sequential'])
    assert.deepEqual(set.groups, [
      { parallel: false, patterns: ['clean'] },
      { parallel: true, patterns: ['build', 'build'] },
      { parallel: true, patterns: [] },
      { parallel: false, patterns: ['lint'] },
      { parallel: false, patterns: ['test'] },
      { parallel: false, patterns: [] }
    ])
    assert.equal(set.parallel, true)
    assert.equal(set.lastGroup, set.groups[5])
    assert.equal(set.silent, false)
  })

  test('initial values apply only to the first group', () => {
    const set = parseCLIArgs(['build', '--serial', 'lint'], { parallel: true, patterns: ['seed'] })
    assert.deepEqual(set.groups, [
      { parallel: true, patterns: ['seed', 'build'] },
      { parallel: false, patterns: ['lint'] }
    ])
  })

  test('-s means silent only in singleMode', () => {
    for (const parallel of [false, true]) {
      const set = parseCLIArgs(['-s', 'build', '-s'], { parallel }, { singleMode: true })
      assert.equal(set.silent, true)
      assert.equal(set.singleMode, true)
      assert.deepEqual(set.groups, [{ parallel, patterns: ['build'] }])
    }
  })

  test('singleMode rejects grouping options, including bundled -p', () => {
    for (const arg of ['-p', '--parallel', '--sequential', '--serial', '-clp']) {
      assert.throws(
        () => parseCLIArgs([arg], { parallel: true }, { singleMode: true }),
        { message: `Invalid Option: ${arg === '-clp' ? '-p' : arg}` }
      )
    }
  })

  test('accepted bundles expand in order and support repeated letters', () => {
    const set = parseCLIArgs(['-clnppsrx', 'build'])
    assert.equal(set.continueOnError, true)
    assert.equal(set.printLabel, true)
    assert.equal(set.printName, true)
    assert.equal(set.race, true)
    assert.equal(set.nodeRun, true)
    assert.deepEqual(set.groups, [
      { parallel: false, patterns: [] },
      { parallel: true, patterns: [] },
      { parallel: true, patterns: [] },
      { parallel: false, patterns: ['build'] }
    ])
    const single = parseCLIArgs(['-clnsx'], undefined, { singleMode: true })
    assert.equal(single.silent, true)
    assert.equal(single.groups.length, 1)
    assert.equal(single.nodeRun, true)
  })

  test('unknown letters, value-taking options, help, and version cannot be bundled', () => {
    for (const arg of ['-clz', '-clh', '-clv', '-m2', '-clN', '-', '--unknown', '-h', '--help', '-v', '--version']) {
      assert.throws(() => parseCLIArgs([arg]), { message: `Invalid Option: ${arg}` })
    }
  })

  test('bundle validation happens before a later parallel switch', () => {
    assert.throws(() => parseCLIArgs(['-rc', '-p']), { message: 'Invalid Option: -r (without parallel)' })
    assert.equal(parseCLIArgs(['-r', '-c', '-p']).race, true)
    assert.equal(parseCLIArgs(['-rcp']).race, true)
    assert.equal(parseCLIArgs(['-p', '-rc']).race, true)
    assert.throws(() => parseCLIArgs(['--aggregate-output', '-cl', '-p']), {
      message: 'Invalid Option: --aggregate-output (without parallel)'
    })
    assert.throws(() => parseCLIArgs(['--max-parallel', '2', '-cl', '-p']), {
      message: 'Invalid Option: --max-parallel (without parallel)'
    })
  })

  test('arbitrary equals config is forwarded, including built-in names', () => {
    const set = parseCLIArgs([
      '--custom=first', '--custom=last=value', '--parallel=true', '--silent=true',
      '--max-parallel=2', '--npm-path=custom-npm', '--color-mode=invalid', '--node-run=false'
    ])
    assert.deepEqual(set.config, {
      custom: 'last=value',
      parallel: 'true',
      silent: 'true',
      'max-parallel': '2',
      'npm-path': 'custom-npm',
      'color-mode': 'invalid',
      'node-run': 'false'
    })
    assert.equal(set.parallel, false)
    assert.equal(set.silent, false)
    assert.equal(set.maxParallel, 0)
    assert.equal(set.npmPath, null)
    assert.equal(set.colorMode, 'auto')
    assert.equal(set.nodeRun, undefined)
  })

  test('empty config assignments and malformed options are rejected', () => {
    for (const arg of ['--custom=', '--silent=', '--=value', '--pkg:key=', '--pkg:', '--:key']) {
      assert.throws(() => parseCLIArgs([arg]), { message: `Invalid Option: ${arg}` })
    }
  })

  test('package config supports equals and next-argument forms with last value winning', () => {
    const set = parseCLIArgs(['--pkg:key=first=part', '--pkg:key', 'second', '--other:flag=yes', 'build'])
    assert.deepEqual(set.packageConfig, { pkg: { key: 'second' }, other: { flag: 'yes' } })
    assert.deepEqual(set.config, {})
    assert.deepEqual(set.lastGroup.patterns, ['build'])
    assert.deepEqual(parseCLIArgs(['--pkg:key=first=part']).packageConfig, { pkg: { key: 'first=part' } })
  })

  test('package config consumes empty, missing, and option-looking next values', () => {
    for (const args of [['--pkg:key'], ['--pkg:key', '']]) {
      assert.deepEqual(parseCLIArgs(args).packageConfig, { pkg: { key: '' } })
    }
    for (const value of ['-p', '--silent', '--']) {
      const set = parseCLIArgs(['--pkg:key', value, 'build'])
      assert.deepEqual(set.packageConfig, { pkg: { key: value } })
      assert.equal(set.parallel, false)
      assert.equal(set.silent, false)
      assert.deepEqual(set.rest, [])
      assert.deepEqual(set.lastGroup.patterns, ['build'])
    }
  })

  test('environment package config requires a package name and can be overridden', () => {
    process.env['npm_package_config_port'] = '3000'
    process.env['npm_package_config_empty'] = ''
    process.env['npm_package_config_'] = 'ignored'
    assert.deepEqual(parseCLIArgs([]).packageConfig, {})
    process.env['npm_package_name'] = 'fixture'
    assert.deepEqual(parseCLIArgs([]).packageConfig, { fixture: { port: '3000', empty: '' } })
    assert.deepEqual(parseCLIArgs(['--fixture:port=4000']).packageConfig, { fixture: { port: '4000', empty: '' } })
    process.env['npm_package_name'] = ''
    assert.deepEqual(parseCLIArgs([]).packageConfig, {})
  })

  test('only the exact silent loglevel enables silent by default', () => {
    for (const value of ['silent', 'warn', 'Silent', '']) {
      process.env['npm_config_loglevel'] = value
      assert.equal(parseCLIArgs([]).silent, value === 'silent')
    }
    assert.equal(parseCLIArgs(['--silent']).silent, true)
  })

  test('-- preserves all remaining arguments literally, including empty strings', () => {
    const args = ['build', '', '--', '-p', '--unknown', '--custom=', '--', '']
    const original = [...args]
    const set = parseCLIArgs(args)
    assert.deepEqual(set.lastGroup.patterns, ['build', ''])
    assert.deepEqual(set.rest, ['-p', '--unknown', '--custom=', '--', ''])
    assert.deepEqual(set.config, {})
    assert.equal(set.parallel, false)
    assert.deepEqual(args, original)
    assert.deepEqual(parseCLIArgs(['--']).rest, [])
    assert.throws(() => parseCLIArgs(['--race', '--', '-p']), { message: 'Invalid Option: --race (without parallel)' })
  })

  test('npm-path accepts missing, empty, repeated, and dash-prefixed values', () => {
    for (const args of [['--npm-path'], ['--npm-path', '']]) {
      assert.equal(parseCLIArgs(args).npmPath, null)
    }
    for (const value of ['npm-custom', '-p', '--silent', '--']) {
      const set = parseCLIArgs(['--npm-path', value, 'build'])
      assert.equal(set.npmPath, value)
      assert.equal(set.parallel, false)
      assert.equal(set.silent, false)
      assert.deepEqual(set.lastGroup.patterns, ['build'])
    }
    assert.equal(parseCLIArgs(['--npm-path', 'first', '--npm-path', 'second']).npmPath, 'second')
  })

  test('max-parallel uses decimal parseInt rather than strict numeric validation', () => {
    for (const [raw, expected] of /** @type {[string, number][]} */ ([['2', 2], ['2.9', 2], ['3tasks', 3], ['1e2', 1], [' +4 ', 4], ['05', 5]])) {
      assert.equal(parseCLIArgs(['--max-parallel', raw, '-p']).maxParallel, expected)
    }
    assert.equal(parseCLIArgs(['-p', '--max-parallel', '2', '--max-parallel', '3']).maxParallel, 3)
    for (const values of [[], [''], ['0'], ['-1'], ['0x10'], ['Infinity'], ['nope'], ['-p']]) {
      assert.throws(() => parseCLIArgs(['-p', '--max-parallel', ...values]), {
        message: `Invalid Option: --max-parallel ${values[0] ?? ''}`
      })
    }
  })

  test('color-mode validates values and last value wins; compatibility color flags do nothing', () => {
    for (const mode of ['auto', 'none', '16', '256']) {
      assert.equal(parseCLIArgs(['--color-mode', mode]).colorMode, mode)
    }
    for (const values of [[], [''], ['truecolor'], ['AUTO'], ['--no-color']]) {
      assert.throws(() => parseCLIArgs(['--color-mode', ...values]), {
        message: `Invalid Option: --color-mode ${values[0] ?? ''} (expected auto, none, 16, or 256)`
      })
    }
    const set = parseCLIArgs(['--color-mode', '16', '--color-mode', 'none', '--color', '--no-color'])
    assert.equal(set.colorMode, 'none')
    assert.equal(parseCLIArgs(['--color', '--no-color']).colorMode, 'auto')
  })

  test('long and short flag aliases set the same properties', () => {
    const short = parseCLIArgs(['-p', '-c', '-l', '-n', '-r', '-x', '--silent', '--aggregate-output'])
    const long = parseCLIArgs(['--parallel', '--continue-on-error', '--print-label', '--print-name', '--race', '--node-run', '--silent', '--aggregate-output'])
    assert.deepEqual({ ...short }, { ...long })
    for (const value of [long.continueOnError, long.printLabel, long.printName, long.race, long.nodeRun, long.silent, long.aggregateOutput]) {
      assert.equal(value, true)
    }
  })

  test('parallel-only constraints consider any group, not just the last one', () => {
    for (const args of [['--aggregate-output'], ['--race'], ['-r'], ['--max-parallel', '2']]) {
      assert.throws(() => parseCLIArgs(args), { message: `Invalid Option: ${args[0]} (without parallel)` })
      const set = parseCLIArgs([...args, '-p', 'build', '-s', 'lint'])
      assert.equal(set.parallel, true)
      assert.equal(set.lastGroup.parallel, false)
      assert.doesNotThrow(() => parseCLIArgs(args, { parallel: true }, { singleMode: true }))
      assert.throws(() => parseCLIArgs(args, { parallel: false }, { singleMode: true }))
    }
  })
})
