/**
 * Public entry of the ontology-studio editor package: the pure editor helpers
 * plus the node half of the browser plugin. The standalone browser app boots
 * through `src/main.tsx` via the package-local Vite config (`pnpm dev`); the
 * browser plugin half ships via exports["./client"], discovered through the
 * package.json dsh.client declaration.
 * @module @deepseek-ai/dsh-experimental-ontology-studio
 */
export * from './helpers.ts'

/** Host plugin body — no host-side behavior for this surface plugin. */
export function apply(): void {}
