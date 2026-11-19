# 1. One repository for the API and the web app

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

The 2021 version of Foodiez was five repositories: an Express API, and the same React app built four times (plain CSS, Material-UI, Tailwind and AWS Amplify). A change that touched both the API and the web app meant two repositories, two pull requests and no single place to run everything.

## Decision

One repository with two folders, `backend/` and `frontend/`. The API and the Tailwind version of the web app were imported with their history (`git subtree`), so the 2021 commits are still there. The other three web app versions were dropped.

Each folder keeps its own `package.json` and lockfile. The root `package.json` only has scripts that run a command in each folder (`npm install`, `npm run dev`, `npm test`, `npm run build`), through a small helper, `scripts/run-in.mjs`.

## Consequences

- One clone and one `npm install` set up everything, and one `npm run dev` runs the API and the web app together.
- A change to an endpoint and the page that uses it is one commit and one CI run.
- Each Docker image installs only its own folder's dependencies, and the free deployment installs the API's runtime dependencies without the web app's build tools.
- The two folders share no code. The API's zod schemas are the only full copy of the validation rules: the web app's forms do basic browser checks (required fields, number ranges) and show the field errors the API returns next to each field. Sharing the schemas would need npm workspaces or a shared package, which this app is too small to need yet.
