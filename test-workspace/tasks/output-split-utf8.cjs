'use strict'

// Writes a multi-byte UTF-8 character split across separate, delayed writes
// so the parent receives the bytes as distinct chunks.
const euro = Buffer.from('€\n')

process.stdout.write(euro.subarray(0, 1))
setTimeout(() => process.stdout.write(euro.subarray(1)), 500)
