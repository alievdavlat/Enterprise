# Prompt: Admin “out” folder not found (Next.js 16 Turbopack)

Ushbu matnni Cloud AI (yoki boshqa AI) ga to‘liq context bilan tashlash uchun. Muammoni tushuntirish va qanday fix qilish kerakligini bildiradi.

---

## Vazifa

Enterprise monorepo loyihasida **admin panel** Next.js bilan `output: 'export'` (static export) qilinadi. Yaratilgan ilova (`create-enterprise-app` orqali) `node_modules/@enterprise/admin` dan admin’ni ishlatadi. Build tugagach, static fayllar (jumladan `index.html`) **qayerdadir** chiqadi; ularni ilova ildizidagi `build/` papkasiga nusxalash kerak, backend esa `/admin` da shu `build/` ni static qilib beradi.

**Hozirgi muammo:** Next.js 16 (Turbopack) build muvaffaqiyatli tugaydi (“Generating static pages”, “Compiled successfully”), lekin keyin script xabar beradi: **“Admin 'out' folder not found”**. Ya’ni static export bajarilgan, ammo script bu export papkasini topa olmayapti.

---

## Kontekst

1. **Loyiha tuzilmasi**
   - Monorepo: `packages/admin` (Next.js, `output: 'export'`), `packages/cli` (template’lar va scriptlar), backend, va hokazo.
   - CLI orqali `npm run create` → `my-enterprise-app` yaratiladi.
   - Ilova `node_modules/@enterprise/admin` ga bog‘lanadi; admin build shu paket ichida (yoki uning real path’ida) ishlatiladi.

2. **Ishlash tartibi**
   - `npm run develop` → `node scripts/ensure-admin-build.cjs && ...` (backend).
   - `ensure-admin-build.cjs`: agar `build/` yoki `build/index.html` yo‘q bo‘lsa, avval `build-admin.cjs`, keyin `copy-admin-build.cjs` ni chaqiradi.
   - **build-admin.cjs:** `cwd: adminDirReal` (node_modules/@enterprise/admin yoki uning real path) da `npm run build` (ya’ni `next build`) ishga tushiradi. Build tugagach, `index.html` bor papkani qidiradi (out, .next/build, .next/export, ../out, USERPROFILE/out, HOME/out va boshqa nomzodlar). Topilgan papka yo‘lini `appRoot/.enterprise-admin-out-dir` va `appRoot/.enterprise-admin-build-dir` ga yozadi.
   - **copy-admin-build.cjs:** Avval `.enterprise-admin-out-dir` dan o‘qiydi; bo‘lmasa `.enterprise-admin-build-dir` + out / .next/build / .next/export; bo‘lmasa appRoot va boshqa joylardagi nomzodlarni tekshiradi. Topilgan papkani `appRoot/build/` ga `fs.cpSync` bilan nusxalaydi.

3. **Next.js 16 xabari**
   - Build paytida: *“Next.js inferred your workspace root... We detected multiple lockfiles and selected the directory of C:\Users\ACER\package-lock.json as the root directory.”*
   - Demak, Turbopack workspace root’ni boshqa joy (masalan, foydalanuvchi uy papkasi yoki boshqa lockfile bor joy) deb tanlayapti. Natijada static export **ilova yoki admin paket papkasi emas, boshqa papkada** (masalan `C:\Users\ACER\out`) yaratilishi mumkin.

4. **Hozirgi scriptlar qayerda qidiradi**
   - build-admin.cjs: `adminDirReal/out`, `adminDirReal/.next/build`, `adminDirReal/.next/export`, `adminDirReal/../out`, appRoot orqali node_modules/admin/out, ../packages/admin/out, appRoot/../out, ..., USERPROFILE/out, HOME/out.
   - copy-admin-build.cjs: .enterprise-admin-out-dir; keyin .enterprise-admin-build-dir + out | .next/build | .next/export; keyin node_modules/@enterprise/admin/out, .next/build, .next/export, ../packages/admin/..., appRoot/../out, ..., USERPROFILE/out, HOME/out.

