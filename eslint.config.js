import { globalIgnores } from 'eslint/config'
import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'

export default [
  globalIgnores(resolveIgnoresFromGitignore()),
  ...neostandard(),
]
