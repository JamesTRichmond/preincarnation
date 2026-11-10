/** Executable migration cases. Tests in `test/persistence.test.ts` run each id. */
export const MIGRATION_CASES = [
  {
    id: "v0-keeps-every-row",
    from: 0,
    summary: "Five inventory rows become five instances, including an unknown whistle.",
  },
  {
    id: "v0-preserves-sibling-keys",
    from: 0,
    summary: "Gold and chapter sit beside the item contract and survive the load.",
  },
  {
    id: "v0-stack-is-not-an-heirloom-set",
    from: 0,
    summary: "Six oak planks stay one stack. They are not six lineages.",
  },
  {
    id: "v0-unique-consumes-canonical-source",
    from: 0,
    summary: "A saved sun coin consumes the barrow source so a later life cannot farm it.",
  },
  {
    id: "v0-refuses-duplicate-unique",
    from: 0,
    summary: "Two rows of the same unique source refuse the save instead of dropping one.",
  },
  {
    id: "v0-missing-inventory-is-not-emptied",
    from: 0,
    summary: "A version 0 object without inventory throws. It does not become an empty collection.",
  },
  {
    id: "v1-keeps-instance-ids",
    from: 1,
    summary: "inst:v1:kept-compass is still that id after the load.",
  },
  {
    id: "v1-keeps-extensions-and-owners",
    from: 1,
    summary: "The compass inscription and Mara's stewardship of the plane are kept.",
  },
  {
    id: "v1-duplicate-id-refused",
    from: 1,
    summary: "A repeated instance id refuses the save instead of merging rows.",
  },
  {
    id: "v2-roundtrip",
    from: 2,
    summary: "A current save reloads without rewriting ids or dropping property.",
  },
  {
    id: "v2-extra-field-kept",
    from: 2,
    summary: "An unknown field on an instance is kept on extensions.",
  },
  {
    id: "v2-interrupted-sale-aborts-on-return",
    from: 2,
    summary: "A pending sale survives the load and aborts when the life ends. The chisel stays Ellis's.",
  },
  {
    id: "v2-vanished-building-keeps-property",
    from: 2,
    summary: "A shawl recovered from a vanished cottage is still in storage when that save is loaded.",
  },
  {
    id: "foreign-contract-refused",
    from: 2,
    summary: "A version 2 document with another contract is not overwritten.",
  },
] as const;
