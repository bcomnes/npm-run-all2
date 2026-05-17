/**
 * @module create-prefix-transform-stream
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * @copyright 2026 Bret Comnes. All rights reserved.
 * See LICENSE file in root directory for full license.
 *
 * @import { TransformCallback } from 'node:stream'
 */

/**
 * @typedef PrefixState
 * @property {string | null} lastPrefix - The last prefix which is printed.
 * @property {boolean} lastIsLinebreak - The flag to check whether the last output is a line break or not.
 */

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

import stream from 'node:stream'

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

const ALL_BR = /\n/g

/**
 * The transform stream to insert a specific prefix.
 *
 * Several streams can exist for the same output stream.
 * This stream will insert the prefix if the last output came from other instance.
 * To do that, this stream is using a shared state object.
 *
 * @private
 */
class PrefixTransform extends stream.Transform {
  /** @type {string} */
  prefix

  /** @type {PrefixState} */
  state

  /**
     * @param {string} prefix - A prefix text to be inserted.
     * @param {PrefixState} state - A state object.
     */
  constructor (prefix, state) {
    super()

    this.prefix = prefix
    this.state = state
  }

  /**
     * Transforms the output chunk.
     *
     * @override
     * @param {string|Buffer} chunk - A chunk to be transformed.
     * @param {BufferEncoding} _encoding - The encoding of the chunk.
     * @param {TransformCallback} callback - A callback function that is called when done.
     * @returns {void}
     */
  _transform (chunk, _encoding, callback) {
    const prefix = this.prefix
    const nPrefix = `\n${prefix}`
    const state = this.state
    const firstPrefix =
            state.lastIsLinebreak
              ? prefix
              : (state.lastPrefix !== prefix)
                  ? '\n'
                  : ''
    const prefixed = `${firstPrefix}${chunk}`.replace(ALL_BR, nPrefix)
    const index = prefixed.indexOf(prefix, Math.max(0, prefixed.length - prefix.length))

    state.lastPrefix = prefix
    state.lastIsLinebreak = (index !== -1)

    callback(null, (index !== -1) ? prefixed.slice(0, index) : prefixed)
  }
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

/**
 * Create a transform stream to insert the specific prefix.
 *
 * Several streams can exist for the same output stream.
 * This stream will insert the prefix if the last output came from other instance.
 * To do that, this stream is using a shared state object.
 *
 * @param {string} prefix - A prefix text to be inserted.
 * @param {PrefixState} state - A state object.
 * @returns {stream.Transform} The created transform stream.
 */
export default function createPrefixTransform (prefix, state) {
  return new PrefixTransform(prefix, state)
}
