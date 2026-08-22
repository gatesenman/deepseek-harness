/**
 * The Node half (lib/index.js, lib/invariant.js) bundles from the Client-pass
 * tsc output because the package extends the client tsconfig base; the Host
 * pass runs before that output exists, so it skips with an empty entry. The
 * browser app itself is built separately by Vite via `build:app`.
 */
import type { UserConfig } from 'tsdown'

interface BuildFaceEnvironment {
  readonly env?: Record<string, unknown>
}

const nodeHalf: UserConfig = {
  name: '@deepseek-ai/dsh-experimental-ontology-studio',
  entry: ['lib/types/index.js', 'lib/types/invariant.js'],
  format: 'esm',
  platform: 'node',
  dts: false,
  outDir: 'lib',
  clean: false,
}

export default ({ env }: BuildFaceEnvironment): UserConfig =>
  env?.DSH_BUILD_FACE === 'host' ? { entry: '' } : nodeHalf
