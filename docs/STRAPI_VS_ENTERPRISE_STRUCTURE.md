# Strapi vs Enterprise: packages/core va hooks taqqoslash

## 1. Sizdagi `packages/core` va `packages/hooks` aloqasi

### packages/core (papka) ichidagi lifecycle
- **Joy:** `packages/core/src/lifecycle/LifecycleManager.ts`
- **Vazifa:** Server-side **lifecycle** (Strapi uslubida): `beforeCreate`, `afterCreate`, `beforeUpdate`, … — ya’ni model/document hayot tsikli hodisalari. Nom "lifecycle" qilingan — `packages/hooks` (React hooks) bilan adashmaslik uchun.
- **Ishlatiladi:** Backend (packages/backends/express) — `@enterprise/core` orqali (`LifecycleManager`, getter: `getLifecycleManager`).

### packages/hooks (alohida paket)
- **Joy:** `packages/hooks/` — npm paketi `@enterprise/hooks`
- **Vazifa:** **React hooks** (frontend): `useQuery`, `useMutation`, `useTheme`, `useFetchClient`, `usePermission`, `useContentType`, …
- **Ishlatiladi:** Admin UI (packages/admin, full-template admin) — faqat brauzer/React qatlamida.

### Xulosa: aloqa bormi?
- **Nom o‘xshash, lekin turli narsa:** core ichidagi **hooks** = server lifecycle (backend); **packages/hooks** = React hooks (frontend).
- **Code dependency:** `@enterprise/core` va `@enterprise/hooks` o‘rtasida to‘g‘ridan-to‘g‘ri bog‘liqlik yo‘q. Core’ni backend ishlatadi, hooks’ni admin ishlatadi.

---

## 2. Strapi repository tuzilmasi

Manba: [packages](https://github.com/strapi/strapi/tree/develop/packages), [packages/core](https://github.com/strapi/strapi/tree/develop/packages/core), [packages/core/core](https://github.com/strapi/strapi/tree/develop/packages/core/core).

### Yuqori daraja: `packages/`
| Papka            | Izoh                          |
|------------------|-------------------------------|
| admin-test-utils | Test yordamchi                 |
| cli              | Strapi CLI                    |
| **core**         | **Papka** — ichida ko‘p paket |
| generators       | Code generatorlar             |
| plugins          | Plugin’lar                    |
| providers        | Provider’lar                  |
| utils            | Umumiy util’lar               |

### Ikkinchi daraja: `packages/core/` (core guruhi papkasi)
Bu **bitta paket emas** — ichida **ko‘p paket** bor:

| Papka               | Paket nomi (taxminan)     | Vazifa                    |
|---------------------|---------------------------|----------------------------|
| admin               | @strapi/admin             | Admin panel (build/bundle) |
| content-manager     | @strapi/content-manager   | Content Manager plugin     |
| content-releases    | @strapi/content-releases  | Content releases           |
| content-type-builder| @strapi/content-type-builder | CTB plugin              |
| **core**            | **@strapi/core**          | CMS **yadrosi** (Koa, router, DB, auth, …) |
| data-transfer       | @strapi/data-transfer     | Import/export               |
| database            | @strapi/database          | DB layer                   |
| email               | @strapi/email             | Email                      |
| openapi             | @strapi/openapi           | OpenAPI                    |
| permissions         | @strapi/permissions       | Ruxsatlar                  |
| review-workflows    | @strapi/review-workflows  | Workflow                   |
| strapi              | @strapi/strapi            | CLI + main entry (export)  |
| types               | @strapi/types             | TypeScript turlar          |
| upload              | @strapi/upload            | Upload plugin              |
| utils               | @strapi/utils             | Core util’lar              |

Strapi’da **packages/core** ichida alohida **"hooks"** nomli paket yo‘q. React hooks bo‘lsa, odatda admin yoki boshqa paket ichida bo‘ladi.

---

## 3. Sizdagi (Enterprise) tuzilma

### Yuqori daraja: `packages/`
| Papka         | Paket nomi                | Vazifa                     |
|---------------|---------------------------|-----------------------------|
| admin         | @enterprise/admin         | Admin (Next.js)             |
| cli           | create-enterprise-app     | Loyiha yaratish             |
| **core**      | **@enterprise/core**      | CMS engine (schema, query, lifecycle hooks, plugins) |
| database      | @enterprise/database      | DB adapter                 |
| design-system | @enterprise/design-system | UI komponentlar            |
| **hooks**     | **@enterprise/hooks**     | React hooks (admin uchun)  |
| types         | @enterprise/types         | TypeScript turlar          |
| utils         | @enterprise/utils         | Util’lar                   |

- **packages/core** = **bitta paket** (`@enterprise/core`), Strapi’dagi kabi ichida yana “core” papkasi yo‘q.
- **packages/hooks** = **bitta paket** (`@enterprise/hooks`) — Strapi’da bu darajada alohida “hooks” paketi ko‘rinadi emas (ular admin ichida yoki boshqa joyda).

---

## 4. Asosiy farqlar (code / fayl tuzilmasi)

| Jihat            | Strapi | Enterprise (sizda) |
|------------------|--------|---------------------|
| **packages/core** | **Papka** — ichida 15+ paket (admin, core, database, strapi, types, …) | **Bitta paket** — `@enterprise/core` (schema, query, HookManager, plugins, middlewares) |
| **"Core" engine** | `packages/core/core` = `@strapi/core` (Koa, DB, auth, admin ref, …) | `packages/core` = `@enterprise/core` (schema, query, document, lifecycle hooks, plugins) |
| **Hooks (server)** | @strapi/core yoki boshqa core paket ichida (lifecycle) | `packages/core/src/hooks/HookManager.ts` — server lifecycle |
| **Hooks (React)** | Alohida top-level “hooks” paketi yo‘q; admin/boshqa paket ichida | `packages/hooks` = `@enterprise/hooks` — alohida paket (useQuery, useMutation, …) |
| **Daraja**       | 2 daraja: packages → packages/core → har bir paket | 1 daraja: packages → har bir paket (core, hooks, admin, …) |
| **Backend entry** | packages/core/strapi (CLI + export) | packages/backends/express (server) + packages/cli (create) |

Qisqacha: Strapi’da **core** = “core guruhi” papkasi (ichida @strapi/core va boshqalar); sizda **core** = to‘g‘ridan-to‘g‘ri bitta engine paketi. Sizda **hooks** = faqat React hooks paketi; core ichidagi **hooks** esa server lifecycle (HookManager) — ular bir-biriga bog‘lanmagan.
