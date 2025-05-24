'use strict'

module.exports = [
  ...require('neostandard')({
    env: ['node', 'mocha'],
    ignores: require('neostandard').resolveIgnoresFromGitignore(),
    ts: true,
  }),
]
