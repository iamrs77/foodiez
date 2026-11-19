# 10. Search that uses an index: matching the start of words

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Restaurant search matched a case-insensitive regular expression anywhere in the name, cuisine or area. That finds "izza" inside "Pizza", but MongoDB can't answer it from an index: it reads every restaurant. Fine for five restaurants; not for thousands.

## Decision

Each restaurant keeps `searchTerms`: the distinct lower-case words of its name, cuisine and area ("Spice Route", "North Indian", "HSR Layout, Bengaluru" → `spice route north indian hsr layout bengaluru`). A Mongoose hook updates them whenever any of those fields change, and the API fills them in at startup for restaurants saved before they existed.

A search splits what was typed into words, and **every word must be the start of one of the restaurant's words**: `{ searchTerms: { $regex: '^piz' } }` for each word. A regular expression anchored at the start can use an index, so the `(sandbox, searchTerms)` index answers it. A test runs MongoDB's `explain` on a search and expects an index scan, not a collection scan.

So `piz` finds Napoli Slice, `north ind` finds Spice Route, and `jaya` finds Dosa Corner by its area.

Rejected alternatives:

- **A MongoDB text index (`$text`).** Uses an index, but matches whole words (after stemming), so typing `piz` finds nothing until the word is complete. Search-as-you-type needs prefixes.
- **Atlas Search.** Fuzzy matching, typos, ranking. But it only runs on Atlas, so local development, the in-memory test database and Docker would all search differently from production.
- **Keeping the unanchored regular expression.** Matches inside words, but reads every restaurant on every keystroke.

## Consequences

- Search stays fast as the number of restaurants grows, and works the same everywhere MongoDB runs.
- **The middle of a word no longer matches**: `izza` finds nothing. People type the starts of words, so this rarely matters; a test records it.
- No typo tolerance or ranking: results are in the chosen sort order. Atlas Search is the step up if that's needed.
- One more array field and index per restaurant, kept in step by a hook. Code that writes restaurants without going through Mongoose documents (raw `updateOne`) would have to update `searchTerms` itself.
