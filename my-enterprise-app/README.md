# my-enterprise-app – Enterprise CMS

Generated with `npx create-enterprise-app`. Structure: config/, src/, database/, public/. Admin UI from `@enterprise/admin`.

## Setup

1. Edit `.env` at project root (DB_*, CORS_ORIGIN, NEXT_PUBLIC_API_URL).
2. `npm install`
3. `npm run develop` — One server (Strapi-style): API at http://localhost:9390/api, Admin at http://localhost:9390/admin.

## Features

- Admin from package (`@enterprise/admin`). Customize via `src/admin/`.
- REST + GraphQL, JWT, Content Type Builder, Content Manager, Plugins, Settings.

## Troubleshooting

- **Port 9390 already in use (EADDRINUSE)** — Stop the previous `npm run develop` (Ctrl+C) or set `PORT=9391` in `.env`.
- **ERR_CONNECTION_REFUSED** — The server did not start (often because port was in use). Fix the port conflict and restart `npm run develop`.
