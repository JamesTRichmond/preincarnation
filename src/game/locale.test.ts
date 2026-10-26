import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SAVE_KEY } from "./types.ts";
import {
  CATALOG,
  LOCALE_KEY,
  LOCALE_REVIEW,
  LOCALES,
  LOCKED_NAMES,
  leaves,
  message,
  placeholders,
  pluralCategory,
  pseudolocalize,
  readLocale,
  unsupportedGlyphs,
  writeLocale,
} from "./locale.ts";

describe("interface locale", () => {
  it("keeps French and Spanish marked for a person, and leaves the campaign in English", () => {
    assert.equal(LOCALE_REVIEW.needsHumanLinguisticReview, true);
    assert.equal(LOCALE_REVIEW.nativeSpeakerApproved, false);
    assert.equal(LOCALE_REVIEW.campaignLocalized, false);
  });

  it("gives every chrome id the same placeholders in en, fr, and es", () => {
    const ids = Object.keys(CATALOG);
    assert.ok(ids.length >= 40);
    for (const id of ids) {
      for (const locale of LOCALES) {
        assert.ok(CATALOG[id][locale], `${id} missing ${locale}`);
      }
      const en = leaves("en", id).map(placeholders);
      const fr = leaves("fr", id).map(placeholders);
      const es = leaves("es", id).map(placeholders);
      assert.deepEqual(fr, en, id);
      assert.deepEqual(es, en, id);
      const glyphs = [...leaves("en", id), ...leaves("fr", id), ...leaves("es", id)].flatMap(
        unsupportedGlyphs,
      );
      assert.deepEqual(glyphs, [], id);
    }
  });

  it("keeps locked names when the English line uses them", () => {
    for (const name of LOCKED_NAMES) {
      for (const id of Object.keys(CATALOG)) {
        const en = leaves("en", id).join("\n");
        if (!en.includes(name)) continue;
        for (const locale of ["fr", "es"] as const) {
          for (const line of leaves(locale, id)) {
            assert.ok(line.includes(name), `${id} ${locale} dropped ${name}`);
          }
        }
      }
    }
  });

  it("treats French 0 and 1 as one, and English or Spanish 0 as other", () => {
    assert.equal(pluralCategory("fr", 0), "one");
    assert.equal(pluralCategory("fr", 1), "one");
    assert.equal(pluralCategory("fr", 2), "other");
    assert.equal(pluralCategory("en", 0), "other");
    assert.equal(pluralCategory("es", 0), "other");
    assert.equal(pluralCategory("en", 1), "one");
    assert.equal(pluralCategory("es", 1), "one");
    assert.equal(message("fr", "create.left", { max: 3 }, 0), "0 restant sur 3");
    assert.equal(message("fr", "create.left", { max: 3 }, 1), "1 restant sur 3");
    assert.equal(message("fr", "create.left", { max: 3 }, 2), "2 restants sur 3");
    assert.equal(message("es", "create.left", { max: 3 }, 0), "0 restantes de 3");
    assert.equal(message("es", "create.left", { max: 3 }, 1), "1 restante de 3");
    assert.equal(message("en", "pause.pts", {}, 1), "1 pt");
    assert.equal(message("en", "pause.pts", {}, 0), "0 pts");
  });

  it("returns the id when a string is missing, and keeps placeholders in pseudolocale", () => {
    assert.equal(message("en", "not.a.string"), "not.a.string");
    const pseudo = pseudolocalize("Walk {name}");
    assert.ok(pseudo.includes("{name}"));
    assert.ok(pseudo.startsWith("["));
    assert.ok(pseudo.length > "Walk {name}".length);
  });

  it("stores the locale beside the save, not inside it", () => {
    assert.notEqual(LOCALE_KEY, SAVE_KEY);
    const bag = new Map<string, string>();
    const storage: Pick<Storage, "getItem" | "setItem"> = {
      getItem: (key) => bag.get(key) ?? null,
      setItem: (key, value) => {
        bag.set(key, value);
      },
    };
    writeLocale("es", storage);
    assert.equal(bag.get(LOCALE_KEY), "es");
    assert.equal(bag.has(SAVE_KEY), false);
    assert.equal(readLocale(storage), "es");
    bag.set(LOCALE_KEY, "nope");
    assert.equal(readLocale(storage), "en");
    assert.equal(readLocale(null), "en");
  });
});
