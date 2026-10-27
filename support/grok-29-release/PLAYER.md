# PREINCARNATION — keeping a life

This is a web game. One browser on one site holds one life. There is no account and no cloud save. If the browser drops the site, the life is gone unless you downloaded it first.

The life is not a file the game writes to your desktop by itself. It lives in the site's local storage under the name `preincarnation.save.v1`. Music you put in the strange device is separate, in a small database named `preincarnation.deck.v1`.

## Install

There is no installer, no store page, and no console cartridge.

You play it in a browser, from the site where this build is hosted. Add-to-home-screen (including the iPhone hint at `?install=1&platform=ios`) only makes a shortcut. It does not download the world, and it will not open the game on a plane the first time.

This package is a finished web build for Vercel (`web-output/`). It is not launched by double-clicking. Publishing it is a separate step and was not done here.

## Launch

Open the site. If a life is already stored, continue it. If not, you wake as Ellis Perch on the Green.

Arrows or WASD walk. Space slashes. E talks. Q cycles the off-hand.

If a tab dies while the title is still loading, do not start a new life to "fix" it. The unfinished launch does not delete a life. Close the tab and open the site again.

## Before you update

Open `/release/save-desk.html` on the same site (same browser) and choose **Download this life**. Keep `preincarnation-life.json` somewhere that is not the browser.

Then check **Check for a new build**.

- If the site cannot be reached, you are offline. That does not mean you are up to date. Your life is still on the device. This build cannot play the world without the network the first time, and it does not keep an offline copy.
- If the page and the site name different builds, download the life before you keep playing. The check does not swap files and does not delete the life.

A new build must not be mixed with pictures cached from an older one. This package stamps every `/game/...` picture URL with `?b=web-c737e42eb188-save8`. The page itself is marked not to be kept by the host cache. One shell worker may keep `/`, the manifest, the icons, and pictures it has already fetched. It does not keep the save.

## Bring a life back

On `/release/save-desk.html`, choose **Bring a life back** and pick the JSON file.

- The life already on the device is copied into `preincarnation.release.rescue` first.
- A life from an older chapter (save versions 1 through 8) is brought forward by the game's own migration. Version 8 is this build. Your name, bond, and what you already did are kept.
- The same file a second time does nothing.
- A broken file does nothing.
- A life newer than version 8 is refused. It is not downgraded. The life already here stays.
- If the browser refuses the write (private window, full storage, storage blocked), the import is cancelled and the previous life is put back.

Reload the game after a successful import.

The strange device's audio is inside that same JSON file. A life file from this desk carries it. A file that is only the raw `preincarnation.save.v1` text does not.

## If the game wakes you as a stranger

The game, if it cannot read the life, starts a new one and does not tell you it kept the old text. Before you take a step:

1. Open the life desk and download whatever is there.
2. In the browser's site data, the previous readable life may still be under `preincarnation.save.v1.bak` until the next successful save. The next save **replaces that backup**, and a brand new life replaces it with nothing. Copy it out first.
3. `preincarnation.save.v1.premigration` is the raw life from before this build's migration, if this build's guard saw an older life.
4. `preincarnation.save.v1.future` is a life this build refused to open because it is newer.
5. `preincarnation.save.v1.unreadable` is text that was not valid JSON.
6. `preincarnation.release.rescue` is the snapshot taken just before an import.

Put a known-good JSON back through the life desk. Do not press the game's new-life reset if you still want the old one.

## What this build will not do

It will not sync two browsers. It will not survive "clear site data" without the file you downloaded. It will not run from Steam, a Nintendo system, PlayStation, Xbox, an app store, or a signed desktop installer. Those are not builds of this game. See `UNSUPPORTED.md`.
