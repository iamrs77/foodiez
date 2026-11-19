# 9. An order lifecycle, and placing orders safely

- **Status:** Accepted
- **Date:** 2026-11-20
- **Amends:** [ADR 0005](0005-cart-and-orders.md), which left duplicate orders open, and [ADR 0002](0002-mongodb.md), which used no transactions

## Context

An order used to stop at "placed": restaurants had no way to see it, and checkout asked for nothing. And as [ADR 0005](0005-cart-and-orders.md) recorded, placing an order wasn't atomic: two tabs ordering the same cart at the same moment could both succeed, and a retried request after a timeout placed a second order.

## Decision

### A lifecycle, moved by the restaurant

An order is `placed`, then `accepted`, `preparing`, `out_for_delivery` and `delivered`, or `cancelled`. Each change is recorded with its time (`statusHistory`), which the customer's tracking page shows. Only the restaurant moves it forward, one step at a time (`NEXT_STATUSES`); the customer can cancel only while it's `placed`.

**Changes are compare-and-set.** The update only applies if the order is still in the status that was read: `findOneAndUpdate({ _id, status: <what was read> }, …)`. If the restaurant accepts at the same moment the customer cancels, or a button is double-clicked, exactly one change wins and the other gets a `409`. No lock or transaction is needed for a single document.

The restaurant's Orders page and the customer's tracking page **poll every 5 seconds** while an order is open (and stop when the tab is hidden or the order is finished), rather than using WebSockets or server-sent events. For updates a few times per order, polling is simple, survives the free host sleeping and waking, and needs nothing kept open on the server.

### Checkout in one transaction

Placing an order reads the cart, creates the order and empties the cart **in one MongoDB transaction**. If two transactions take the same cart, the second one's writes conflict with the first's; MongoDB retries it, it finds the cart empty, and it fails with "Your cart is empty". A test fires three checkouts of one cart at once and expects exactly one order. Without the transaction, the same test gets three.

Every query inside the transaction joins it automatically (Mongoose's `transactionAsyncLocalStorage`), so no query can be left out by forgetting to pass the session.

### Idempotency keys for retries

The web app makes up a key for each checkout and sends it as `Idempotency-Key`, keeping it until the order succeeds. A unique index on (user, key) means a retried request, or the same request arriving twice at once, gets the first order back (`200`) instead of placing another.

### Delivery details

Checkout asks for an address, phone number and note, filled in from the customer's last order. They're copied into the order, like its dishes and prices, and shown to the restaurant.

## Consequences

- The duplicate-order and crash-between-steps gaps in [ADR 0005](0005-cart-and-orders.md) are closed.
- **Transactions need a replica set.** MongoDB Atlas is one. The tests and `npm run dev` run a one-member replica set in memory, and Docker's MongoDB runs as one; CI places an order through the Docker setup to check it. A single plain `mongod` (an install without replication) still works: the API notices and places orders without a transaction, and logs a warning.
- A transaction costs a few extra round trips per order, which doesn't matter at this scale.
- Polling costs one small request per open page every 5 seconds. It's the first thing to replace (with server-sent events) if many restaurants kept the Orders page open all day.
- The one-restaurant cart rule still reads, then writes, outside a transaction, so two adds from different restaurants at the same instant could still mix a cart. A person adds one dish at a time, so it's left as is.
