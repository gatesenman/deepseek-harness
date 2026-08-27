/** Standalone application shell: reducer state, localStorage persistence, and the studio surface. */
import {
  emptyOntology,
  ontologyReducer,
  parseOntology,
  sampleOntology,
  stringifyOntology,
} from '@deepseek-ai/dsh-experimental-ontology-model'
import { useEffect, useReducer, useState } from 'react'
import { loadDocument, saveDocument } from './bridge.ts'
import { StudioSurface } from './StudioSurface.tsx'
import type { StudioSection } from './StudioSurface.tsx'

/**
 * The standalone editor root: loads the persisted document (falling back to
 * the sample ontology), autosaves on change, and hosts the studio surface.
 * @returns The application element.
 */
export function App() {
  const [ontology, dispatch] = useReducer(ontologyReducer, undefined, () => emptyOntology())
  const [section, setSection] = useState<StudioSection>('objectType')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const json = loadDocument()
    if (json !== null) {
      try {
        dispatch({ type: 'set', ontology: parseOntology(json) })
      } catch {
        // Unreadable stored document: fall back to the bundled sample.
        dispatch({ type: 'set', ontology: sampleOntology() })
      }
    } else {
      dispatch({ type: 'set', ontology: sampleOntology() })
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveDocument(stringifyOntology(ontology))
  }, [ontology, loaded])

  return (
    <StudioSurface
      ontology={ontology}
      section={section}
      selectedId={selectedId}
      onAction={dispatch}
      onSectionChange={setSection}
      onSelect={setSelectedId}
    />
  )
}
