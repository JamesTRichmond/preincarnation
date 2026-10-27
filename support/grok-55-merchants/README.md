# County Book — merchants

Trade for the Addison County generations. Other sessions own the general reward model and the world item catalog. This folder owns stalls, prices, and the commit rules.

One currency: the **mark** (`CURRENCY` in `types.ts`). Era speech changes. The unit does not.

`quote` never mutates. `commit` applies a whole trade or returns the same state. Cancel is not calling `commit`.

Known value is always surfaced. Premiums and scrap rates name themselves. Essentials cannot be sold, spent, or reprinted. Named goods and the meetinghouse bell are only bought on the boards that name them. A keepsake purchase leaves the market. Replenishment refills posted stock and a capped book; it does not mint a second deed, spoon, or bell.

This ledger is not the walk. It is not imported by `src/routes` or `src/components/game-app.tsx`. Mounting `ui/market-app.tsx` on `/` would cover the Green. See `INTEGRATION.md`.

The mark is this book's unit only. It is not loot scrip (`src/game/loot`) and it is not written into `preincarnation.save.v1`.

Run the ledger:

```
node --experimental-strip-types --test support/grok-55-merchants/market.test.ts
```
