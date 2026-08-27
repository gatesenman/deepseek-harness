/**
 * The studio's entry-declared store: the ontology document plus the surface's
 * viewing state (overlay visibility, active section, selection). Module level
 * exports the factory only; both registrations (launcher + overlay) share one
 * handle created inside the plugin's `apply`.
 */
import { ontologyReducer, sampleOntology } from '@deepseek-ai/dsh-experimental-ontology-model'
import type { Ontology, OntologyAction } from '@deepseek-ai/dsh-experimental-ontology-model'
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client'
import type { EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'
import type { StudioSection } from './StudioSurface.tsx'

/** Studio store state: the document and the surface's viewing state. */
export interface StudioState {
  /** Whether the overlay surface is visible. */
  open: boolean
  /** Current ontology document. */
  ontology: Ontology
  /** Active navigation section. */
  section: StudioSection
  /** Selected entity id within an entity section, or null. */
  selectedId: string | null
}

/**
 * Annotation twin of the actions literal below (the export needs a declared
 * return type); drift fails assignability at the defineStore call.
 */
export type StudioActions = {
  setOpen: (draft: StudioState, open: boolean) => void
  dispatchDocument: (draft: StudioState, action: OntologyAction) => void
  setSection: (draft: StudioState, section: StudioSection) => void
  select: (draft: StudioState, id: string | null) => void
}

/**
 * Create the studio store handle. The document persists in localStorage under
 * one key; a fresh browser starts on the bundled sample ontology. Actions are
 * the complete write set: every document mutation flows through the
 * ontology-model reducer.
 * @returns the store handle (spec + type + identity + factory in one).
 */
export function createStudioStore(): EngineStoreHandle<StudioState, StudioActions> {
  return defineStore({
    init: (): StudioState => ({
      open: false,
      ontology: sampleOntology(),
      section: 'objectType',
      selectedId: null,
    }),
    persist: 'dsh-ontology-studio',
    actions: {
      setOpen: (d, open: boolean) => { d.open = open },
      dispatchDocument: (d, action: OntologyAction) => {
        d.ontology = ontologyReducer(d.ontology, action)
      },
      setSection: (d, section: StudioSection) => {
        d.section = section
        d.selectedId = null
      },
      select: (d, id: string | null) => { d.selectedId = id },
    },
  })
}
