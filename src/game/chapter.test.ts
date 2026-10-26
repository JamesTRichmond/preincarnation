import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chapterView,
  deathScript,
  sanitizePending,
  stepChapter,
  type PendingChapter,
} from "./chapter.ts";

function open(cause: PendingChapter["cause"] = "combat", winters = 16): PendingChapter {
  return { kind: "death", line: 0, winters, cause, committed: false, mapId: "middlebury", x: 40, y: 80 };
}

describe("death chapter", () => {
  it("says the count once on a first death, and not again after", () => {
    const first = deathScript(true, "combat");
    assert.equal(first.length, 2);
    assert.equal(first[0].commits, false);
    assert.match(first[1].text, /Fourteen winters/);
    assert.match(first[1].text, /not say this a second time/);
    assert.equal(deathScript(false, "combat")[0].text, "You already know the count.");
    assert.match(deathScript(true, "release")[0].text, /Release/);
  });

  it("commits the stored winters once if you read it, and once if you skip", () => {
    const read = stepChapter(true, open(), "advance");
    assert.equal(read.commitNow, false);
    assert.equal(read.finished, false);
    assert.equal(read.chapter.winters, 16);
    const done = stepChapter(true, read.chapter, "advance");
    assert.equal(done.commitNow, true);
    assert.equal(done.finished, true);
    assert.equal(done.chapter.winters, 16);
    const again = stepChapter(true, done.chapter, "advance");
    assert.equal(again.commitNow, false);

    const skipped = stepChapter(true, open("release", 14), "skip");
    assert.equal(skipped.commitNow, true);
    assert.equal(skipped.finished, true);
    assert.equal(skipped.chapter.winters, 14);
    assert.equal(stepChapter(true, skipped.chapter, "skip").commitNow, false);
  });

  it("a later death is one step and still refuses a second commit", () => {
    const once = stepChapter(false, open(), "advance");
    assert.equal(once.commitNow, true);
    assert.equal(once.finished, true);
    assert.equal(stepChapter(false, once.chapter, "skip").commitNow, false);
  });

  it("drops a pending chapter that already committed or is nonsense", () => {
    assert.equal(sanitizePending(null), null);
    assert.equal(sanitizePending({ kind: "death", committed: true, winters: 14, line: 1, cause: "combat" }), null);
    assert.equal(sanitizePending({ kind: "crown", winters: 14, line: 0, cause: "combat" }), null);
    const kept = sanitizePending({
      kind: "death",
      committed: false,
      winters: 17.8,
      line: 1,
      cause: "release",
      mapId: "quarry",
      x: 12,
      y: 20,
    });
    assert.deepEqual(kept, {
      kind: "death",
      committed: false,
      winters: 17,
      line: 1,
      cause: "release",
      mapId: "quarry",
      x: 12,
      y: 20,
    });
    assert.equal(chapterView(true, kept!).index, 1);
  });
});
