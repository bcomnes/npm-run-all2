'use strict'

const assert = require('node:assert/strict')
const { appendFileSync, existsSync, readFileSync } = require('node:fs')
const { setTimeout: delay } = require('node:timers/promises')

function events () {
  return existsSync('test.txt') ? readFileSync('test.txt', 'utf8') : ''
}

/** @param {string} event */
async function waitFor (event) {
  const deadline = Date.now() + 30000
  while (!events().includes(event)) {
    assert.ok(Date.now() < deadline, `Timed out waiting for ${event}; events: ${events()}`)
    await delay(10)
  }
}

async function main () {
  const task = process.argv[2]
  assert.ok(task === 'a' || task === 'b' || task === 'c')

  if (task === 'c') {
    // A free slot is required, but b must still be running when c starts.
    assert.ok(events().includes('A'), `c started before a finished: ${events()}`)
    assert.ok(!events().includes('B'), `b finished before c started: ${events()}`)
  }
  appendFileSync('test.txt', task)

  // Serial execution and batch scheduling both deadlock instead of passing.
  if (task === 'a') await waitFor('b')
  if (task === 'b') await waitFor('c')

  appendFileSync('test.txt', task.toUpperCase())
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
