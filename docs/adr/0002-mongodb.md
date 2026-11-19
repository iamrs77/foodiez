# 2. Keep MongoDB, with Mongoose

- **Status:** Accepted; amended by [ADR 0009](0009-order-lifecycle-and-safe-checkout.md)
- **Date:** 2026-10-12

## Context

The 2021 API used MongoDB through Mongoose 5. The 2026 rebuild rewrote most of the API, which was the moment to switch databases if there was a reason to.

## Decision

Keep MongoDB, and update to Mongoose 9.

- **The data fits documents.** A restaurant and its menu, and an order with copies of the dishes in it, are read whole. An order's items are embedded in the order, so order history is one query with no joins.
- **It runs anywhere without an install.** `mongodb-memory-server` downloads and runs a real MongoDB in memory, so `npm run dev` and the tests need nothing but Node.js: no database install, no Docker.
- **There's a free hosted plan with no time limit**: MongoDB Atlas's free cluster, 512 MB.
- **TTL indexes** let the database delete each visitor's demo by itself after 24 hours ([ADR 0006](0006-demo-sandboxes.md)).

Mongoose adds schemas with validation and defaults, and a `toJSON` plugin that renames `_id` to `id` and hides fields such as the password hash in every response.

Turned down: **PostgreSQL**. It would give foreign keys (deletes could cascade in the database) and simple multi-row transactions. But the app's relationships are few, and moving the data and rewriting every query would have been most of the rebuild's work for little gain at this size.

## Consequences

- **Deletes cascade in code.** Deleting a restaurant deletes its dishes and removes them from carts in the controller; the database doesn't enforce it.
- **Transactions where they matter.** At first no transactions were used, so placing an order (create it, then empty the cart) could be done twice or half done. [ADR 0009](0009-order-lifecycle-and-safe-checkout.md) moved checkout into a transaction. Transactions need a replica set: Atlas is one, and the in-memory and Docker databases run as one-member replica sets.
- **Uniqueness comes from indexes**: one account per email, one dish name per restaurant, one cart row per dish. Tests build the indexes before they run, so they behave as in production.
