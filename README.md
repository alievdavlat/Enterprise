# Enterprise

<p align="center"><img src="packages/admin/public/logo.svg" width="64" height="64" alt="Enterprise" /></p>

An open-source headless CMS that works the way Strapi does: scaffold a project with a single command, model your content in an admin panel, and read it back over REST or GraphQL.

I built this to understand how a CMS like Strapi actually works under the hood, so most of it is written from scratch instead of wired together from existing libraries.

## Features

- Scaffold a new project with one command (`npx create-enterprise-app my-app`)
- Content-Type Builder for modelling content from the admin UI
- REST and GraphQL APIs out of the box
- Plugin and lifecycle-hook system for extending the backend
- Two layouts: a full app (admin + API) or API-only

## Tech stack

- TypeScript across the whole codebase
- Turborepo monorepo
- Next.js admin panel
- Express backend serving REST and GraphQL
- A CLI generator (`create-enterprise-app`)

## Getting started

```bash
npm install
npm run build
npm run create my-app
cd my-app
npm install
# edit .env (DB_*, NEXT_PUBLIC_API_URL=http://localhost:3001/api)
npm run develop
```

Once the packages are published, you can scaffold from anywhere:

```bash
npx create-enterprise-app my-app
cd my-app
npm install
npm run develop
```

## Project structure

- `packages/admin` is the admin UI
- `packages/cli` is the `create-enterprise-app` generator
- everything under `packages/` is what gets published to npm

## Status

Still in active development. I'm currently aligning the content model and API closer to Strapi v5.
