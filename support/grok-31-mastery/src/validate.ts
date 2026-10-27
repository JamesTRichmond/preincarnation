import { assertReferenceReady, coverage, referenceCatalog } from "./index.ts";

const catalog = referenceCatalog();
const problems = assertReferenceReady(catalog);
const report = coverage(catalog);
if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      module: "reference",
      libraryComplete: report.complete,
      authored: report.authored,
      reserved: report.reserved,
      expected: report.expected,
    },
    null,
    2,
  ),
);
