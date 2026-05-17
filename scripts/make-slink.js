/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import fs from 'node:fs'
import path from 'node:path'

const __dirname = import.meta.dirname

/** @type {[string, string][]} */
const links = [
  [path.resolve(__dirname, '../test/lib'), path.resolve(__dirname, '../test-workspace/tasks/lib')],
  [path.resolve(__dirname, '..'), path.resolve(__dirname, '../node_modules/npm-run-all2')],
]

for (const [target, linkPath] of links) {
  try {
    fs.symlinkSync(target, linkPath, 'junction')
  } catch (err) {
    if (!(err instanceof Error && 'code' in err && err.code === 'EEXIST')) {
      throw err
    }
  }
}
