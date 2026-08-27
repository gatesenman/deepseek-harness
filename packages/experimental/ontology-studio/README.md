# @deepseek-ai/dsh-experimental-ontology-studio

English | [中文](README.zh.md)

Browser editor over [`@deepseek-ai/dsh-experimental-ontology-model`](../ontology-model/README.md): a Web client plugin (plus a standalone Vite page) with sidebar navigation across the six ontology entity kinds — object types (with typed object properties), link types, action types, value types, metrics, and rules — plus a sample-instance editor and a testing panel that runs validation, rules, metrics, and instance schema checks live. The [ontology studio Agent Note](../../../.agents/notes/implemented/feature/2026-08-21-experimental-ontology-studio.md) owns the scoping decision.

## Running

```sh
pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio dev        # dev server on port 5199
pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio build:app  # static bundle in dist/
pnpm dsh web --patch examples/web-ontology/cordis.yml                  # mount into the Web profile
```

The standalone app boots from `index.html` → `src/main.tsx` with its own icon (`public/icon.svg`) and stylesheet (`public/styles.css`, dark-scheme values for the theme tokens the surface styles consume).

## Web client plugin

`src/client/index.ts` is the browser plugin entry (published as `exports["./client"]`, declared through the package.json `dsh.client` block, bundled by `pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio bundle`). Its `apply` creates one entry-declared store (`src/client/store.ts`: the ontology document — persisted in localStorage under `dsh-ontology-studio` — plus overlay visibility, active section, and selection) and registers two slot entries over it: a `sidebar.footer.action` launcher (`src/client/OntologyLauncher.tsx`) and a `shell.overlay` editor surface (`src/client/OntologyOverlay.tsx`). Components receive state and callbacks through props only; every document mutation flows through the model package's `ontologyReducer` via the store's `dispatchDocument` action. The package is experimental, so official releases exclude it; [examples/web-ontology](../../../examples/web-ontology/README.md) is the opt-in overlay that mounts it into the Web profile from a source checkout.

## Editor design

`src/client/StudioSurface.tsx` is the controlled editor surface both hosts share: it receives the document, viewing state, and callbacks as props. `src/client/App.tsx` is the standalone shell over it: a `useReducer` over the model package's `ontologyReducer`, loading the persisted document on mount (falling back to the bundled logistics sample) and autosaving every change. The topbar renames the ontology, shows the live validation error count, and offers import/export (JSON file), load-sample, and clear. The sidebar routes between the six entity sections (each a list pane plus a per-kind editor from `src/client/editors.tsx`), the sample-instance editor (`src/client/InstancesPanel.tsx`), and the testing panel (`src/client/TestPanel.tsx`, rendering `validateOntology`, `runRule`, `runMetric`, and `checkInstances` results). There is deliberately no Operation Type section; action types are the only modification concept.

`src/helpers.ts` (the package's public entry) keeps the React-free editor logic — kind labels, the base-type list, and the `newEntity` factory — so the node test lane covers it.

## Persistence

`src/client/bridge.ts` persists the serialized document to `localStorage` under `dsh-ontology-studio-document` and implements file import/export through browser download/file-picker primitives. Documents use the model package's versioned `parseOntology`/`stringifyOntology` JSON format, so files round-trip with any other consumer of the model.

## Known Limitations and Deferred Work

- **Excluded from official releases** — the package is experimental, so the shipped Web composition does not include it; loading it requires the `examples/web-ontology` overlay over a source checkout.
- **React components lack automated coverage** — `src/client/*.tsx` and `src/main.tsx` carry a TODO(gui) coverage exemption; the React-free helpers are unit-tested and `tests/client-bundle.client.spec.ts` covers the built plugin artifact's handoff, slot registrations, and disposal.
- **localStorage-only persistence** — no workspace or server persistence; clearing browser storage loses the document unless exported.
