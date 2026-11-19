# 6. A private sandbox per demo visitor, deleted by TTL indexes

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

The public demo should let visitors try everything, as a customer and as a restaurant owner, without signing up. The local version offers shared demo accounts with a published password. Online, that breaks: anyone logged in as the demo vendor could rename or delete the restaurants every other visitor sees, and all visitors would share one cart and one order history.

The demo must also stay inside a free 512 MB database, with no job server to clean up after visitors.

## Decision

Each visitor who presses **Try the demo** gets a **sandbox**: a private copy of the demo accounts, restaurants, dishes and past orders.

- **Every collection has a `sandbox` field** (added by one Mongoose plugin). It's `null` for the showcase and real accounts, and points to a `Sandbox` document for demo data.
- **The sandbox comes from the login**, never from the request. Every query that isn't already filtered by the user filters by the user's sandbox: the restaurant list, a restaurant, a menu, a dish being added to a cart. Pages anyone can browse use optional login, so a logged-out visitor sees the showcase and a demo visitor sees their copy.
- **New documents join their creator's sandbox**: a restaurant takes its vendor's, a dish its restaurant's, a cart item or order its customer's.
- **Every sandbox document has an `expiresAt` date with a TTL index**, so MongoDB deletes the whole demo by itself 24 hours later. Documents outside a sandbox have no `expiresAt` and never expire.
- **Logins end with the demo.** The token expires at the sandbox's `expiresAt`, and `requireAuth` refuses an expired demo user, because MongoDB's TTL check only runs about once a minute.
- **Demo accounts can't log in with a password**, only through their demo. A **Switch** button gives a token for the other side of the same sandbox (customer ↔ restaurant owner).
- **The showcase is read-only on the public site**: `DEMO_ACCOUNTS_LOGIN=false` and `SIGNUPS_ENABLED=false`.
- **Limits**: 10 new demos per IP per hour, at most 200 active (`503` beyond that).

Rejected alternatives:

- **Shared accounts, reset every night.** Little work, but any visitor can vandalise the data for everyone until the reset, and visitors see each other's carts and orders.
- **Private customers with a read-only vendor.** Safe, but hides half of the app: the vendor pages are much of what's worth showing.
- **A database per visitor.** Perfect isolation, but creating and dropping databases is slow, and free clusters limit how many collections and databases they hold.
- **A clean-up job that deletes old demos.** It needs a scheduler and has to know every collection; a forgotten one leaks data. A TTL index on each collection can't be forgotten, because the same plugin adds the field and the index.

## Consequences

- Visitors can change anything, and nothing they do is seen by anyone else. Tests check this with two visitors at once, and that every document of a demo carries its expiry.
- **Every new query has to remember the sandbox.** It's one filter, but leaving it off would show demo data to the wrong people. The existing queries are covered by tests that put two sandboxes side by side; new ones need the same.
- A demo is about 35 small documents and takes about 20 database operations to create. With at most 200 active, demos use a few megabytes, and the TTL indexes keep that flat.
- The TTL index adds one index per collection. That's cheap at this size.
