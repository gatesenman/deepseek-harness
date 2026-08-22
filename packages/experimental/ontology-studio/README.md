# @deepseek-ai/dsh-experimental-ontology-studio

English | [中文](README.zh.md)

Standalone browser editor over [`@deepseek-ai/dsh-experimental-ontology-model`](../ontology-model/README.md): a Vite-served React shell with sidebar navigation across the six ontology entity kinds — object types (with typed object properties), link types, action types, value types, metrics, and rules — plus a sample-instance editor and a testing panel that runs validation, rules, metrics, and instance schema checks live. The [ontology studio Agent Note](../../../.agents/notes/implemented/feature/2026-08-21-experimental-ontology-studio.md) owns the scoping decision.

## Running

```sh
pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio dev        # dev server on port 5199
pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio build:app  # static bundle in dist/
```

The app boots from `index.html` → `src/main.tsx` with its own icon (`public/icon.svg`) and stylesheet (`public/styles.css`).

## Editor design

`src/client/App.tsx` is the shell: it holds the document in a `useReducer` over the model package's `ontologyReducer`, loads the persisted document on mount (falling back to the bundled logistics sample), and autosaves every change. The topbar renames the ontology, shows the live validation error count, and offers import/export (JSON file), load-sample, and clear. The sidebar routes between the six entity sections (each a list pane plus a per-kind editor from `src/client/editors.tsx`), the sample-instance editor (`src/client/InstancesPanel.tsx`), and the testing panel (`src/client/TestPanel.tsx`, rendering `validateOntology`, `runRule`, `runMetric`, and `checkInstances` results). There is deliberately no Operation Type section; action types are the only modification concept.

`src/helpers.ts` (the package's public entry) keeps the React-free editor logic — kind labels, the base-type list, and the `newEntity` factory — so the node test lane covers it.

## Persistence

`src/client/bridge.ts` persists the serialized document to `localStorage` under `dsh-ontology-studio-document` and implements file import/export through browser download/file-picker primitives. Documents use the model package's versioned `parseOntology`/`stringifyOntology` JSON format, so files round-trip with any other consumer of the model.

## Known Limitations and Deferred Work

- **Not composed into `apps/web`** — the editor is a standalone Vite app, not a client plugin on the shell's slot system; promotion into the product client (slots, stores, locale, theme tokens) is deferred.
- **React shell lacks automated coverage** — `src/client/*` and `src/main.tsx` carry a TODO(gui) coverage exemption; only the React-free helpers are unit-tested.
- **localStorage-only persistence** — no workspace or server persistence; clearing browser storage loses the document unless exported.
