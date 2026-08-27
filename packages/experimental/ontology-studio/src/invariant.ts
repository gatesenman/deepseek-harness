/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-experimental-ontology-studio`.
 * @module @deepseek-ai/dsh-experimental-ontology-studio/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-experimental-ontology-studio'

/** Cordis companion plugin name. */
export const name = 'experimental-ontology-studio-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: this editor owns no event stream or mutable runtime
 * data — its browser plugin only contributes slot entries over an
 * entry-declared store, and document consistency is enforced by the
 * ontology-model validators it renders.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
