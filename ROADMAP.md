# 🗺️ نقشه راه توسعه و بازسازی معماری پروژه «تن‌خور» (Tankhor Roadmap)

این سند شامل مراحل گام‌به‌گام بازسازی، بهینه‌سازی و توسعه قابلیت‌های فنی نرم‌افزار تن‌خور است. با پیشرفت پروژه، موارد انجام‌شده در این نقشه راه علامت‌گذاری (`[x]`) خواهند شد.

---

## 📌 فاز ۱: متمرکزسازی کنترل نسخه و مدیریت اسکریپت‌های Release
- [x] **۱.۱ متمرکزسازی شماره نسخه (Single Source of Truth):**
  - متمرکز کردن نسخه اپلیکیشن در یک منبع واحد (`package.json` و `src/version.ts`).
  - ایجاد اسکریپت همگام‌سازی خودکار شماره نسخه (`scripts/sync-version.js` و `npm run sync-version`) با فایل‌های `public/version.json`، `src-tauri/tauri.conf.json` و `src-tauri/Cargo.toml`.
- [x] **۱.۲ بهینه‌سازی سرویس استعلام به‌روزرسانی (`updateService.ts`):**
  - اضافه کردن لایه کش (Cache) ۱۵ دقیقه‌ای با TTL در `localStorage` جهت جلوگیری از خطای Rate Limit در GitHub API.
  - پشتیبانی از پارامتر `forceRefresh` و لینک و مانفیست Fallback بر روی CDN عمومی و GitHub Raw.

---

## 💾 فاز ۲: ارتقای لایه ذخیره‌سازی محلی و دیتابیس (SQLite & Storage Adapters)
- [x] **۲.۱ سیستم Migration ساختاریافته در SQLite (`sqliteAdapter.ts`):**
  - ایجاد جدول `_migrations (version INTEGER, name TEXT, applied_at TEXT)` در دیتابیس بومی SQLite اپلیکیشن دسکتاپ.
  - انتقال تغییرات جدول‌ها به فایل‌های میگریشِن ترتیبی به جای کوئری‌های صامت غیرایمن.
- [x] **۲.۲ تولید شناسه‌های استاندارد بی‌پایان (UUID v4 for Offline Items):**
  - جایگزینی شماره‌های تصادفی عددی با **UUID v4** برای شناسه‌های موقت اقلام جدید ایجاد شده در حالت آفلاین.
  - تعریف فیلد `local_uuid` برای نگاشت دقیق یک‌به‌یک هنگام همگام‌سازی با Directus.
- [x] **۲.۳ مهاجرت لایه وب به IndexedDB (`localAdapter.ts`):**
  - ارتقای لایه وب با پشتیبانی از دیتابیس **IndexedDB** جهت ذخیره‌سازی داده‌های نامحدود آفلاین.
  - جلوگیری از سرریز حافظه و پشتیبانی از Fallback متقابل به `localStorage`.
- [x] **۲.۴ ارتقای الگوریتم همگام‌سازی و حل تداخلات (`syncManager.ts`):**
  - افزودن زمان آخرین تغییرات (`updated_at`) به تمام مدل‌های داده.
  - پیاده‌سازی مکانیزم تعارض‌زدایی مبتنی بر Timestamp و شناسه `local_uuid` در همگام‌سازی دوطرفه local ↔ cloud.

---

## ⚡ فاز ۳: ماژولارکردن سرویس Directus و لایه شبکه
- [x] **۳.۱ تفکیک کلاس غول‌پیکر `directus.ts`:**
  - شکستن فایل ۱۸۰۰ سطری `directus.ts` به زیرسرویس‌های مجزا و تمیز:
    - `src/services/directus/client.ts` (کلاینت شبکه و مدیریت قطعی ارتباط)
    - `src/services/directus/auth.service.ts` (احراز هویت و مدیریت اشتراک)
    - `src/services/directus/product.service.ts` (کالاها، دسته‌بندی‌ها، راهنمای سایز و رسانه)
    - `src/services/directus/inventory.service.ts` (موجودی انبار و الگوریتم Diff Sync)
    - `src/services/directus/order.service.ts` (مدیریت سفارشات)
- [x] **۳.۲ مدیریت پیشرفته توکن و کشینگ:**
  - بهینه‌سازی تزریق توکن، retry خودکار و هندل کردن خطاهای قطع اتصال اینترنت در لایه شبکه (`directusFetch`).

---

## 🧩 فاز ۴: بازسازی کامپوننت غول‌پیکر Dashboard و بهینه‌سازی UI/UX
- [x] **۴.۱ شکستن کامپوننت Monolith `Dashboard.tsx` (۴۷۰۰+ سطر):**
  - تفکیک فایل به کامپوننت‌های مستقل و کوچک‌تر:
    - `src/components/dashboard/DashboardHeader.tsx` (هدر، وضعیت آنلاین/آفلاین، نبار)
    - `src/components/dashboard/ProductMatrixEditor.tsx` (ویرایشگر ماتریس ۲ بعدی و SKU)
    - `src/components/dashboard/WarehouseTable.tsx` (جدول اقلام انبار و ویرایش سریع)
    - `src/components/dashboard/OrdersManager.tsx` (مدیریت سفارشات و فاکتورها)
    - `src/components/dashboard/SettingsModal.tsx` (مدیریت تنظیمات و همگام‌سازی)
- [x] **۴.۲ بهینه‌سازی State Management و جلوگیری از Re-renderهای اضافی:**
  - یکپارچه‌سازی Stateهای پراکنده (مانند `warehouseInventory`, `matrixGridState`, `localEdits`) در Zustand Store (`useDashboardStore`).
  - ارتقای ساختار `Dashboard.tsx` با استخراج زیرکامپوننت‌های ماژولار.

---

## 🖨️ فاز ۵: ارتقای سیستم چاپ لیبل و پرینت حرارتی دسکتاپ
- [ ] **۵.۱ بهبود تجربه چاپ حرارتی در محیط Tauri:**
  - جداسازی منطق چاپ از `BarcodeGenerator.tsx` به زیرکامپوننت‌های تمیز.
  - افزودن قابلیت پرینت مستقیم (Silent Thermal Print) بدون باز شدن دیالوگ استاندارد مرورگر در محیط دسکتاپ.

---
*این نقشه راه با شروع هر فاز به‌روزرسانی شده و موارد تکمیل‌شده تیک خواهند خورد.*
