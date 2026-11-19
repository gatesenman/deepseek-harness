import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { doctor } from './plugin-doctor.mjs'

const sample = join(dirname(fileURLToPath(import.meta.url)), '..', 'examples', 'sample-plugin')

describe('plugin doctor', () => {
  it('accepts the bundled sample plugin', () => {
    const report = doctor(sample)
    assert.equal(report.ok, true)
    assert.equal(report.name, 'sample-dsh-plugin')
  })

  it('rejects a plugin missing its entry file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-plugin-'))
    try {
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({
          name: 'broken-plugin',
          version: '1.0.0',
          dshPlugin: { id: 'broken-plugin', entry: 'missing.js' },
        }),
      )
      const report = doctor(dir)
      assert.equal(report.ok, false)
      assert.match(report.issues.join('\n'), /entry file does not exist/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
