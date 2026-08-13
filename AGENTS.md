# AGENTS.md - دستورالعمل‌ها و قواعد معماری پروژه «تن‌خور» (Tankhor)

## 📌 درباره پروژه
«تن‌خور» یک پلتفرم هوشمند مدیریت پوشاک، راهنمای سایز اختصاصی و انبارداری است که برای کارکرد در دو حالت **آفلاین محلی (رایگان با SQLite / LocalStorage)** و **همگام‌سازی ابری (اشتراکی)** طراحی شده است.

---

## 🏗️ قوانین معماری و لایه ذخیره‌سازی (Storage Adapter Architecture)

1. **اصل تفکیک لایه ذخیره‌سازی:**
   - تمامی عملیات خواندن و نوشتن داده‌ها در برنامه (محصولات، موجودی، قالب‌های سایز، دسته‌بندی‌ها، رنگ‌ها، سفارشات و...) **باید حتماً** از طریق `storageManager` در فایل `/src/storage/index.ts` انجام شود.
   - از فراخوانی مستقیم APIهای دایرکتوس، LocalStorage یا SQLite در کامپوننت‌های UI خودداری کنید.

2. **لایه ذخیره‌سازی محلی و دیتابیس بومی SQLite (Tauri Desktop):**
   - در اپلیکیشن‌های دسکتاپ (ویندوز و مک)، داده‌ها به‌صورت بومی در دیتابیس SQLite (`sqlite:tankhor_desktop.db`) ذخیره می‌شوند (`SQLiteStorageAdapter` در `/src/storage/sqliteAdapter.ts`).
   - تغییرات ساختار دیتابیس SQLite به‌صورت ترتیبی و ساختاریافته از طریق جدول `_migrations` لود و اعمال می‌گردند.
   - افزونه `tauri-plugin-sql` (شاخه `v1` گیت) برای تعامل نیتیو با دیتابیس SQLite استفاده می‌شود و در صورت عدم دسترس‌پذیری به IndexedDB/LocalStorage سوئیچ می‌کند (Fallback).

3. **ارتقای لایه ذخیره‌سازی وب به IndexedDB و شناسه بی‌پایان UUID v4:**
   - لایه آفلاین وب از ترکیب همزمان LocalStorage و **IndexedDB** (`/src/storage/indexedDBHelper.ts`) جهت حفظ کارایی و عبور از محدودیت حافظه ۵ مگابایتی استفاده می‌کند.
   - تمامی اقلام ایجاد شده در حالت آفلاین دارای شناسه بی‌پایان **UUID v4** (`local_uuid`) و برچسب زمانی (`updated_at`) هستند تا همگام‌سازی دوطرفه و حل تداخلات (Timestamp Conflict Resolution) با دایرکتوس بدون همپوشانی آی‌دی‌ها انجام پذیرد.

3. **مدیریت حالت آفلاین و آنلاین (Hybrid Sync):**
   - برنامه به‌صورت پیش‌فرض در حالت `local_offline` کار می‌کند تا کاربران بدون نیاز به اینترنت یا سرور از نرم‌افزار استفاده کنند.
   - تغییرات ایجاد شده در حالت آفلاین در `SyncQueueItem` ثبت می‌شوند.
   - در صورت سوئیچ به حالت `cloud_synced` یا فشردن دکمه همگام‌سازی، صف تغییرات توسط `StorageSyncManager.syncLocalToCloud()` به سرور ابری ارسال می‌شود.

4. **حفظ استقلال کامپوننت Tauri / Desktop:**
   - کدهای فرانت‌اند باید کاملاً مستقل از محیط اجرا (وب مرورگر یا اپلیکیشن نیتیو Tauri) باقی بمانند.
   - برای تعاملات دسکتاپ فقط از استاندارد Storage Adapters یا پل‌های ارتباطی مشخص استفاده شود.

