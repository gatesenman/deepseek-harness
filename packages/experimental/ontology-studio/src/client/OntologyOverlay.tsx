/** Frame-wide overlay entry hosting the studio surface when open. */
import type { PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { createStudioStore } from './store.ts'
import { StudioSurface } from './StudioSurface.tsx'
import css from './studio.module.css'

/** Overlay props: the studio store share (the shell.overlay slot passes no owner data). */
export type OntologyOverlayProps = PropsStore<ReturnType<typeof createStudioStore>>

/**
 * Render the studio surface over the whole app while the store says open;
 * renders nothing otherwise (the overlay layer stays click-through).
 * @param props - The studio store share.
 * @returns The overlay element, or null when closed.
 */
export function OntologyOverlay(props: OntologyOverlayProps) {
  const open = props.useStore(s => s.open)
  const ontology = props.useStore(s => s.ontology)
  const section = props.useStore(s => s.section)
  const selectedId = props.useStore(s => s.selectedId)
  if (!open) return null
  return (
    <div className={css.overlay}>
      <StudioSurface
        ontology={ontology}
        section={section}
        selectedId={selectedId}
        onAction={props.actions.dispatchDocument}
        onSectionChange={props.actions.setSection}
        onSelect={props.actions.select}
        onClose={() =>{  props.actions.setOpen(false) }}
      />
    </div>
  )
}
