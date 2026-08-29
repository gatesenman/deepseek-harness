/** Browser persistence: localStorage document store plus file import/export. */

const STORAGE_KEY = 'dsh-ontology-studio-document'

/**
 * Read the persisted ontology document.
 * @returns The stored JSON text, or null when nothing is stored.
 */
export function loadDocument(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

/**
 * Persist the ontology document.
 * @param json - Serialized ontology JSON text.
 */
export function saveDocument(json: string): void {
  localStorage.setItem(STORAGE_KEY, json)
}

/**
 * Download serialized ontology text as a file.
 * @param text - Serialized ontology text.
 * @param filename - Download filename; defaults to `ontology.json`.
 * @param mime - Blob MIME type; defaults to `application/json`.
 */
export function exportFile(text: string, filename = 'ontology.json', mime = 'application/json'): void {
  const blob = new Blob([text], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/**
 * Prompt the user for a JSON file and read it.
 * @returns The file's text, or null when the user picks nothing.
 */
export function importFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file === undefined) {
        resolve(null)
        return
      }
      void file.text().then(resolve)
    }
    input.click()
  })
}
