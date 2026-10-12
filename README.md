# Foodiez

[![CI](https://github.com/iamrs77/foodiez/actions/workflows/ci.yml/badge.svg)](https://github.com/iamrs77/foodiez/actions/workflows/ci.yml)

A food ordering web app. Customers browse restaurants, add dishes to a cart and place orders. Restaurant owners (vendors) add their restaurants and manage their menus.

Built with **React**, **Node.js (Express)** and **MongoDB**.

![Foodiez home page](docs/screenshots/home.png)

## Try it

The app starts with demo restaurants and accounts. Every demo account uses the password `password123`, and the login page has buttons that fill them in for you.

| Account                | What you can do                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| `customer@foodiez.dev` | Order food. Already has two past orders.                                |
| `vendor@foodiez.dev`   | Owns Spice Route, Napoli Slice and Dosa Corner. Can change their menus. |
| `vendor2@foodiez.dev`  | Owns Wok Express and Burger Barn.                                       |

## What it does

**For customers**

- Browse and search restaurants by name, cuisine or area, without logging in.
- Add dishes to the cart and change quantities. Like real delivery apps, one order comes from one restaurant.
- Place an order and see your order history, with the price you actually paid.

**For vendors**

- Add restaurants, and add, change or delete dishes (marked veg or non-veg).
- Vendors can only change their own restaurants. The API checks this on every request, not just the web app.

**Under the hood**

- Passwords are hashed with bcrypt. Logging in gives a JWT token.
- Login attempts are rate limited, and a wrong email and a wrong password give the same error, so nobody can find out who has an account.
- Every request body is checked with zod. Bad data gets a clear `400` error that the web app shows next to the right field.
- Orders keep a copy of each dish and its price, so changing a menu later doesn't change old orders.
- 38 API tests and 19 web app tests. GitHub Actions runs them on every push and also checks that the Docker setup starts.

| Menu                                  | Cart                                  |
| ------------------------------------- | ------------------------------------- |
| ![Menu page](docs/screenshots/menu.png) | ![Cart page](docs/screenshots/cart.png) |

| Order history                             | Vendor's restaurants                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| ![Order history](docs/screenshots/orders.png) | ![Vendor's restaurants](docs/screenshots/vendor-restaurants.png) |

## Tech stack

| Part     | Tools                                                                  |
| -------- | ---------------------------------------------------------------------- |
| Web app  | React 19, Vite, React Router, Redux Toolkit (RTK Query), Tailwind CSS 4 |
| API      | Node.js, Express 5, Mongoose, zod, JWT, bcrypt, helmet                 |
| Database | MongoDB                                                                |
| Tests    | Vitest, Testing Library, supertest, mongodb-memory-server              |
| DevOps   | Docker Compose, nginx, GitHub Actions                                  |

## How to run it

### Option 1: Docker (easiest)

You only need [Docker](https://docs.docker.com/get-docker/).

```bash
git clone https://github.com/iamrs77/foodiez.git
cd foodiez
docker compose up --build
```

Open **http://localhost:8080**. The demo data is added the first time the database starts. Press `Ctrl+C` to stop, and run `docker compose down` to remove the containers (add `--volumes` to delete the data too).

### Option 2: Node, without installing a database

You need **Node 22 or newer**. The API starts its own temporary MongoDB with the demo data, so there is nothing else to install. Everything is reset when you stop it.

```bash
# terminal 1: the API on http://localhost:5000
cd backend
npm install
npm run dev:memory

# terminal 2: the web app
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

### Option 3: Node with your own MongoDB

Start MongoDB with `docker compose up -d db` or install it yourself, then:

```bash
cd backend
cp .env.example .env    # Windows PowerShell: copy .env.example .env
npm install
npm run dev             # restarts when you change code
```

Start the web app the same way as in option 2. `npm run seed` (in `backend`) resets the database to the demo data. The settings are explained in [`backend/.env.example`](backend/.env.example).

## Tests

```bash
cd backend && npm test    # API tests, they start their own in-memory MongoDB
cd frontend && npm test   # web app tests
```

- **API tests** send real HTTP requests to the app. They check, for example, that a vendor can't change another vendor's restaurant, that one customer can't touch another customer's cart, that nobody can sign up as an admin, and that old orders keep the price that was paid.
- **Web app tests** render the real pages with a fake network. They cover logging in, coming back to the page that asked for a login, adding dishes, the one-restaurant cart rule and placing an order.

## API

| Method | Path                         | Who               | What it does                       |
| ------ | ---------------------------- | ----------------- | ---------------------------------- |
| POST   | `/api/auth/register`         | anyone            | Create an account                  |
| POST   | `/api/auth/login`            | anyone            | Log in, returns a token            |
| GET    | `/api/auth/me`               | logged in         | Your account                       |
| GET    | `/api/restaurants?search=`   | anyone            | List or search restaurants         |
| GET    | `/api/restaurants/:id`       | anyone            | One restaurant                     |
| GET    | `/api/restaurants/:id/dishes`| anyone            | A restaurant's menu                |
| GET    | `/api/restaurants/mine`      | vendor            | Your restaurants                   |
| POST   | `/api/restaurants`           | vendor            | Add a restaurant                   |
| PATCH  | `/api/restaurants/:id`       | owner             | Change a restaurant                |
| DELETE | `/api/restaurants/:id`       | owner             | Delete a restaurant and its menu   |
| POST   | `/api/restaurants/:id/dishes`| owner             | Add a dish                         |
| PATCH  | `/api/dishes/:id`            | owner             | Change a dish                      |
| DELETE | `/api/dishes/:id`            | owner             | Delete a dish                      |
| GET    | `/api/cart`                  | customer          | Your cart with the total           |
| POST   | `/api/cart/items`            | customer          | Add a dish (or raise its quantity) |
| PATCH  | `/api/cart/items/:id`        | customer          | Change a quantity                  |
| DELETE | `/api/cart/items/:id`        | customer          | Remove a dish                      |
| DELETE | `/api/cart`                  | customer          | Empty the cart                     |
| POST   | `/api/orders`                | customer          | Order everything in the cart       |
| GET    | `/api/orders`                | customer          | Your orders, newest first          |

Send the token as `Authorization: Bearer <token>`. Errors look like `{ "message": "...", "errors": [{ "field": "...", "message": "..." }] }`.

## Project structure

```
backend/
  src/
    app.js            routes and middleware
    server.js         connects to MongoDB and starts the API
    config.js         reads and checks the settings
    controllers/      what each endpoint does
    middleware/       login checks, validation, error responses
    models/           MongoDB collections
    routes/
    seed/             demo data
  scripts/dev-memory.js   runs the API with a temporary database
  test/
frontend/
  src/
    app/              Redux store and every API call (RTK Query)
    components/       navbar, cards, form fields, ...
    pages/            one file per page, vendor pages in pages/vendor
    lib/              formatting and small helpers
  nginx.conf          serves the app and passes /api to the backend in Docker
docker-compose.yml    MongoDB + API + web app
```

## History

I first built Foodiez in 2021 as five separate repos: an Express API, and the same React app four times (plain CSS, Material-UI, Tailwind and AWS Amplify). In 2026 I merged the API and the Tailwind app into this repo and rebuilt them. The rebuild fixed security problems (anyone could sign up as an admin, and any vendor could edit any restaurant), replaced the crash-prone request handling, added a real order model, tests, Docker and CI, and moved the web app from Create React App to Vite. The original 2021 commits are still in the history.

## Ideas for later

- Online payments
- A page where vendors see incoming orders
- Photo uploads for restaurants and dishes
- Ratings and reviews
- Pages (pagination) for long restaurant lists
