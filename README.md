# Enterprise CMS

<p align="center"><img src="packages/admin/public/logo.svg" width="64" height="64" alt="Enterprise CMS" /></p>

Enterprise headless CMS: Strapi kabi bitta buyruq bilan yangi ilova yaratish (`npx create-enterprise-app my-app` yoki localda `npm run create my-app`). Monorepo: Next.js Admin, Express backend, REST + GraphQL, Content Type Builder, plugins, hooks.

## Hujjatlar

Batafsil qo'llanma va feature hujjatlari `docs-local/` papkasida (local foydalanish uchun, GitHub'ga yuklanmaydi).

| Fayl | Maqsad |
|------|--------|
| docs-local/STRAPI_V5_ENTERPRISE_ALIGNMENT.md | Strapi v5 ga moslashtirish rejasi |
| docs-local/LOCAL_TESTING_GUIDE.md | Localda test qilish qo'llanmasi |
| docs-local/NPM_PUBLISH_GUIDE.md | NPM publish qo'llanmasi |

## Ikki rejim

### 1. Local (development / test)

```bash
npm install
npm run build
npm run create my-app
cd my-app
npm install
# .env ni tahrirlang (root da: DB_*, NEXT_PUBLIC_API_URL=http://localhost:3001/api)
npm run develop
```

### 2. NPM (foydalanuvchilar uchun)

Strapi kabi bitta buyruq orqali yangi ilova yaratish:

```bash
npx create-enterprise-app my-app
# yoki: npm create enterprise-app my-app
cd my-app
npm install
# .env ni tahrirlang (DB_*, NEXT_PUBLIC_API_URL)
npm run develop
# yoki npm run dev
```

## Layout tanlash

- **Standard (default)** – to'liq ilova: config/, src/, database/, public/ + Admin (`@enterprise/admin` dan)
- **API only** – faqat API: config/, src/, database/

```bash
npm run create my-app
# Default: Standard (Full) – Admin + API
```

yoki:

```bash
node packages/cli/dist/index.js my-app --layout enterprise
# API only
```

## Build

Memory muammosi bo'lsa (design-system OOM):

```bash
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

(design-system build skripti allaqachon NODE_OPTIONS qo'llaydi.)

## Scripts

| Buyruq | Tavsif |
|--------|--------|
| `npm run build` | Barcha paketlarni build qilish |
| `npm run dev` | Admin + backend parallel |
| `npm run create <name>` | Loyiha generatsiya |

## Loyiha tuzilmasi va publish

- **packages/admin** – Admin UI (`@enterprise/admin`). **packages/cli** – create-enterprise-app CLI. Barcha publish qilinadigan modullar `packages/` da.
- **Local create:** `npm run create my-app` loyihani **monorepo ichida** yarating; CLI `@enterprise/*` ni `file:../../packages/...` qiladi, shunda `npm install` 404 bermaydi.
- **NPM publish:** `packages/cli` va `packages/admin` (va boshqa `@enterprise/*`) ni npm ga chiqarsangiz, `npx create-enterprise-app` tashqarida ham ishlaydi. Batafsil: `docs-local/NPM_PUBLISH_GUIDE.md`, local test: `docs-local/LOCAL_TESTING_GUIDE.md`.