5. **منطق دریافت و سنجش بروزرسانی‌های دسکتاپ (Auto-Updater Architecture):**
   - تمامی سرویس‌های سنجش و دریافت نسخه جدید برنامه از طریق `updateService` در `/src/updateService.ts` مدیریت می‌شوند.
   - منبع واحد نسخه اپلیکیشن (Single Source of Truth) در `package.json` و `/src/version.ts` قرار دارد. اجرای اسکریپت `npm run sync-version` فایل‌های `public/version.json`، `src-tauri/tauri.conf.json` و `src-tauri/Cargo.toml` را به‌صورت خودکار همگام می‌سازد.
   - برای جلوگیری از خطای Rate Limit در GitHub API، نتایج استعلام بروزرسانی دارای لایه کش ۱۵ دقیقه‌ای در `localStorage` هستند.
   - نمایش وضعیت نسخه، لیست تغییرات (Changelog) و دکمه دریافت بروزرسانی از طریق کامپوننت `<AppUpdateWidget />` در هدر، بخش تنظیمات و مودال راهنمای مک قابل دسترس است.

---

## 🎨 قوانین UI/UX و زبان

1. **پشتیبانی کامل از دو زبانه و RTL:**
   - تمام متون جدید باید دارای ترجمه فارسی و انگلیسی در `/src/locales.ts` باشند.
   - چیدمان‌های RTL (راست به چپ) باید با فونت‌های استاندارد فارسی مانند Vazirmatn و استایل‌های Tailwind متناسب باشند.

2. **نشانگرها و بازخورد کاربر:**
   - وضعیت دیتابیس (آفلاین محلی vs همگام ابری) و تعداد تغییرات معوق همیشه باید در هدر و تنظیمات قابل مشاهده باشند.
   - وضعیت نسخه نرم‌افزار و آماده بودن به‌روزرسانی جدید باید با بج مشخص در هدر و بخش تنظیمات نمایش داده شود.
   - برای تمام عملیات سنگین یا همگام‌سازی از Loading Spinner و پیغام‌های موفقیت/خطای مناسب استفاده شود.

---

## 📂 ساختار فایل‌های کلیدی

- `/src/storage/types.ts`: اینترفیس‌ها و تایپ‌های لایه ذخیره‌سازی
- `/src/storage/localAdapter.ts`: پیاده‌سازی دیتابیس محلی با LocalStorage و IndexedDB
- `/src/storage/indexedDBHelper.ts`: ماژول هلپر دیتابیس IndexedDB برای نگهداری داده‌های محلی وب بدون محدودیت ۵ مگابایت
- `/src/storage/sqliteAdapter.ts`: پیاده‌سازی دیتابیس بومی SQLite در محیط دسکتاپ (Tauri) با جدول میگریشن `_migrations`
- `/src/storage/cloudAdapter.ts`: پیاده‌سازی اتصال به API ابری Directus
- `/src/storage/syncManager.ts`: مدیر ارکستراسیون همگام‌سازی، تعارض‌زدایی بر اساس Timestamp و سوئیچ حالت‌ها
- `/src/utils/uuid.ts`: ماژول تولید استاندارد شناسه UUID v4 برای اقلام آفلاین
- `/src/updateService.ts`: سرویس مدیریت سنجش و دریافت بروزرسانی نسخه جدید اپلیکیشن (از طریق GitHub API)
- `/src/components/AppUpdateWidget.tsx`: کامپوننت ویجت نمایش وضعیت بروزرسانی و دریافت نسخه جدید
- `/src/store/useDashboardStore.ts`: مدیریت مرکزی Stateهای داشبورد و ماتریس انبار با Zustand
- `/src/components/dashboard/`: کامپوننت‌های تفکیک‌شده داشبورد (`DashboardHeader`, `ProductMatrixEditor`, `WarehouseTable`, `OrdersManager`, `SettingsModal`)
- `/src/components/Dashboard.tsx`: کامپوننت اصلی داشبورد مدیریت
- `/src/components/LandingPage.tsx`: صفحه اصلی و راهنمای دانلود دسکتاپ (ویندوز و مک)
- `/src/services/directus/`: زیرسرویس‌های ماژولار دایرکتوس (`client.ts`, `auth.service.ts`, `product.service.ts`, `inventory.service.ts`, `order.service.ts`)
- `/src/directus.ts`: نقطه‌ی اتصال و Forwarder اصلی سرویس‌های ماژولار دایرکتوس (DirectusAPI)
- `/src/types.ts`: تعریف مدل‌های داده (Product, InventoryItem, SizeGuideTemplate, UpdateState و...)
- `/public/version.json`: مانفیست منبع نسخه و لیست تغییرات آنلاین (Version Release Manifest)
- `/src-tauri/Cargo.toml` & `/src-tauri/tauri.conf.json`: پیکربندی نیتیو دسکتاپ Tauri و افزونه SQLite
