# 5. One restaurant per cart, and orders that keep a copy of what was ordered

- **Status:** Accepted; amended by [ADR 0009](0009-order-lifecycle-and-safe-checkout.md)
- **Date:** 2026-10-12

## Context

An order has to stay correct after the menu changes: if a dish's price goes up tomorrow, yesterday's order must still show what was paid. And like real delivery apps, one order is delivered from one kitchen.

## Decision

- **A cart holds dishes from one restaurant.** Adding a dish from another restaurant is refused with a `409` that names the restaurant already in the cart. The web app checks first and offers to empty the cart; the API enforces it either way.
- **The cart is one document per dish**, with a quantity from 1 to 20 and a unique index on (user, dish). Adding a dish that's already in the cart raises its quantity.
- **An order is a snapshot.** Placing an order copies each dish's name, price, veg flag and quantity, and the restaurant's name, into the order. It keeps the dish and restaurant ids too, but never reads through them for history.
- **Prices and totals come from the database.** The browser only sends dish ids and quantities.
- **Every cart endpoint returns the whole cart** with its total, and the web app puts it straight into its cache, so the cart page and the navbar count update from one request.

## Consequences

- Changing or deleting a dish or a restaurant never changes past orders. A test checks that an old order keeps the price that was paid.
- If a dish is deleted while it's in a cart, the cart drops it the next time it's read, rather than failing at checkout.
- Placing an order was two steps (create the order, then empty the cart) and wasn't atomic: two tabs placing the same cart at the same moment could create two orders. **Closed by [ADR 0009](0009-order-lifecycle-and-safe-checkout.md)**, which puts checkout in a transaction and adds idempotency keys.
- The one-restaurant check reads the cart and then writes, so two adds from different restaurants at the same moment could both pass. A person adds one dish at a time, so it's left as is.
