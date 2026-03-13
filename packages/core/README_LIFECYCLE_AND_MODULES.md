# Core: lifecycle va Strapi-style modullar

## Lifecycle (oldingi "hooks" papkasi)

- **Papka:** `src/lifecycle/LifecycleManager.ts`
- **Sabab:** Server lifecycle (beforeCreate, afterCreate, …) ni `packages/hooks` (React hooks) dan ajratish — adashmaslik uchun nom **lifecycle**.
- **Export:** `LifecycleManager`, `ModelLifecycles`. Eski nom: `HookManager` — deprecated alias sifatida qoldi.
- **Backend:** `getLifecycleManager()` (va deprecated `getHookManager()`).

## Core ichidagi yangi modullar (Strapi-style)

Barchasi `packages/core/src/` ostida, alohida nested core/core yo‘q.

| Modul | Papka | Vazifa | Integratsiya |
|-------|--------|--------|---------------|
| **permissions** | `permissions/PermissionManager.ts` | Action/role qoidalari (can?) | Backend: `getPermissionManager()`, default qoidalar initialize da |
| **upload** | `upload/UploadConfig.ts` | Ruxsat berilgan MIME, max hajm | Backend: `createMediaRouter(db, uploadConfig?)` |
| **email** | `email/EmailService.ts` | Interface + NoopEmailService | Kelajakda backend’da real provider ulash mumkin |
| **openapi** | `openapi/buildOpenApiSpec.ts` | SchemaRegistry → OpenAPI 3 spec | Backend: `GET /api/openapi.json` |

- **Database:** Permission qoidalar hozir in-memory; kerak bo‘lsa keyinchalik `enterprise_permissions` jadvali qo‘shiladi.
- **Admin:** PermissionManager dan foydalanib UI’da ruxsatlarni ko‘rsatish/tekshirish mumkin.
- **CLI:** To‘g‘ridan-to‘g‘ri ulanishi yo‘q; generate qilingan app backend orqali bu modullarni ishlatadi.
