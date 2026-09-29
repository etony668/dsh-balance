English | [中文](README.zh.md)

# DSH Balance plugin (dsh-balance)

A tiny DeepSeek Harness plugin that shows your **DeepSeek API balance** in the
sidebar footer, right beside **Settings**.

- **Placed beside Settings** — registers the official `sidebar.footer.action`
  seat (sidebar foot, next to the Settings row), auto-adapting to the collapsed
  56px rail (dot only) and staying inside the sidebar.
- **Live balance** — reads the `DEEPSEEK_API_KEY` already stored by DSH in
  `~/.dsh/.credentials.yaml`, queries the official
  `api.deepseek.com/user/balance` endpoint, and caches the result for 60 s.
- **Low-balance warning** — turns red with a ⚠ marker when the available
  balance drops below the threshold (default **¥2**, configurable in code).
- **Details on hover** — granted / topped-up breakdown, currency and the last
  successful update time; **click to refresh**.
- **Bilingual + theme-aware** — follows the system language (zh/en) and adapts
  to light/dark themes through DSH theme tokens.
- **Local-first** — the key is read from your own machine, the balance is only
  passed between the DSH backend and your browser. Nothing is written to disk
  or reported anywhere else.

## Installation

> ⚠️ **Always install and update through the plugin manager** (the Plugins panel, or
> `dsh plugin add <path-or-package>`). Do **not** hand-edit your profile's
> `package.json` to add a `link:` dependency: when a plugin appears in both
> `dsh.profile.bundles` and `dependencies`, the plugin manager refuses to update it
> with `ambiguous-install` (DSH 0.20+). If you already did that, delete the
> hand-written entry and install once more — the manager writes the correct
> dependency itself.

### Option 1: One command (recommended)

```sh
dsh plugin --profile web add @etony668/dsh-balance
```

### Option 2: Clone from GitHub (backup)

```bash
git clone https://github.com/etony668/dsh-balance.git
cd dsh-balance
./install.sh
```

Then refresh the DSH page (or restart DSH). The balance badge appears in the
sidebar footer, beside **Settings**.

## Requirements

- DSH stores your DeepSeek key in `~/.dsh/.credentials.yaml` (set it in
  **Settings → Models** if you have not). Without it the badge shows
  “Balance unavailable — API key not found”.

## Repository layout

```
index.js        package root entry (loader resolves <pkg>/index.js)
lib/index.js    host half: reads the credential, queries the balance API, caches
lib/client.js   browser half: registers the conversation.composer.dock entry
cordis.patch.yml bundle patch used by `dsh plugin add`
install.sh      one-click install (macOS/Linux bash)
reinstall.sh    reinstall into the current runtime + profile fallback link
```

## License

[MIT](./LICENSE)
