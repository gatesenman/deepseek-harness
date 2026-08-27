# Agent Note: Ontology studio Web client plugin

Status: implemented

English | [中文](2026-08-26-ontology-studio-web-plugin.zh.md)

## Problem

The ontology studio editor was a standalone Vite app only: global literal-color styles, no slot/store integration, and no way to open it inside the product Web client. Promotion into the shell was the deferred follow-up of the [ontology studio note](2026-08-21-experimental-ontology-studio.md).

## Decision

The package gains a browser plugin half (`src/client/index.ts`, `exports["./client"]`, `dsh.client` with `platform: web`, bundled through the shared `clientBundle` preset) while keeping the standalone Vite page. The editor UI is one controlled component, `StudioSurface`, shared by both hosts: the standalone `App.tsx` drives it from `useReducer` + `bridge.ts` persistence, and the plugin drives it from one entry-declared store (`store.ts`: ontology document persisted under `dsh-ontology-studio`, plus overlay visibility, section, and selection). The plugin registers two entries over that shared store handle: a `sidebar.footer.action` launcher and a `shell.overlay` editor surface, so the studio opens over the app frame without touching the `root` slot.

Styles moved from global literal colors to a CSS Module against the theme's `--dsw-alias-*` tokens; the standalone page's `public/styles.css` now only defines dark-scheme values for those tokens plus page basics.

Because the package is experimental, the shipped Web composition does not include it. `examples/web-ontology/cordis.yml` is the opt-in overlay (the `web-schedule` pattern) that mounts it into the Web profile from a source checkout. The browser bundle inlines `dsh-experimental-ontology-model` (added to `INLINE_SAFE` in `packages/client/tsdown.client.ts`): the model is a pure in-memory library with no context or singleton state, and dynamic externals would require the Web host to ship it.

Real-composition coverage is `tests/client-bundle.client.spec.ts`: it executes the built `lib/client.js`, asserts the `window.__ModuleLoader__` handoff id and DI-require factory, mounts the exports as an object plugin over a real `SlotRegistry` with the frame seats declared, asserts both registrations land, and asserts disposal removes them and that plugin-tagged module CSS was injected.

## Alternatives considered

**Rostering the package in `packages/bundle/web-app/cordis.patch.yml`.** Rejected: that is the release Web composition, and release compositions must not depend on `packages/experimental`.

**Keeping the ontology model a dynamic external.** Rejected: only shipped host packages are servable externals; an experimental value dependency either inlines or breaks the Loader at runtime.

## Consequences

`pnpm dsh web --patch examples/web-ontology/cordis.yml` mounts the studio: a ◈ launcher in the sidebar footer toggles a frame-wide overlay hosting the full editor (six entity kinds, sample instances, testing panel). The plugin document store and the standalone page's `bridge.ts` persistence use separate localStorage keys, so the two hosts keep independent documents. Workspace/server persistence and locale records remain deferred.
