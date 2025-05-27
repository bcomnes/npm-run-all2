import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: ['node'],
    ignores: neostandard.resolveIgnoresFromGitignore(),
    ts: true,
  }),
]
