import neostandard from 'neostandard'

export default [
  ...neostandard({
    ignores: neostandard.resolveIgnoresFromGitignore(),
    ts: true,
  }),
]
