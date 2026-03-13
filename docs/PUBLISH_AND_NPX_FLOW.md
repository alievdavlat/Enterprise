# Publish qilingandan keyin: `npx create-enterprise-app` qanday ishlaydi

## Qisqacha

Loyihani **npm’ga publish** qilgach, foydalanuvchi **`npx create-enterprise-app my-app`** orqali loyiha yaratadi. Generate qilingan app **npm’dagi** `@enterprise/*` paketlariga bog‘lanadi (monorepo ichida bo‘lgandagi `file:` link emas). Buning uchun barcha kerakli paketlar **bir xil versiya** bilan publish qilinishi kerak.

---

## 1. Publish qilinganda kim nima ishlatadi?

| Qachon | Kim ishlatadi | `@enterprise/*` manbai |
|--------|----------------|-------------------------|
| **Monorepo ichida** `node packages/cli/dist/index.js create my-app` | Developer (siz) | `file:../../backends/express` va boshqalar — **patch** qilinadi, lokal kod ishlaydi |
| **Publish qilingach** `npx create-enterprise-app my-app` | End user (npm orqali) | **npm registry** — `^1.0.0` kabi versiya, paketlar npm’dan o‘rnatiladi |

---

## 2. `npx create-enterprise-app my-app` qanday ishlaydi (publish qilingach)

1. **npx** `create-enterprise-app` paketini npm’dan yuklaydi (yoki cache’dan ishlatadi).
2. **CLI** (`dist/index.js`) ishga tushadi:
   - Template (`templates/default`) **paket ichida** — `prepublishOnly` da `prepare:templates` ishlagan, shuning uchun `templates/` publish qilingan.
   - `createPackageJSON(...)` generate qilingan app uchun `package.json` yozadi va dependency’larni **CLI versiyasiga** bog‘laydi:
     - `"@enterprise/backend-express": "^1.0.0"`
     - `"@enterprise/admin": "^1.0.0"`
     - va boshqa `@enterprise/*` (types, design-system, hooks, utils).
   - `ENTERPRISE_VERSION` = `packages/cli/package.json` dagi `version` (masalan `1.0.0`).
3. **Patch** (`patchEnterpriseDepsInApp`) **qo‘llanmaydi**:
   - `getRepoRoot()` = `path.resolve(__dirname, "..", "..", "..")` — npx ishlaganda bu **CLI o‘rnatilgan joy** (masalan npx cache), foydalanuvchi papkasi emas.
   - Generate qilingan app path’i (masalan `~/projects/my-app`) ushbu “repo root” ichida bo‘lmaydi.
   - Shuning uchun `targetPath.startsWith(repoRoot)` false, patch o‘tkazilmaydi, dependency’lar **npm versiyada** qoladi (`^1.0.0`).
4. **npm install** (yoki CLI o‘zi ishlatadigan `packageManager install`) generate qilingan app ichida ishga tushadi → barcha `@enterprise/*` **npm’dan** o‘rnatiladi.
5. Foydalanuvchi **`npm run develop`** qiladi → `src/server.ts` ishga tushadi → `require('@enterprise/backend-express')` **node_modules**dagi (npm’dan o‘rnatilgan) paketni ishlatadi.

Demak: **Publish qilingach generate qilingan app o‘zining backendi yo‘q; u npm’dagi `@enterprise/backend-express` (va boshqa paketlar)ni ishlatadi.**

---

## 3. Nimalarni publish qilish kerak

Quyidagi paketlar **npm’da** bo‘lishi kerak (masalan `@your-scope/` yoki scope’siz, loyiha qoidalariga qarab):

| Paket | package.json name | Izoh |
|-------|--------------------|------|
| CLI | `create-enterprise-app` | `packages/cli` — `npx create-enterprise-app` shu paketni ishlatadi |
| Backend | `@enterprise/backend-express` | `backends/express` — API + admin static |
| Admin | `@enterprise/admin` | `packages/admin` — Next.js admin |
| Types | `@enterprise/types` | `packages/types` |
| Design-system | `@enterprise/design-system` | `packages/design-system` |
| Hooks | `@enterprise/hooks` | `packages/hooks` |
| Utils | `@enterprise/utils` | `packages/utils` |
| Core | `@enterprise/core` | `packages/core` (agar backend/admin dependency’da bo‘lsa) |
| Database | `@enterprise/database` | `packages/database` (agar backend dependency’da bo‘lsa) |

CLI `createPackageJSON` da yozadigan dependency’lar:  
`backend-express`, `admin`, `design-system`, `hooks`, `utils`, `types`.  
Ularning o‘ziga xos dependency’lari (core, database va hokazo) ham publish qilinishi kerak.

---

## 4. Versiya moslashuvi

- CLI `version` (masalan `1.0.0`) generate qilingan app’ning barcha `@enterprise/*` dependency’lariga yoziladi: `^1.0.0`.
- **Publish** qilishda barcha `@enterprise/*` paketlarni **xuddi shu versiya** (yoki semver’ga mos, masalan 1.0.x) bilan chiqarish ma’qul.
- Keyingi relizda CLI’ni `1.1.0` qilsangiz, yangi create qilingan app’lar `^1.1.0` oladi; eski app’lar `^1.0.0` da qoladi.

---

## 5. Xulosa

- **Publish qilingach** `npx create-enterprise-app` **npm’dagi** `create-enterprise-app` va `@enterprise/*` paketlarni ishlatadi.
- Generate qilingan app **o‘zining backend kodi yo‘q** — u har doim `@enterprise/backend-express` (va boshqa paketlar)ni **import** qiladi; monorepo ichida bo‘lsa `file:` link, tashqarida (npx) bo‘lsa **npm’dan** o‘rnatilgan versiya.
- Loyihani to‘liq ishlashi uchun **barcha kerakli `@enterprise/*` paketlar** va **create-enterprise-app** ni publish qilish va versiyalarni moslashtirish kifoya.
