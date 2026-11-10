# PREINCARNATION release desk (grok-29)

Player instructions: [PLAYER.md](PLAYER.md). Platforms that were not built: [UNSUPPORTED.md](UNSUPPORTED.md).

Engine root is this repository (three directories above `lib/`), or `PREINCARNATION_ENGINE` if set. Save contract is `src/game/save.ts` and `src/game/types.ts` (`SAVE_KEY = preincarnation.save.v1`, `SAVE_VERSION = 8`, `migrate()`, `writeSave()` also writes `.bak`). The strange device audio is IndexedDB `preincarnation.deck.v1` / store `files` (`src/game/ipod.ts`). This desk calls that `migrate()`; it does not replace it.

Distribution target in the engine: Nitro preset `vercel`. No service worker. Unhashed `/game/*.png` URLs (only the wanderer sheet had `?v=3`) can mix a new client with a cached sheet. The packager rewrites those URLs to `?b=<buildId>` and sets HTML and `/release-manifest.json` to `no-store`.

`npm ci` cannot install the committed lock on npm 10.9.9 (lock/package ajv mismatch, then an arborist crash). The web output was built with the sandbox toolchain, `@tanstack/react-start` **1.168.60**, because the lock's 1.168.50 is the Vercel CVE-2026-102989 floor. That pin is a packaging overlay, recorded in the manifest. Nothing was deployed or signed.

```text
node --experimental-strip-types --test scenarios.test.mjs
node --experimental-strip-types package-release.mjs
```

Evidence from the session that built this desk against `c737e42`: [evidence/scenarios.log](evidence/scenarios.log) (13/13), [evidence/engine-save-test.log](evidence/engine-save-test.log) (engine `save.test.ts`, 6/6), [evidence/package-result.json](evidence/package-result.json), [evidence/launch-probe.json](evidence/launch-probe.json). The packaged function answered `GET /` with 200 HTML and the boot guard ahead of the module script. `sha256sum -c` on the stage directory and on the tarball both matched.

The archive from that run was `dist/preincarnation-web-c737e42eb188-save8.tar.gz` (`c082210986b5840ce17977d1bee8f62af518dfb1aaea4f2ca4cedbe69b5a972a`), build id `web-c737e42eb188-save8`. The repository gitignore excludes `dist/`, so that tarball is not in git. `node package-release.mjs` writes it again beside this desk. It does not publish.

