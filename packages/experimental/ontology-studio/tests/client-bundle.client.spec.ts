// @vitest-environment jsdom
/**
 * Real tsdown artifact shape: lib/client.js hands off through
 * window.__ModuleLoader__.load, resolves externals through the injected
 * require, returns the exports (apply + inject), and a mounted apply
 * registers the sidebar launcher and shell.overlay surface into a real
 * SlotRegistry. Skips when lib/ is not built
 * (`pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio bundle`).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'

const PLUGIN_ID = '@deepseek-ai/dsh-experimental-ontology-studio'

interface Handoff { id: string; factory: (require: (spec: string) => unknown) => Record<string, unknown> }
type Win = { __ModuleLoader__?: { load(h: Handoff): void } }

function readBundle(): string | undefined {
  try {
    // import.meta.url is http-scheme in the jsdom pool; vitest runs from the
    // repo root, so resolve the artifact repo-relatively instead.
    return readFileSync(resolve('packages/experimental/ontology-studio/lib/client.js'), 'utf8')
  } catch {
    return undefined
  }
}

afterEach(() => {
  delete (window as Win).__ModuleLoader__
  for (const el of document.querySelectorAll('style')) el.remove()
  localStorage.clear()
})

describe('tsdown client artifact', () => {
  const code = readBundle()

  async function loadArtifact() {
    let handoff: Handoff | undefined
    ;(window as Win).__ModuleLoader__ = { load: (h) => { handoff = h } }
    // The implied-eval ban targets accidental string execution, not this
    // deliberate built-bundle fixture running in the window scope.
    // oxlint-disable-next-line typescript/no-implied-eval, typescript/no-unsafe-call
    new Function(code!)()
    expect(handoff).toBeDefined()
    const modules = new Map<string, unknown>([
      ['react', await import('react')],
      ['react/jsx-runtime', await import('react/jsx-runtime')],
      ['@deepseek-ai/dsh-client-runtime/client', await import('@deepseek-ai/dsh-client-runtime/client')],
    ])
    const exports = handoff!.factory((spec) => {
      if (!modules.has(spec)) throw new Error(`unexpected require: ${spec}`)
      return modules.get(spec)
    })
    return { handoff: handoff!, exports }
  }

  it.skipIf(code === undefined)('hands off with the manifest id and a DI-require factory', async () => {
    const { handoff, exports } = await loadArtifact()
    expect(handoff.id).toBe(PLUGIN_ID)
    expect(exports.apply).toBeTypeOf('function')
    expect(exports.inject).toEqual(['slots'])
  })

  it.skipIf(code === undefined)('mounted as an object plugin, apply lands both entries once the frame declares its seats', async () => {
    const { exports } = await loadArtifact()
    const ctx = new Context()
    const slots = new SlotRegistry(ctx)
    // Stand in for the frame and sidebar owners: the studio's deferred
    // injections fire only after these seats are declared.
    slots.register({
      name: 'root',
      children: {
        'shell.overlay': { kind: 'list', scope: 'root' },
        'sidebar.footer.action': { kind: 'list', scope: 'root' },
      },
    }, (_p: { renderSlot?: unknown }) => null)
    const fiber = ctx.plugin(exports as { apply: (ctx: Context) => void })
    await fiber.await()
    expect(slots.entries('sidebar.footer.action').map(e => e.options.id)).toEqual(['ontology-studio'])
    expect(slots.entries('shell.overlay').map(e => e.options.id)).toEqual(['ontology-studio'])
    await fiber.dispose()
    expect(slots.entries('sidebar.footer.action')).toHaveLength(0)
    expect(slots.entries('shell.overlay')).toHaveLength(0)
  })

  it.skipIf(code === undefined)('injects plugin-tagged module CSS during factory execution', async () => {
    await loadArtifact()
    const tags = document.querySelectorAll(`style[data-plugin=${JSON.stringify(PLUGIN_ID)}]`)
    expect(tags.length).toBeGreaterThan(0)
  })
})