Bunday bo‘lsa ham ba’zi muhitlarda (masalan, bir nechta lockfile, yoki Turbopack’ning root tanlashi tufayli) export boshqa nom yoki boshqa joyda bo‘lishi mumkin.

---

## Nima qilish kerak

1. **Next.js admin config (`packages/admin/next.config.ts`)**  
   Turbopack’ning root’ni “noto‘g‘ri” joy tanlashiga qoldirmaslik. Static export har doim **admin paket papkasi** ichida (masalan `packages/admin/out` yoki node_modules’dagi admin’ning `out` papkasi) chiqishi kerak.  
   - `turbopack.root` ni aniq belgilang: masalan, build vaqtida `process.cwd()` admin paket papkasi bo‘lgani uchun `process.cwd()` yetarli bo‘lmasa, `path.resolve(__dirname)` (yoki admin paket ildizi) ishlatilsin, shunda “inferred workspace root” boshqa lockfile’ga tushmasin.

2. **build-admin.cjs va copy-admin-build.cjs**  
   Static export papkasini topish ro‘yxatini kengaytiring va xatolikda debug oson bo‘lsin:
   - **Ilova ildizi:** `appRoot/out` (ba’zi muhitlarda Next.js cwd ilova ildizida bo‘lib qolsa).
   - **Recursive qidiruv (ixtiyoriy):** agar barcha ma’lum nomzodlarda `index.html` topilmasa, `adminDirReal` ostida va `appRoot` ostida `index.html` bor birinchi papkani qidirib, shu papkani “out” deb belgilash (faqat xavfsiz scope: masalan bir darajali child papkalar yoki ma’lum nomlar: out, .next, build, export).

3. **prepare-default-template.js**  
   Ushbu script `packages/cli/templates/default/scripts/` dagi scriptlarni yozadi (inline string sifatida). build-admin.cjs va copy-admin-build.cjs da qilingan o‘zgarishlar shu yerdagi matnlarga ham aks ettirilsin – template va prepare bir xil mantiqda ishlashi kerak.

4. **Xato xabari**  
   “Admin 'out' folder not found” o‘rniga qisqacha qayerlarni qidirayotganini yozing (masalan: “Admin static export not found. Searched: .enterprise-admin-out-dir, admin/out, admin/.next/build, app/out, USERPROFILE/out, …”) va kerak bo‘lsa “Set turbopack.root in packages/admin/next.config to the admin package directory” kabi maslahat qo‘shing.

---

## Muhim fayllar

- `packages/admin/next.config.ts` – Next.js va Turbopack sozlamalari; `output: 'export'`, `turbopack.root`.
- `packages/cli/templates/default/scripts/build-admin.cjs` – admin build, out papkani topish, marker fayllar yozish.
- `packages/cli/templates/default/scripts/copy-admin-build.cjs` – marker/fallback orqali topilgan papkani `build/` ga nusxalash.
- `packages/cli/templates/default/scripts/ensure-admin-build.cjs` – build/copy kerak bo‘lsa chaqiradi.
- `packages/cli/scripts/prepare-default-template.js` – template scriptlarini yozadi; build-admin va copy-admin-build matnlari shu yerdagi string’lar bilan mos bo‘lishi kerak.

---

## Kutiladigan natija

- `npm run create` → `cd my-enterprise-app` → `npm install` → `npm run develop` ketma-ketligida:
  - Admin build bir marta ishlaydi,
  - Static export papkasi (out yoki .next/build/export yoki boshqa) topiladi,
  - U `build/` ga nusxalanadi,
  - “Admin 'out' folder not found” xatosi chiqmasligi,
  - Brauzerda `http://localhost:9390/admin` ochilganda admin panel ko‘rinishi kerak.

Agar export papka boshqa nomda yoki chuqurroq joyda bo‘lsa, script uni topishi yoki next.config orqali export har doim admin paketi ichidagi ma’lum papkada (masalan `out`) chiqishi ta’minlansin.
