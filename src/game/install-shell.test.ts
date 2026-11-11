import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const root = new URL("../../", import.meta.url);

function read(rel: string): string {
  return readFileSync(new URL(rel, root), "utf8");
}

describe("install shell", () => {
  it("names one app, standalone, at the county root", () => {
    const manifest = JSON.parse(read("public/manifest.webmanifest"));
    assert.equal(manifest.name, "Preincarnation");
    assert.equal(manifest.short_name, "Preincarnation");
    assert.equal(manifest.start_url, "/");
    assert.equal(manifest.scope, "/");
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.background_color, "#070b18");
    assert.equal(manifest.theme_color, "#070b18");
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes).sort();
    assert.deepEqual(sizes, ["192x192", "512x512"]);
  });

  it("caches the 320×240 shell and leaves accounts and the save alone", () => {
    const worker = read("public/sw.js");
    for (const url of ["/", "/manifest.webmanifest", "/favicon.svg", "/icon-192.png", "/icon-512.png"]) {
      assert.ok(worker.includes(`"${url}"`), url);
    }
    assert.match(worker, /\/api/);
    assert.match(worker, /\/auth/);
    assert.equal(worker.includes("localStorage"), false);
    assert.equal(worker.includes("account"), false);
  });

  it("the document points at that manifest and registers only /sw.js", () => {
    const head = read("src/routes/__root.tsx");
    const registrar = read("src/components/install-shell.tsx");
    assert.ok(head.indexOf('href: "/manifest.webmanifest"') < head.indexOf('href: "/__grok/manifest.webmanifest"'));
    assert.match(registrar, /navigator\.serviceWorker\.register\("\/sw\.js"\)/);
    assert.equal(registrar.includes("/api"), false);
  });
});
