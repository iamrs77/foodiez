# 8. The tech stack, and what each choice replaced

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

The 2021 version used Create React App with React 16, Redux with redux-thunk, redux-persist and axios, React Router 5 and Tailwind 2 on the front end, and Express 4, Mongoose 5, JWT and bcrypt on the back end. By 2026, Create React App was deprecated and most of these were several major versions behind. The rebuild kept what still held up and replaced what didn't.

## Decision

### Web app

- **React 19, built with Vite** instead of Create React App, which is no longer maintained. Vite's dev server also passes `/api` to the API, so the web app always calls its own origin.
- **Redux Toolkit with RTK Query** instead of hand-written Redux, thunks and axios. The 2021 app was already built on Redux, and RTK Query adds what the hand-written version lacked: cached server data, loading and error states, and refetching by tag (adding a dish refreshes the menu; placing an order refreshes the cart and order history). Cart endpoints answer with the whole cart, which goes straight into the cache. The login lives in the same store and is saved to `localStorage`, replacing redux-persist.
- **React Router 8**, for pages and for keeping the search in the URL, so a search can be shared or reloaded.
- **Tailwind CSS 4**, carried over from the 2021 Tailwind version of the app and updated. A handful of shared classes (`btn`, `card`, `input`) keep pages consistent without a component library.

Turned down: **TanStack Query** (what [Stockroom](https://github.com/iamrs77/stockroom) uses) would do the server-data part as well. RTK Query was the natural step from the 2021 app's Redux, and keeps the login and the server data in one store.

### API

- **Express 5** instead of 4. Errors thrown in `async` handlers reach the error handler by themselves, so no handler needs its own try/catch to keep a bad request from crashing the server.
- **zod** validates every request body and drops unknown fields. In the 2021 API, an empty request body could crash the server.
- **Mongoose 9** on MongoDB ([ADR 0002](0002-mongodb.md)), **jsonwebtoken** and **bcrypt** for logins ([ADR 0003](0003-jwt-logins.md)), **helmet** for security headers and **express-rate-limit** for logins and demos.

### Tests and tooling

- **Vitest** for both halves, with **supertest** sending real HTTP requests to the API and **mongodb-memory-server** running a real MongoDB in memory, so the tests need no setup and check real queries and indexes.
- **Testing Library** renders the whole web app with a fake `fetch`, and tests click through it like a person would.
- **Playwright** runs the built app in a real browser, the way the public demo runs it, and clicks through whole journeys: ordering as a customer and accepting the order as the restaurant, menu changes staying inside one demo. Each test also fails on any browser console error.
- **An OpenAPI 3.1 spec** (`backend/src/openapi.yaml`), served with Swagger UI at `/api/docs`. A contract test checks real responses against it with **Ajv**, so the documentation can't drift from the API.
- **ESLint and Prettier**, checked in CI along with the tests, the build and the Docker setup.

### Logs

**pino** writes one line per request with a request id, which is also sent back as `X-Request-Id` and included in any `500` response, so a reported error can be found in the logs. JSON in production, readable lines while developing.

### Still JavaScript

Both halves stay in JavaScript, as in 2021. Moving to TypeScript would touch every file. Instead, zod checks data where it enters the API, and the tests cover behaviour end to end.

## Consequences

- Every dependency is current and maintained, and `npm audit` reports no known vulnerabilities in what runs in production.
- **No compile-time types.** A renamed field is caught by a test or at run time, not by the editor. The API's zod schemas are the source of truth for request shapes, and the web app shows their field errors.
- The front end and back end use the same test runner, so `npm test` runs both the same way.
