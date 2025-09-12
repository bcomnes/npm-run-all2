#!/usr/bin/env node
/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

// ------------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------------

import { enableCompileCache } from 'node:module'
enableCompileCache?.()

const { default: bootstrap } = await import('#bin/common/bootstrap.js')
bootstrap('run-p')
