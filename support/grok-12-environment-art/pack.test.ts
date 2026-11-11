import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

type AtlasRef = { atlas: string; x: number; y: number; w: number; h: number };

type Tile = {
  id: string;
  w: number;
  h: number;
  layer: string;
  walk: string;
  collision: number[][];
  blocks: boolean;
  status: string;
  atlas: AtlasRef;
  file: string;
};

type Validation = {
  total_tiles: number;
  shared_ground_and_architecture: number;
  district_counts: Record<string, number>;
  props: number;
  interior_kit_counts: Record<string, number>;
  era_counts: Record<string, number>;
  seam_failures: number;
  unfinished: string[];
  minimums: Record<string, boolean>;
};

function pngSize(buf: Buffer): { w: number; h: number } {
  assert.equal(buf.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(buf.toString("ascii", 12, 16), "IHDR");
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

describe("county environment art", () => {
  const validation = JSON.parse(
    readFileSync(join(root, "metadata/validation.json"), "utf8"),
  ) as Validation;
  const tiles = JSON.parse(readFileSync(join(root, "metadata/tiles.json"), "utf8")) as Tile[];

  it("meets the library minimums and leaves the county save alone", () => {
    assert.deepEqual(validation.unfinished, []);
    assert.equal(validation.seam_failures, 0);
    assert.equal(validation.minimums.shared_at_least_64, true);
    assert.equal(validation.minimums.each_district_at_least_24, true);
    assert.equal(validation.minimums.props_at_least_60, true);
    assert.equal(validation.minimums.eight_kits, true);
    assert.equal(validation.minimums.six_eras, true);
    assert.equal(validation.minimums.twelve_scenes, true);
    assert.ok(validation.shared_ground_and_architecture >= 64);
    assert.equal(validation.props, 60);
    assert.equal(Object.keys(validation.district_counts).length, 12);
    for (const count of Object.values(validation.district_counts)) {
      assert.ok(count >= 24);
    }
    assert.equal(Object.keys(validation.interior_kit_counts).length, 8);
    for (const count of Object.values(validation.interior_kit_counts)) {
      assert.equal(count, 16);
    }
    assert.equal(Object.keys(validation.era_counts).length, 6);
    for (const count of Object.values(validation.era_counts)) {
      assert.equal(count, 16);
    }
    assert.equal(tiles.length, validation.total_tiles);
    assert.equal(tiles.length, 1419);

    const source = readdirSync(join(root, "source")).filter((name) => name.endsWith(".py"));
    assert.ok(source.includes("lib.py"));
    for (const name of source) {
      const text = readFileSync(join(root, "source", name), "utf8");
      assert.equal(text.includes("localStorage"), false, name);
      assert.equal(text.includes("preincarnation.save"), false, name);
    }
  });

  it("keeps every tile on the 16px grid, with collision and a file that matches", () => {
    const ids = new Set<string>();
    const walks = new Set(["all", "none", "partial"]);
    for (const tile of tiles) {
      assert.equal(ids.has(tile.id), false, tile.id);
      ids.add(tile.id);
      assert.equal(tile.status, "finished", tile.id);
      assert.equal(tile.w % 16, 0, tile.id);
      assert.equal(tile.h % 16, 0, tile.id);
      assert.ok(tile.layer.length > 0, tile.id);
      assert.ok(walks.has(tile.walk), tile.id);
      assert.equal(Array.isArray(tile.collision), true, tile.id);
      assert.equal(typeof tile.blocks, "boolean", tile.id);
      for (const rect of tile.collision) {
        assert.equal(rect.length, 4, tile.id);
        for (const n of rect) assert.equal(Number.isFinite(n), true, tile.id);
      }
      const file = join(root, tile.file);
      assert.equal(existsSync(file), true, tile.file);
      const size = pngSize(readFileSync(file));
      assert.equal(size.w, tile.w, tile.file);
      assert.equal(size.h, tile.h, tile.file);
      assert.equal(existsSync(join(root, tile.atlas.atlas)), true, tile.atlas.atlas);
      assert.equal(tile.atlas.w, tile.w, tile.id);
      assert.equal(tile.atlas.h, tile.h, tile.id);
    }
  });

  it("ships atlas sheets whose edges sit on the 16px grid", () => {
    const sheets = [...new Set(tiles.map((tile) => tile.atlas.atlas))].sort();
    assert.ok(sheets.length >= 12 + 6 + 8);
    const bounds = new Map<string, { w: number; h: number }>();
    for (const sheet of sheets) {
      const size = pngSize(readFileSync(join(root, sheet)));
      assert.equal(size.w % 16, 0, sheet);
      assert.equal(size.h % 16, 0, sheet);
      assert.ok(size.w > 0 && size.h > 0, sheet);
      bounds.set(sheet, size);
    }
    for (const tile of tiles) {
      const size = bounds.get(tile.atlas.atlas);
      assert.ok(size, tile.id);
      assert.ok(tile.atlas.x % 16 === 0, tile.id);
      assert.ok(tile.atlas.y % 16 === 0, tile.id);
      assert.ok(tile.atlas.x + tile.atlas.w <= size.w, tile.id);
      assert.ok(tile.atlas.y + tile.atlas.h <= size.h, tile.id);
    }
  });
});
