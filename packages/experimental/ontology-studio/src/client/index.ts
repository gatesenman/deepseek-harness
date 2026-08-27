/**
 * Ontology Studio browser plugin: a sidebar footer launcher plus a
 * frame-wide `shell.overlay` surface hosting the ontology editor. Both
 * entries share one root-scoped store (the ontology document persists in
 * localStorage); components receive state and callbacks through props only.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { OntologyLauncher } from './OntologyLauncher.tsx'
import { OntologyOverlay } from './OntologyOverlay.tsx'
import { createStudioStore } from './store.ts'

export type { OntologyLauncherProps } from './OntologyLauncher.tsx'
export type { OntologyOverlayProps } from './OntologyOverlay.tsx'
export type { StudioActions, StudioState } from './store.ts'
export type { StudioSection, StudioSurfaceProps } from './StudioSurface.tsx'

/** Required services: the slot registry only (the studio is client-local). */
export const inject = ['slots']

/**
 * Mount the launcher and overlay entries over one shared studio store.
 * @param ctx - The browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  // One handle for both registrations: the framework caches one instance per
  // handle x scope key, so launcher and overlay observe the same state.
  const store = createStudioStore()
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'ontology-studio',
    store,
  }, OntologyLauncher))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'ontology-studio',
    store,
  }, OntologyOverlay))
}
