# 7. One free service on Render, with MongoDB Atlas

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

The live demo must be free to host, with no credit card and no trial that runs out. Locally and in Docker, the web app and the API are separate: Vite or nginx serves the web app and passes `/api` to the API.

## Decision

On the public site, **the API also serves the built web app**: when `WEB_APP_DIR` is set, Express serves its files, caches the hashed assets for a year, and answers every other page with `index.html` so the web app's router can show it. Unknown `/api` routes still get JSON errors. It runs as **one free Render web service**, with a **free MongoDB Atlas cluster** as the database, set up by `render.yaml` and [docs/deploy.md](../deploy.md).

- **One origin**: the web app calls `/api` on its own address, so there's no CORS to configure and no API address to build into the web app.
- **One service to deploy, watch and keep inside free limits.** Render deploys it after GitHub Actions CI passes on `main`.
- **Region**: Render's Virginia region and Atlas's AWS N. Virginia region, so database calls stay within one area.

Turned down:

- **The web app on a free static host** (Render static sites, Netlify), with the API separate. Static hosts never sleep, so the page would appear at once, but its first API call would still wait for the sleeping API. It would mean two deploys, CORS, and building the API's address into the web app.
- **Vercel or Netlify functions for the API.** The API would need restructuring into functions, with a new database connection for many requests.

Docker Compose keeps nginx in front, because that's the closer copy of a production setup with a separate web server.

## Consequences

- **Render's free service sleeps after 15 minutes without requests**, so the first visit after a quiet spell waits about a minute. That's the price of free; an uptime pinger would spend the month's free hours.
- **One instance.** The in-memory rate limits are correct for it; a second instance would need a shared store for them.
- **Atlas pauses a free cluster after weeks without connections.** It's resumed from the Atlas dashboard.
- The deployment installs the web app's build tools to build it, but only the API's runtime dependencies to run it, which also skips the in-memory MongoDB the tests use.
