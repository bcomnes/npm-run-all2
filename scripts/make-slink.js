/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import fs from 'node:fs'
import path from 'node:path'

const __dirname = import.meta.dirname

try {
  fs.symlinkSync(
    path.resolve(__dirname, '../test/lib'),
    path.resolve(__dirname, '../test-workspace/tasks/lib'),
    'junction'
  )
} catch (err) {
  if (err.code !== 'EEXIST') {
    throw err
  }
}
