/**
 * @module create-header
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { PackageInfo } from './index.js'
 */

import { styleText } from 'node:util'

// ------------------------------------------------------------------------------
// Public Interface
// ------------------------------------------------------------------------------

/**
 * Creates the header text for a given task.
 *
 * @param {string} nameAndArgs - A task name and arguments.
 * @param {PackageInfo | null} packageInfo - A package.json's information.
 * @param {boolean | undefined} isTTY - The flag to color the header.
 * @returns {string} The header of a given task.
 */
export default function createHeader (nameAndArgs, packageInfo, isTTY) {
  if (!packageInfo) {
    return `\n> ${nameAndArgs}\n\n`
  }

  const index = nameAndArgs.indexOf(' ')
  const name = (index === -1) ? nameAndArgs : nameAndArgs.slice(0, index)
  const args = (index === -1) ? '' : nameAndArgs.slice(index + 1)
  const packageName = packageInfo.body.name
  const packageVersion = packageInfo.body.version
  const scriptBody = packageInfo.body.scripts?.[name] ?? ''
  const packagePath = packageInfo.path
  const color = isTTY ? /** @type {const} */ (['gray']) : []

  return `
${styleText(color, `> ${packageName}@${packageVersion} ${name} ${packagePath}`, { validateStream: false })}
${styleText(color, `> ${scriptBody} ${args}`, { validateStream: false })}

`
}
