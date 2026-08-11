import React from 'react';
import { useUpdater } from '../hooks/useUpdater';
import { useTranslation } from '../i18n';
import { RefreshCw, Download, CheckCircle, AlertTriangle, ArrowUpCircle, Sparkles, ShieldCheck } from 'lucide-react';

export const AppUpdateWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t, isRtl, lang } = useTranslation();
  const {
    currentVersion,
    latestVersion,
    updateAvailable,
    checking,
    downloading,
    downloadProgress,
    readyToInstall,
    error,
    changelog,
    lastCheckedTime,
    checkForUpdates,
    downloadAndInstall,
    restartAndInstall,
  } = useUpdater();

  const formattedLastChecked = lastCheckedTime
    ? new Date(lastCheckedTime).toLocaleTimeString(isRtl ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {updateAvailable ? (
          <button
            onClick={downloadAndInstall}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-full shadow-md transition-all animate-pulse cursor-pointer"
            title={t('update_available')}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>v{latestVersion}</span>
          </button>
        ) : (
          <button
            onClick={checkForUpdates}
            disabled={checking}
            className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-medium px-2.5 py-1 rounded-full transition-all border border-slate-200 dark:border-neutral-700 cursor-pointer"
            title={t('check_updates')}
          >
            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin text-blue-600' : 'text-slate-500 dark:text-neutral-400'}`} />
            <span>v{currentVersion}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-5 shadow-sm space-y-4">
      {/* Header section */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {lang === 'fa' ? 'به‌روزرسانی نرم‌افزار (Software Updates)' : 'Software Updates'}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3" />
                <span>{lang === 'fa' ? 'امضای معتبر' : 'Signed'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {t('current_version')}: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">v{currentVersion}</span>
            </p>
          </div>
        </div>

        <button
          onClick={checkForUpdates}
          disabled={checking || downloading}
          className="flex items-center gap-2 text-xs bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? (lang === 'fa' ? 'در حال بررسی...' : 'Checking...') : (lang === 'fa' ? 'بررسی بروزرسانی' : 'Check for updates')}</span>
        </button>
      </div>

      {/* Up-to-date state */}
      {!updateAvailable && !downloading && !readyToInstall && !error && (
        <div className="flex items-center justify-between text-xs bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{lang === 'fa' ? '✓ شما از آخرین نسخه تن‌خور استفاده می‌کنید.' : "✓ You're up to date"}</span>
          </div>
          {formattedLastChecked && (
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
              {lang === 'fa' ? `آخرین بررسی: ${formattedLastChecked}` : `Last checked: ${formattedLastChecked}`}
            </span>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between gap-2 text-xs bg-rose-500/10 text-rose-800 dark:text-rose-300 p-3.5 rounded-xl border border-rose-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={checkForUpdates}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer"
          >
            {lang === 'fa' ? 'تلاش مجدد' : 'Retry'}
          </button>
        </div>
      )}

      {/* Update Available & Downloading Section */}
      {(updateAvailable || downloading || readyToInstall) && (
        <div className="bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 rounded-2xl p-4 border border-indigo-500/20 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                NEW
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                v{latestVersion}
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
              {lang === 'fa' ? 'نسخه جدید آماده دریافت' : 'New version available'}
            </span>
          </div>

          {/* Changelog items */}
          {changelog && (
            <div className="space-y-1.5 text-xs pt-1">
              <div className="font-bold text-slate-800 dark:text-neutral-200">
                {lang === 'fa' ? 'تغییرات و قابلیت‌های جدید:' : "What's new:"}
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-neutral-400 pl-1">
                {(changelog[lang === 'fa' ? 'fa' : 'en'] || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Download progress */}
          {downloading && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <span>{lang === 'fa' ? 'در حال دریافت فایل بروزرسانی...' : 'Downloading update...'}</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300 bg-gradient-to-r from-indigo-500 to-emerald-500 animate-pulse"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Ready to install button */}
          {readyToInstall && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 p-3 rounded-xl text-center flex items-center justify-center gap-2 border border-emerald-500/20">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>{lang === 'fa' ? 'فایل بروزرسانی با موفقیت دریافت و تایید شد.' : 'Update ready to install.'}</span>
              </div>
              <button
                onClick={restartAndInstall}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'fa' ? 'راه‌اندازی مجدد و نصب بروزرسانی (Restart and Install)' : 'Restart and Install'}</span>
              </button>
            </div>
          )}

          {/* Action button */}
          {updateAvailable && !downloading && !readyToInstall && (
            <button
              onClick={downloadAndInstall}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'fa' ? 'دانلود و نصب خودکار (Download and Install)' : 'Download and Install'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
