/**
 * @author Bret Comnes
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import nodeApi from '#lib'
import { delay, result, removeResult, runAll, runPar, runSeq } from './lib/util.cjs'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('[node-run]', () => {
  before(() => process.chdir('test-workspace'))
  after(() => process.chdir('..'))

  beforeEach(() => delay(1000).then(removeResult))

  describe('package.json nodeRun defaults', () => {
    const lifecycleTask = 'test-task:node-run-lifecycle'

    /**
     * @param {boolean | string | number | undefined} nodeRun
     * @param {() => Promise<void>} callback
     */
    async function withPackageNodeRun (nodeRun, callback) {
      const original = readFileSync('package.json')
      const pkg = JSON.parse(original.toString('utf8'))
      pkg['npm-run-all2'] = { ...pkg['npm-run-all2'], nodeRun }

      try {
        writeFileSync('package.json', JSON.stringify(pkg, null, 2))
        await callback()
      } finally {
        writeFileSync('package.json', original)
      }
    }

    for (const packageNodeRun of [undefined, false, true]) {
      for (const nodeRun of [undefined, false, true]) {
        for (const suppliedTaskList of [false, true]) {
          test(`Node API ignores package nodeRun=${packageNodeRun} with option=${nodeRun} and taskList=${suppliedTaskList}`, async () => {
            await withPackageNodeRun(packageNodeRun, async () => {
              const results = await nodeApi([lifecycleTask], {
                ...(nodeRun === undefined ? {} : { nodeRun }),
                ...(suppliedTaskList ? { taskList: [lifecycleTask] } : {}),
              })
              assert.ok(results != null)
              assert.strictEqual(results.length, 1)
              assert.strictEqual(results[0]?.code, 0)
              assert.strictEqual(result(), nodeRun === true ? 'main' : 'premainpost')
            })
          })
        }
      }
    }

    for (const { name, run } of [
      { name: 'npm-run-all', run: runAll },
      { name: 'run-s', run: runSeq },
      { name: 'run-p', run: runPar },
    ]) {
      for (const packageNodeRun of [undefined, false, true, 'true', 1]) {
        test(`${name} honors only literal package nodeRun=true (value=${JSON.stringify(packageNodeRun)})`, async () => {
          await withPackageNodeRun(packageNodeRun, async () => {
            await run([lifecycleTask])
            assert.strictEqual(result(), packageNodeRun === true ? 'main' : 'premainpost')
          })
        })
      }

      for (const flag of ['--node-run', '-x']) {
        test(`${name} ${flag} overrides package nodeRun=false`, async () => {
          await withPackageNodeRun(false, async () => {
            await run([flag, lifecycleTask])
            assert.strictEqual(result(), 'main')
          })
        })
      }
    }

    for (const { packageNodeRun, flags, expected } of [
      { packageNodeRun: true, flags: [], expected: 'mainmainmain' },
      { packageNodeRun: false, flags: [], expected: 'premainpostpremainpostpremainpost' },
      { packageNodeRun: false, flags: ['--node-run'], expected: 'mainmainmain' },
    ]) {
      test(`npm-run-all applies nodeRun to mixed groups (package=${packageNodeRun}, flags=${flags.join(' ')})`, async () => {
        await withPackageNodeRun(packageNodeRun, async () => {
          await runAll([
            ...flags,
            lifecycleTask,
            '-p', lifecycleTask,
            '-s', lifecycleTask,
          ])
          assert.strictEqual(result(), expected)
        })
      })
    }
  })

  describe('should run tasks sequentially with --node-run:', () => {
    test('Node API', async () => {
      const results = await nodeApi(
        ['test-task:append a', 'test-task:append b'],
        { parallel: false, nodeRun: true }
      )
      assert.ok(results != null)
      assert.strictEqual(results.length, 2)
      assert.strictEqual(results[0]?.code, 0)
      assert.strictEqual(results[1]?.code, 0)
      assert.strictEqual(result(), 'aabb')
    })

    test('run-s command (--node-run)', async () => {
      await runSeq(['--node-run', 'test-task:append a', 'test-task:append b'])
      assert.strictEqual(result(), 'aabb')
    })

    test('run-s command (-x)', async () => {
      await runSeq(['-x', 'test-task:append a', 'test-task:append b'])
      assert.strictEqual(result(), 'aabb')
    })

    test('npm-run-all command (--node-run)', async () => {
      await runAll(['--node-run', 'test-task:append a', 'test-task:append b'])
      assert.strictEqual(result(), 'aabb')
    })
  })

  describe('should run tasks in parallel with --node-run:', () => {
    /** @param {string | null} r */
    function assertParallelResult (r) {
      assert.ok(
        r === 'abab' || r === 'baba' || r === 'abba' || r === 'baab',
        `Expected interleaved parallel output but got: ${r}`
      )
    }

    test('Node API', async () => {
      const results = await nodeApi(
        ['test-task:append a', 'test-task:append b'],
        { parallel: true, nodeRun: true }
      )
      assert.ok(results != null)
      assert.strictEqual(results.length, 2)
      assert.ok(results.every(r => r.code === 0))
      assertParallelResult(result())
    })

    test('run-p command (--node-run)', async () => {
      await runPar(['--node-run', 'test-task:append a', 'test-task:append b'])
      assertParallelResult(result())
    })

    test('run-p command (-x)', async () => {
      await runPar(['-x', 'test-task:append a', 'test-task:append b'])
      assertParallelResult(result())
    })

    test('npm-run-all command (-p --node-run)', async () => {
      await runAll(['-p', '--node-run', 'test-task:append a', 'test-task:append b'])
      assertParallelResult(result())
    })
  })

  describe('should not run pre/post lifecycle scripts with --node-run:', () => {
    test('Node API', async () => {
      const results = await nodeApi(
        ['test-task:node-run-lifecycle'],
        { parallel: false, nodeRun: true }
      )
      assert.ok(results != null)
      assert.strictEqual(results[0]?.code, 0)
      // With npm, pre/post hooks would produce "premainpost". node --run skips them.
      assert.strictEqual(result(), 'main')
    })

    test('run-s command', async () => {
      await runSeq(['--node-run', 'test-task:node-run-lifecycle'])
      assert.strictEqual(result(), 'main')
    })
  })
})
