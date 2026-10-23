import { test, describe, before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import parseCLIArgs from '#bin/common/parse-cli-args.js'
import { result, removeResult, runAll, runPar } from './lib/util.cjs'

const originalMaxParallel = process.env['RUN_P_MAX_PARALLEL']

beforeEach(() => {
  delete process.env['RUN_P_MAX_PARALLEL']
})

afterEach(() => {
  if (originalMaxParallel === undefined) {
    delete process.env['RUN_P_MAX_PARALLEL']
  } else {
    process.env['RUN_P_MAX_PARALLEL'] = originalMaxParallel
  }
})

describe('[max-parallel environment] CLI argument parsing', () => {
  test('keeps unlimited parallelism when the variable is unset', () => {
    assert.equal(parseCLIArgs(['--parallel']).maxParallel, 0)
  })

  test('keeps unlimited parallelism when the variable is empty', () => {
    process.env['RUN_P_MAX_PARALLEL'] = ''
    assert.equal(parseCLIArgs(['--parallel']).maxParallel, 0)
  })

  test('uses the environment default for npm-run-all', () => {
    process.env['RUN_P_MAX_PARALLEL'] = '2'
    assert.equal(parseCLIArgs(['--parallel']).maxParallel, 2)
  })

  test('uses the environment default for run-p', () => {
    process.env['RUN_P_MAX_PARALLEL'] = '2'
    assert.equal(parseCLIArgs([], { parallel: true }, { singleMode: true }).maxParallel, 2)
  })

  test('an explicit flag overrides the environment default', () => {
    process.env['RUN_P_MAX_PARALLEL'] = '2'
    assert.equal(parseCLIArgs(['--parallel', '--max-parallel', '3']).maxParallel, 3)
  })

  test('an explicit flag overrides an invalid environment value', () => {
    process.env['RUN_P_MAX_PARALLEL'] = 'invalid'
    assert.equal(parseCLIArgs(['--parallel', '--max-parallel', '3']).maxParallel, 3)
  })

  test('an environment default does not hide an invalid explicit flag', () => {
    process.env['RUN_P_MAX_PARALLEL'] = '2'
    assert.throws(() => parseCLIArgs(['--parallel', '--max-parallel', '0']), /Invalid Option/)
  })

  for (const value of ['0', '-1', 'invalid', 'Infinity']) {
    test(`rejects an invalid parallel environment value: ${value}`, () => {
      process.env['RUN_P_MAX_PARALLEL'] = value
      assert.throws(() => parseCLIArgs(['--parallel']), /Invalid Environment Variable: RUN_P_MAX_PARALLEL/)
    })
  }

  for (const value of ['2', 'invalid']) {
    test(`ignores the environment for sequential commands: ${value}`, () => {
      process.env['RUN_P_MAX_PARALLEL'] = value
      assert.equal(parseCLIArgs([]).maxParallel, 0)
      assert.equal(parseCLIArgs([], undefined, { singleMode: true }).maxParallel, 0)
    })
  }
})

describe('[max-parallel environment] CLI execution', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))
  beforeEach(() => removeResult())

  test('limits npm-run-all parallel tasks', async () => {
    process.env['RUN_P_MAX_PARALLEL'] = '1'
    await runAll(['--parallel', 'test-task:append a', 'test-task:append b'])
    assert.equal(result(), 'aabb')
  })

  test('limits run-p parallel tasks', async () => {
    process.env['RUN_P_MAX_PARALLEL'] = '1'
    await runPar(['test-task:append a', 'test-task:append b'])
    assert.equal(result(), 'aabb')
  })
})
