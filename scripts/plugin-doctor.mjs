#!/usr/bin/env node
/**
 * Validate a DeepSeek Harness plugin directory without installing the monorepo.
 * Checks package.json, the dshPlugin manifest, and that the entry file exists.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const NAME_RE = /^(?:@[a-z0-9~-][a-z0-9._~-]*\/)?[a-z0-9~-][a-z0-9._~-]*$/

export function doctor(pluginDir) {
  const issues = []
  const root = resolve(pluginDir)
  const pkgPath = join(root, 'package.json')
  if (!existsSync(pkgPath)) {
    return { ok: false, pluginDir: root, issues: ['package.json is missing'] }
  }
  let pkg
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  } catch (e) {
    return { ok: false, pluginDir: root, issues: [`package.json is not valid JSON: ${e.message}`] }
  }
  if (typeof pkg.name !== 'string' || !NAME_RE.test(pkg.name)) {
    issues.push('package.json name is missing or not a valid package name')
  }
  if (typeof pkg.version !== 'string' || !/^\d+\.\d+\.\d+/.test(pkg.version)) {
    issues.push('package.json version is missing or not semver-like')
  }
  const manifest = pkg.dshPlugin && typeof pkg.dshPlugin === 'object' ? pkg.dshPlugin : null
  if (!manifest) {
    issues.push('package.json is missing a dshPlugin manifest object')
  } else {
    if (typeof manifest.id !== 'string' || !manifest.id.trim()) {
      issues.push('dshPlugin.id is required')
    }
    const entry = manifest.entry || pkg.main
    if (typeof entry !== 'string' || !entry.trim()) {
      issues.push('dshPlugin.entry or package.json main is required')
    } else if (!existsSync(join(root, entry))) {
      issues.push(`plugin entry file does not exist: ${entry}`)
    }
  }
  return { ok: issues.length === 0, pluginDir: root, name: pkg.name, version: pkg.version, issues }
}

function main(argv) {
  const target = argv[0] || join(dirname(fileURLToPath(import.meta.url)), '..', 'examples', 'sample-plugin')
  const report = doctor(target)
  if (report.ok) {
    console.log(`ok ${report.name}@${report.version}`)
    process.exit(0)
  }
  console.error(`invalid plugin at ${report.pluginDir}`)
  for (const issue of report.issues) console.error(`- ${issue}`)
  process.exit(1)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2))
}
