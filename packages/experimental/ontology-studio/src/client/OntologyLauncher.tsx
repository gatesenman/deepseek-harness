/** Sidebar footer launcher: toggles the ontology studio overlay. */
import type { PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { createStudioStore } from './store.ts'
import css from './studio.module.css'

/** Launcher props: the sidebar owner share plus the studio store share. */
export type OntologyLauncherProps = {
  /** Whether the sidebar renders wide content (false = icon rail). */
  wide: boolean
} & PropsStore<ReturnType<typeof createStudioStore>>

/**
 * Render the launcher row/icon that opens or closes the studio overlay.
 * @param props - Sidebar width mode plus the studio store share.
 * @returns The launcher element.
 */
export function OntologyLauncher(props: OntologyLauncherProps) {
  const open = props.useStore(s => s.open)
  return (
    <button
      className={css.launcher}
      title="本体建模"
      aria-label="本体建模"
      onClick={() =>{  props.actions.setOpen(!open) }}
    >
      <span className={css.launcherGlyph} aria-hidden>◈</span>
      {props.wide && <span>本体建模</span>}
    </button>
  )
}
