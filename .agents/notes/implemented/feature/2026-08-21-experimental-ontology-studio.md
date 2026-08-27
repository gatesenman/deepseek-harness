# Agent Note: Experimental ontology studio editor

Status: implemented

English | [中文](2026-08-21-experimental-ontology-studio.zh.md)

## Problem

The ontology semantic-model package (`dsh-experimental-ontology-model`) is a pure library with no user-facing surface: authoring an ontology, editing sample instances, and reading validation/test results all required programmatic access. An editor is the package's first real consumer and the fastest way to learn which operations a future service seam would need.

## Decision

One private package, `@deepseek-ai/dsh-experimental-ontology-studio`, holding a standalone Vite-served React editor over the model library. The shell (`src/client/App.tsx`) drives the model's `ontologyReducer` through `useReducer`, autosaves to `localStorage`, and routes a sidebar across the six entity kinds, a sample-instance editor, and a testing panel that renders `validateOntology`, `runRule`, `runMetric`, and `checkInstances` live. Import/export uses the model's versioned JSON format. The app ships its own icon and stylesheet under `public/`.

The package's public entry (`src/helpers.ts`) is deliberately React-free — kind labels, the base-type list, and the `newEntity` factory — so the node test lane covers the editor logic while the React shell carries a TODO(gui) coverage exemption alongside the other client-lane debt in `vitest.config.ts`.

The standalone app registers no slot, store, or service. Mirroring the model package, the package's invariant companion is an explained empty. The package has since also grown a Web client plugin half; the [Web plugin note](2026-08-26-ontology-studio-web-plugin.md) owns that decision.

## Alternatives considered

**A `packages/client/ui-ontology-*` plugin on the `apps/web` shell now.** Rejected for this step: composing into the product client means slots, entry-declared stores, locale records, theme tokens, and real-composition tests — worth doing only once the editor's operation set has stabilized. The standalone app proves the editor with the smallest surface; the promotion has since shipped with [its own note](2026-08-26-ontology-studio-web-plugin.md).

**Extending `apps/web` directly with an ontology route.** Rejected: `apps/web` is a thin Vite entry over `dsh-client-web`; embedding an experimental editor there would put experimental code on the release path, which `packages/experimental` rules forbid.

## Consequences

Users get a runnable editor (`pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio dev`) covering the full modeling loop: author entities, edit instances, and watch validation and tests update live. Persistence is browser-local only. The editor's usage will inform whether the model grows a Cordis service seam and which operations a product client plugin needs; richer persistence and React-shell test coverage are the deferred follow-ups; the client-plugin promotion has shipped ([Web plugin note](2026-08-26-ontology-studio-web-plugin.md)).
