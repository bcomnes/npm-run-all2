// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const { test, describe } = require('node:test')
const assert = require('node:assert/strict')

// Test that CommonJS can require() an ESM module in Node 22+
const npmRunAll = require('../')

// ------------------------------------------------------------------------------
// Test
// ------------------------------------------------------------------------------

describe('CommonJS compatibility - require(ESM)', () => {
  test('should be able to require the ESM module from CommonJS', () => {
    // Test default export
    assert.ok(npmRunAll, 'Default export should exist')
    assert.equal(typeof npmRunAll, 'function', 'Default export should be a function')

    // Test named export
    assert.equal(typeof npmRunAllNamed, 'function', 'Named export should be a function')
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

  test('should be the same module when required multiple times', () => {
    // Require the module again
    const npmRunAllModule2 = require('../lib/cjs.cjs')
    const { npmRunAll: npmRunAllNamed2 } = require('../lib/cjs.cjs')

    // Should be the exact same reference
    assert.equal(npmRunAll, npmRunAllModule2, 'Multiple requires should return the same default export reference')
    assert.equal(npmRunAllModule2.npmRunAll, npmRunAllNamed2, 'Named export should be available on default export')
  })

  test('should be able to import the ESM module directly', async () => {
    // As noted in cjs.cjs comment, ESM consumers can import 'npm-run-all2/lib/esm.mjs' directly
    const esmModule = await import('../lib/esm.mjs')

    // Test default export
    assert.ok(esmModule.default, 'ESM default export should exist')
    assert.equal(typeof esmModule.default, 'function', 'ESM default export should be a function')

    // Test named export
    assert.ok(esmModule.npmRunAll, 'ESM named export should exist')
    assert.equal(typeof esmModule.npmRunAll, 'function', 'ESM named export should be a function')

    // Both should be the same function
    assert.equal(esmModule.default, esmModule.npmRunAll, 'ESM default and named exports should be the same function')

    // Should be the same function as the CJS export
    assert.equal(npmRunAll, esmModule.default, 'CJS and ESM exports should be the same function')
  })
})
