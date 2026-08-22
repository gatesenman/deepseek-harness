import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import * as OntologyStudioInvariant from '../src/invariant.ts'

describe('experimental-ontology-studio invariant companion', () => {
  it('registers its explained empty runtime invariant', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry)
    const fiber = await ctx.plugin(OntologyStudioInvariant)

    expect(() => {
      ctx.invariants.register('@deepseek-ai/dsh-experimental-ontology-studio', () => {})
    }).toThrow(/already registered/)
    await fiber.dispose()
    await ctx.fiber.dispose()
  })
})
