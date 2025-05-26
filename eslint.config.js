import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: ['node', 'mocha'],
    ignores: neostandard.resolveIgnoresFromGitignore(),
    ts: true,
  }),
]
