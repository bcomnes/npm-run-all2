import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import npmRunAll from '../lib/index.js'

describe('package resolution', () => {
  test('default import is a function', () => {
    assert.ok(npmRunAll, 'default import should exist')
    assert.equal(typeof npmRunAll, 'function', 'default import should be a function')
  })

  test('returns a promise for empty patterns', async () => {
    const result = await npmRunAll([], {})
    assert.equal(result, null, 'should resolve to null for empty patterns')
  })
})
