# @deepseek-ai/dsh-desktop

Desktop application for DeepSeek Harness on macOS, Windows, and Linux. An Electron shell equivalent to `npx @deepseek-ai/dsh web`, packaged as an installable app.

## Behavior

- First launch detects a system Node.js (`^22.19 || >=24`); when absent it downloads a bundled Node.js runtime, then installs `@deepseek-ai/dsh` with visible progress.
- Starts `dsh web` on a free local port and embeds the web UI in the app window; later launches start the installed service directly.
- Checks npm for a newer `@deepseek-ai/dsh` at startup (configurable) and supports a manual background update that reinstalls and restarts the service.
- System tray with show/settings/update/open-in-browser/quit; settings cover open-at-login, close-to-tray, and automatic dsh updates.
- Application self-update via electron-updater over GitHub Releases.

## Development

```sh
pnpm install
pnpm start          # run from source
pnpm dist           # build installers for the current platform
pnpm dist:mac       # dmg + zip (x64, arm64)
pnpm dist:win       # nsis exe (x64)
pnpm dist:linux     # AppImage + deb (x64)
```

## Data directory

State (installed dsh version, settings) lives under the Electron `userData` directory: `~/Library/Application Support/dsh-desktop` (macOS), `%APPDATA%/dsh-desktop` (Windows), `~/.config/dsh-desktop` (Linux).
