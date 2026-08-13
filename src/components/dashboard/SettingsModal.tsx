import React from 'react';
import { Crown, Database, CheckCircle2, Cloud, RefreshCw } from 'lucide-react';
import { DirectusAPI } from '../../directus';
import { storageManager, SyncStats } from '../../storage';
import { isDesktopEnv } from '../../utils/desktop';
import { AppUpdateWidget } from '../AppUpdateWidget';

interface SettingsModalProps {
  t: Record<string, string>;
  isRtl: boolean;
  darkMode: boolean;
  settingsShopName: string;
  setSettingsShopName: (name: string) => void;
  settingsShopSlug: string;
  setSettingsShopSlug: (slug: string) => void;
  handleSettingsSubmit: (e: React.FormEvent) => void;
  savingSettings: boolean;
  syncStats: SyncStats;
  syncingCloud: boolean;
  handleManualSync: () => void;
  setError: (err: string) => void;
  setSuccess: (msg: string) => void;
  setSyncStats: (stats: SyncStats) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = React.memo(({
  t,
  isRtl,
  darkMode,
  settingsShopName,
  setSettingsShopName,
  settingsShopSlug,
  setSettingsShopSlug,
  handleSettingsSubmit,
  savingSettings,
  syncStats,
  syncingCloud,
  handleManualSync,
  setError,
  setSuccess,
  setSyncStats,
}) => {
  return (
    <div
      className={`p-6 rounded-2xl border max-w-2xl mx-auto space-y-6 ${
        darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}
    >
      <div>
        <h3 className="text-lg font-black">{t.store_settings}</h3>
        <p className="text-xs text-neutral-400">
          {isRtl
            ? "تنظیمات آدرس‌دهی و هویت تجاری فروشگاه پوشاک شما."
            : "Change slug routing URLs and branding details."}
        </p>
      </div>

      <form onSubmit={handleSettingsSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.shop_name}</label>
          <input
            type="text"
            required
            value={settingsShopName}
            onChange={(e) => setSettingsShopName(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              darkMode
                ? 'bg-neutral-950 border-neutral-800 text-white'
                : 'bg-neutral-50 border-neutral-200 text-neutral-900'
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.shop_slug}</label>
          <input
            type="text"
            required
            value={settingsShopSlug}
            onChange={(e) => setSettingsShopSlug(e.target.value)}
            className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 text-left dir-ltr ${
              darkMode
                ? 'bg-neutral-950 border-neutral-800 text-white'
                : 'bg-neutral-50 border-neutral-200 text-neutral-900'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="w-full py-2.5 mt-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-extrabold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {savingSettings ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>{t.save}</span>
          )}
        </button>
      </form>

      {/* Subscription Management & Plan Status Card */}
      <div className={`pt-6 border-t space-y-4 ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className={`text-sm font-extrabold ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>
                {isRtl ? "مدیریت اشتراک و لایسنس تن‌خور" : "Subscription & Licensing"}
              </h4>
              <p className={`text-[11px] ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {isRtl
                  ? "نسخه دسکتاپ به صورت ۱۰۰٪ رایگان کار می‌کند • همگام‌سازی ابری و نسخه وب نیازمند اشتراک ویژه است"
                  : "Desktop is 100% free offline • Cloud sync and Web App require PRO subscription"}
              </p>
            </div>
          </div>

          {(() => {
            const sub = DirectusAPI.getSubscriptionInfo();
            return (
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-black border flex items-center gap-1 ${
                    sub.isPro
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>
                    {sub.isPro
                      ? isRtl
                        ? "اشتراک ویژه PRO"
                        : "PRO Plan"
                      : isRtl
                      ? "طرح دسکتاپ رایگان"
                      : "Free Desktop Tier"}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (sub.isPro) {
                      DirectusAPI.cancelProSubscription();
                      setSuccess(isRtl ? "اشتراک به طرح رایگان تغییر یافت." : "Switched to free plan.");
                    } else {
                      DirectusAPI.activateProSubscription(365);
                      setSuccess(
                        isRtl
                          ? "اشتراک ویژه ۱ ساله PRO با موفقیت فعال شد!"
                          : "PRO subscription activated successfully!"
                      );
                    }
                    setSyncStats(storageManager.getSyncStats());
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    sub.isPro
                      ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 border-amber-400 font-black shadow-md hover:opacity-90'
                  }`}
                >
                  {sub.isPro
                    ? isRtl
                      ? "غیرفعال‌سازی PRO"
                      : "Cancel PRO"
                    : isRtl
                    ? "فعال‌سازی تست PRO"
                    : "Activate PRO Trial"}
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Storage Adapter & Offline/Cloud Configuration Card */}
      <div className={`pt-6 border-t space-y-4 ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <h4 className={`text-sm font-extrabold ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>
                {isRtl
                  ? "تنظیمات لایه ذخیره‌سازی و دیتابیس (Storage Adapter)"
                  : "Local Storage Adapter & Cloud Sync"}
              </h4>
              <p className={`text-[11px] ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {isRtl
                  ? "انتخاب بین کارکرد ۱۰۰٪ آفلاین رایگان و همگام‌سازی ابری دوطرفه"
                  : "Choose between 100% free offline mode and safe two-way cloud sync."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              const isDesktop = isDesktopEnv();
              if (!isDesktop) {
                setError(
                  isRtl
                    ? "در مرورگر وب فقط حالت ابری آنلاین فعال است و امکان سوئیچ به آفلاین وجود ندارد."
                    : "Web browser mode is strictly cloud synced."
                );
                setTimeout(() => setError(''), 4000);
                return;
              }
              try {
                storageManager.setMode('local_offline');
                setSuccess(isRtl ? "حالت دیتابیس آفلاین محلی فعال شد." : "Offline local database mode activated.");
                setTimeout(() => setSuccess(''), 3000);
              } catch (err: any) {
                setError(err.message);
                setTimeout(() => setError(''), 4000);
              }
            }}
            className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
              syncStats.mode === 'local_offline'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10'
                : darkMode
                ? 'bg-neutral-950/40 border-white/10 hover:border-white/20 text-neutral-400'
                : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Database className="w-4 h-4" />
              {syncStats.mode === 'local_offline' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <div>
              <p className="text-xs font-black">{isRtl ? "حالت آفلاین محلی (رایگان)" : "Local Offline (Free)"}</p>
              <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {isRtl
                  ? "ذخیره‌سازی سریع در حافظه دستگاه بدون نیاز به اینترنت"
                  : "Fast device-local storage without network dependence"}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              try {
                storageManager.setMode('cloud_synced');
                setSuccess(
                  isRtl
                    ? "حالت همگام‌سازی ابری دوطرفه فعال شد."
                    : "Two-way cloud synced mode activated."
                );
                setTimeout(() => setSuccess(''), 3000);
              } catch (err: any) {
                setError(
                  err.message ||
                    (isRtl
                      ? "روشن کردن همگام‌سازی ابری نیازمند اشتراک ویژه (PRO) است."
                      : "Cloud sync requires an active PRO subscription.")
                );
                setTimeout(() => setError(''), 5000);
              }
            }}
            className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
              syncStats.mode === 'cloud_synced'
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 shadow-md shadow-sky-500/10'
                : darkMode
                ? 'bg-neutral-950/40 border-white/10 hover:border-white/20 text-neutral-400'
                : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Cloud className="w-4 h-4" />
              {syncStats.mode === 'cloud_synced' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
            </div>
            <div>
              <p className="text-xs font-black">{isRtl ? "همگام‌سازی ابری (نیازمند PRO)" : "Cloud Synced (PRO)"}</p>
              <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {isRtl
                  ? "پشتیبان‌گیری خودکار و همگام‌سازی دوطرفه بین دسکتاپ و وب"
                  : "Automatic backup & safe two-way desktop-web sync"}
              </p>
            </div>
          </button>
        </div>

        {syncStats.pendingCount > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
            <span className="text-amber-400 font-extrabold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>
                {isRtl
                  ? `${syncStats.pendingCount} تغییر محلی آماده ارسال به کلود`
                  : `${syncStats.pendingCount} pending local changes queued for cloud sync`}
              </span>
            </span>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncingCloud}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
              <span>{isRtl ? "ارسال تغییرات به کلود" : "Sync Now"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Software Update Card */}
      <div className={`pt-6 border-t ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
        <AppUpdateWidget />
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';
