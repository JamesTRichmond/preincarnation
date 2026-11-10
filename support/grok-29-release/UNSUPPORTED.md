# Platforms this release does not support

Checked against commit `c737e42eb188148291438dfb8a5993d6ce2b77fa` of `JamesTRichmond/preincarnation`. The only distribution target in the engine is a web app: TanStack Start, Nitro preset `vercel`, canvas in the browser, save in `localStorage`.

| Platform | Verdict | Why |
| --- | --- | --- |
| Web, one origin, Vercel build output | Supported channel | `vite.config.ts` sets `nitro({ preset: "vercel" })`. This release is that output, packaged, not deployed. |
| Browser home-screen shortcut (PWA manifest, iOS `?install=1&platform=ios`) | Shortcut only | The manifest is a name, an icon, and `display: standalone`. No service worker is registered. It is not an installed offline app. |
| Offline play | Partial | The shell worker can reopen the document, the manifest, and art it has already fetched. A first open still needs the network. The save is not in that cache. Update checks that cannot fetch the release manifest report offline and leave the life untouched. |
| Steam, Steam Deck, Steamworks | Not supported | No app id, no Steamworks SDK, no depot or `steam_appid.txt`. Not tested. Not certified. |
| Nintendo (Switch and any other Nintendo hardware) | Not supported | No Nintendo SDK, no ROM or package, no certification. |
| PlayStation, Xbox | Not supported | No console SDK and no package. |
| iOS App Store, Google Play, other mobile stores | Not supported | No Xcode or Gradle project. |
| Electron, Tauri, NW.js, native Windows/macOS/Linux installers | Not supported | Not in `package.json` or the tree. No desktop binary was produced or tested. |
| Signed or notarized desktop builds | Not supported | No signing was performed. Private credentials were not used. |
| Physical media | Not supported | Nothing was manufactured. |

A build command (`npm run dev`, `npm run build`) is not this package. The package is `dist/preincarnation-web-c737e42eb188-save8.tar.gz` plus `SHA256SUMS` inside it.
