import React, { useState, useRef } from 'react';
import { Crown, Database, CheckCircle2, Cloud, RefreshCw, Activity, Download, Upload, Eye, HardDrive, AlertTriangle, X, Wifi, WifiOff } from 'lucide-react';
import { DirectusAPI } from '../../directus';
import { storageManager, SyncStats, LocalBackupPayload } from '../../storage';
import { isDesktopEnv } from '../../utils/desktop';
import { AppUpdateWidget } from '../AppUpdateWidget';
import { SyncQueueVisualizerModal } from './SyncQueueVisualizerModal';

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
  // --- UI STATES FOR NEW FEATURES ---
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  // Cloud Test Connection state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; latencyMs: number; url: string; message: string } | null>(null);

  // Backup & Restore state
  const [exportingBackup, setExportingBackup] = useState(false);
  const [pendingBackupPayload, setPendingBackupPayload] = useState<LocalBackupPayload | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [restoringData, setRestoringData] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- HANDLER: CLOUD PING TEST ---
  const handleTestCloudConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const result = await DirectusAPI.testConnection();
      setConnectionResult(result);
    } catch (err: any) {
      setConnectionResult({
        ok: false,
        latencyMs: 0,
        url: '',
        message: err?.message || (isRtl ? 'خطا در آزمون اتصال به سرور' : 'Connection test failed')
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // --- HANDLER: EXPORT BACKUP ---
  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const backupData = await storageManager.exportLocalBackup();
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `tankhor_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(isRtl ? 'نسخه پشتیبان محلی با موفقیت دانلود شد.' : 'Local database backup exported successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err?.message || (isRtl ? 'خطا در خروجی گرفتن از دیتابیس محلی' : 'Backup export failed'));
      setTimeout(() => setError(''), 4000);
    } finally {
      setExportingBackup(false);
    }
  };

  // --- HANDLER: SELECT BACKUP FILE FOR RESTORE ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !parsed.data) {
          throw new Error(isRtl ? 'فایل پشتیبان انتخاب شده معتبر نیست.' : 'Invalid backup JSON file format.');
        }
        setPendingBackupPayload(parsed as LocalBackupPayload);
        setRestoreModalOpen(true);
      } catch (err: any) {
        setError(err?.message || (isRtl ? 'خطا در خواندن فایل پشتیبان' : 'Could not parse backup file'));
        setTimeout(() => setError(''), 4000);
      }
    };
    reader.readAsText(file);

    if (e.target) {
      e.target.value = '';
    }
  };

  // --- HANDLER: CONFIRM RESTORE ---
  const handleConfirmRestore = async () => {
    if (!pendingBackupPayload) return;
    setRestoringData(true);
    try {
      const result = await storageManager.importLocalBackup(pendingBackupPayload, restoreMode);
      setSyncStats(storageManager.getSyncStats());
      setSuccess(
        isRtl
          ? `بازگردانی با موفقیت انجام شد: ${result.counts.products} کالا، ${result.counts.orders} سفارش.`
          : 'Local database backup restored successfully!'
      );
      setRestoreModalOpen(false);
      setPendingBackupPayload(null);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err?.message || (isRtl ? 'خطا در بازگردانی داده‌ها' : 'Restore failed'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setRestoringData(false);
    }
  };

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
            ? 'تنظیمات آدرس‌دهی، هویت تجاری، لایه ذخیره‌سازی محلی و همگام‌سازی ابری.'
            : 'Change slug routing URLs, branding, storage adapter, and cloud sync.'}
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
                {isRtl ? 'مدیریت اشتراک و لایسنس تن‌خور' : 'Subscription & Licensing'}
              </h4>
              <p className={`text-[11px] ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {isRtl
                  ? 'نسخه دسکتاپ به صورت ۱۰۰٪ رایگان کار می‌کند • همگام‌سازی ابری و نسخه وب نیازمند اشتراک ویژه است'
                  : 'Desktop is 100% free offline • Cloud sync and Web App require PRO subscription'}
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
                        ? 'اشتراک ویژه PRO'
                        : 'PRO Plan'
                      : isRtl
                      ? 'طرح دسکتاپ رایگان'
                      : 'Free Desktop Tier'}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (sub.isPro) {
                      DirectusAPI.cancelProSubscription();
                      setSuccess(isRtl ? 'اشتراک به طرح رایگان تغییر یافت.' : 'Switched to free plan.');
                    } else {
                      DirectusAPI.activateProSubscription(365);
                      setSuccess(
                        isRtl
                          ? 'اشتراک ویژه ۱ ساله PRO با موفقیت فعال شد!'
                          : 'PRO subscription activated successfully!'
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
                      ? 'غیرفعال‌سازی PRO'
                      : 'Cancel PRO'
                    : isRtl
                    ? 'فعال‌سازی تست PRO'
                    : 'Activate PRO Trial'}
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Storage Adapter & Hybrid Sync Card */}
      <div className={`pt-6 border-t space-y-4 ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <h4 className={`text-sm font-extrabold ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>
                {isRtl
                  ? 'تنظیمات لایه ذخیره‌سازی و دیتابیس (Storage Adapter)'
                  : 'Local Storage Adapter & Cloud Sync'}
              </h4>
              <p className={`text-[11px] ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {isRtl
                  ? 'انتخاب بین کارکرد ۱۰۰٪ آفلاین رایگان و همگام‌سازی ابری دوطرفه'
                  : 'Choose between 100% free offline mode and safe two-way cloud sync.'}
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
                    ? 'در مرورگر وب فقط حالت ابری آنلاین فعال است و امکان سوئیچ به آفلاین وجود ندارد.'
                    : 'Web browser mode is strictly cloud synced.'
                );
                setTimeout(() => setError(''), 4000);
                return;
              }
              try {
                storageManager.setMode('local_offline');
                setSuccess(isRtl ? 'حالت دیتابیس آفلاین محلی فعال شد.' : 'Offline local database mode activated.');
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
              <p className="text-xs font-black">{isRtl ? 'حالت آفلاین محلی (رایگان)' : 'Local Offline (Free)'}</p>
              <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {isRtl
                  ? 'ذخیره‌سازی سریع در حافظه دستگاه بدون نیاز به اینترنت'
                  : 'Fast device-local storage without network dependence'}
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
                    ? 'حالت همگام‌سازی ابری دوطرفه فعال شد.'
                    : 'Two-way cloud synced mode activated.'
                );
                setTimeout(() => setSuccess(''), 3000);
              } catch (err: any) {
                setError(
                  err.message ||
                    (isRtl
                      ? 'روشن کردن همگام‌سازی ابری نیازمند اشتراک ویژه (PRO) است.'
                      : 'Cloud sync requires an active PRO subscription.')
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
              <p className="text-xs font-black">{isRtl ? 'همگام‌سازی ابری (نیازمند PRO)' : 'Cloud Synced (PRO)'}</p>
              <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {isRtl
                  ? 'پشتیبان‌گیری خودکار و همگام‌سازی دوطرفه بین دسکتاپ و وب'
                  : 'Automatic backup & safe two-way desktop-web sync'}
              </p>
            </div>
          </button>
        </div>

        {/* Sync Queue Visualizer Trigger Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs gap-2 ${
          syncStats.pendingCount > 0
            ? 'bg-amber-500/10 border-amber-500/30'
            : darkMode ? 'bg-neutral-950/40 border-white/10' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${syncStats.pendingCount > 0 ? 'text-amber-400' : 'text-neutral-400'}`} />
            <div>
              <p className={`font-extrabold ${syncStats.pendingCount > 0 ? 'text-amber-400' : darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                {syncStats.pendingCount > 0
                  ? (isRtl ? `${syncStats.pendingCount} تغییر محلی آماده ارسال به کلود` : `${syncStats.pendingCount} pending local changes`)
                  : (isRtl ? 'صف همگام‌سازی خالی است' : 'Sync queue is clear')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQueueModalOpen(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                darkMode ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>{isRtl ? 'مشاهده صف تغییرات' : 'Inspect Queue'}</span>
            </button>

            {syncStats.pendingCount > 0 && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncingCloud}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
                <span>{isRtl ? 'ارسال تغییرات' : 'Sync Now'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FEATURE 2: Cloud Connection Test Card */}
      <div className={`pt-6 border-t space-y-3 ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className={`text-sm font-extrabold ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>
                {isRtl ? 'تست ارتباط با سرور ابری (Cloud Ping)' : 'Cloud API Connection Health Test'}
              </h4>
              <p className={`text-[11px] ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {isRtl
                  ? 'بررسی سلامت شبکه، سنجش زمان پاسخگویی (Latency) و پینگ سرور Directus'
                  : 'Ping Directus cloud endpoints to measure connection health and latency.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestCloudConnection}
            disabled={testingConnection}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Activity className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
            <span>{testingConnection ? (isRtl ? 'در حال تست...' : 'Testing...') : (isRtl ? 'تست ارتباط با سرور' : 'Test Connection')}</span>
          </button>
        </div>

        {connectionResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
              connectionResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {connectionResult.ok ? (
                <Wifi className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              ) : (
                <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <div>
                <p className="font-extrabold">{connectionResult.message}</p>
                {connectionResult.url && (
                  <p className="text-[10px] font-mono opacity-80 mt-0.5 dir-ltr text-left">{connectionResult.url}</p>
                )}
              </div>
            </div>

            {connectionResult.ok && connectionResult.latencyMs > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-black shrink-0">
                ⚡ {connectionResult.latencyMs}ms
              </span>
            )}
          </div>
        )}
      </div>

      {/* FEATURE 3: Local Backup & Restore Card */}
      <div className={`pt-6 border-t space-y-3 ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <h4 className={`text-sm font-extrabold ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>
              {isRtl ? 'پشتیبان‌گیری و بازگردانی داده‌های محلی' : 'Local Backup & Restore'}
            </h4>
            <p className={`text-[11px] ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {isRtl
                ? 'دانلود خروجی کامل JSON از دیتابیس محلی یا بازگردانی فایل‌های پشتیبان قبلی'
                : 'Export complete JSON database backup or import previous snapshot files.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Export Backup Button */}
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={exportingBackup}
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-extrabold cursor-pointer ${
              darkMode
                ? 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-800'
            }`}
          >
            <Download className={`w-4 h-4 ${exportingBackup ? 'animate-bounce' : ''}`} />
            <span>{exportingBackup ? (isRtl ? 'در حال خروجی گرفتن...' : 'Exporting...') : (isRtl ? 'دانلود فایل پشتیبان (Export)' : 'Export Backup')}</span>
          </button>

          {/* Import Backup Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-extrabold cursor-pointer ${
              darkMode
                ? 'bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20 text-sky-300'
                : 'bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isRtl ? 'بازگردانی پشتیبان (Import)' : 'Restore Backup'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Software Update Card */}
      <div className={`pt-6 border-t ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
        <AppUpdateWidget />
      </div>

      {/* MODAL: Sync Queue Visualizer Modal */}
      <SyncQueueVisualizerModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        queue={storageManager.getPendingSyncQueue()}
        onQueueUpdated={() => setSyncStats(storageManager.getSyncStats())}
        darkMode={darkMode}
        isRtl={isRtl}
      />

      {/* MODAL: Restore Backup Confirmation Dialog */}
      {restoreModalOpen && pendingBackupPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl ${
              darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <HardDrive className="w-5 h-5" />
                <h3 className="text-base font-extrabold">
                  {isRtl ? 'تأیید بازگردانی فایل پشتیبان' : 'Confirm Backup Restore'}
                </h3>
              </div>
              <button
                onClick={() => setRestoreModalOpen(false)}
                className={`p-1.5 rounded-lg border ${darkMode ? 'border-neutral-800 text-neutral-400 hover:bg-neutral-800' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Backup Stats Summary */}
            <div className={`p-4 rounded-xl border space-y-2 text-xs ${darkMode ? 'bg-neutral-950/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="flex justify-between">
                <span className="text-neutral-400">{isRtl ? 'تاریخ خروجی نهایی:' : 'Exported Date:'}</span>
                <span className="font-mono font-bold text-sky-400">
                  {pendingBackupPayload.timestamp ? new Date(pendingBackupPayload.timestamp).toLocaleDateString('fa-IR') : 'نامشخص'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">{isRtl ? 'تعداد کالاها:' : 'Products Count:'}</span>
                <span className="font-extrabold text-emerald-400">{pendingBackupPayload.data?.products?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">{isRtl ? 'تعداد اقلام انبار:' : 'Inventory Items:'}</span>
                <span className="font-extrabold text-amber-400">{pendingBackupPayload.data?.inventory?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">{isRtl ? 'تعداد سفارشات:' : 'Orders Count:'}</span>
                <span className="font-extrabold text-indigo-400">{pendingBackupPayload.data?.orders?.length || 0}</span>
              </div>
            </div>

            {/* Select Restore Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-neutral-400">
                {isRtl ? 'روش بازگردانی داده‌ها:' : 'Restore Strategy:'}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreMode('overwrite')}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    restoreMode === 'overwrite'
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 font-bold'
                      : darkMode ? 'bg-neutral-950/40 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <span className="text-xs font-black">{isRtl ? 'جایگزینی کامل (Overwrite)' : 'Overwrite Database'}</span>
                  <span className="text-[10px] text-neutral-400 mt-1">{isRtl ? 'جایگزینی تمامی داده‌های فعلی با پشتیبان' : 'Replaces all current records'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRestoreMode('merge')}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    restoreMode === 'merge'
                      ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 font-bold'
                      : darkMode ? 'bg-neutral-950/40 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <span className="text-xs font-black">{isRtl ? 'ادغام و ترکیب (Merge)' : 'Merge Data'}</span>
                  <span className="text-[10px] text-neutral-400 mt-1">{isRtl ? 'افزودن اقلام پشتیبان بدون حذف فعلی‌ها' : 'Appends missing items'}</span>
                </button>
              </div>
            </div>

            {restoreMode === 'overwrite' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{isRtl ? 'توجه: در حالت جایگزینی کامل، داده‌های قبلی کالاها و انبار فعلی پاک خواهند شد.' : 'Warning: Overwriting will erase existing unbacked data.'}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  darkMode ? 'border-neutral-800 text-neutral-400 hover:bg-neutral-800' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {isRtl ? 'انصراف' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoringData}
                className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {restoringData ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{isRtl ? 'تأیید و شروع بازگردانی' : 'Start Restore'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';
