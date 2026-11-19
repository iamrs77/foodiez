# 4. Two roles, ownership checked on every change, and no admin

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

The 2021 API had serious access problems: anyone could register as an admin, any vendor could edit or delete any restaurant or dish, removing a cart item could delete another customer's item, and the sign-up response included the password hash.

## Decision

- **Two roles: customer and vendor.** The role is picked at sign-up from those two values only. There is no admin role, so there's nothing to sign up as or escalate to.
- **The API checks the role on each endpoint** (`requireRole`): only customers have carts and orders, only vendors manage restaurants.
- **The API checks ownership on every change.** Changing or deleting a restaurant first loads it and compares its owner with the logged-in vendor; for a dish, through the dish's restaurant. A vendor who isn't the owner gets a `403`.
- **Customer data is filtered by the logged-in user** in the query itself (for example, a cart item is found by its id *and* the user), so another customer's item simply isn't found.
- **Request bodies go through zod schemas that drop unknown fields**, so a client can't set `owner`, `role`, `total` or a price on an order.

The web app hides what a role can't do, but that's for convenience: the API is what enforces it.

## Consequences

- Each rule has a test that tries it with a second account: another vendor's restaurant, another customer's cart item, signing up as an admin.
- Ownership checks cost an extra read before each change, which is negligible here.
- There's no way to moderate content from inside the app. On the public site, sign-ups are off and visitors use private demos ([ADR 0006](0006-demo-sandboxes.md)), so there's nothing shared to moderate.
