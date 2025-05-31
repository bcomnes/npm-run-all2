// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

// Test imports from package.json resolution to exercise the import map.
import npmRunAll from 'npm-run-all2'

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('ESM compatibility - import from .mjs', () => {
  test('should be able to import from package.json resolution', () => {
    // Test default import
    assert.ok(npmRunAll, 'Default import should exist')
    assert.equal(typeof npmRunAll, 'function', 'Default import should be a function')
  })

  test('should have the expected function signature', () => {
    // Check function length (number of expected arguments)
    assert.equal(npmRunAll.length, 2, 'Function should accept 2 parameters')

    // Check function name
    assert.equal(npmRunAll.name, 'npmRunAll', 'Function should be named npmRunAll')
  })

  test('should return a promise when called with minimal args', async () => {
    // Call with empty pattern should return a resolved promise with null
    const result = npmRunAll([], {})

    assert.ok(result instanceof Promise, 'Should return a Promise')

    // Verify it resolves to null for empty patterns
    const value = await result
    assert.equal(value, null, 'Should resolve to null for empty patterns')
  })

  test('should support static imports', () => {
    // This test verifies that static imports work (they already do since we imported at the top)
    // but we can verify the modules are properly cached
    assert.ok(npmRunAll, 'Static default import should work')
  })
})
