/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
