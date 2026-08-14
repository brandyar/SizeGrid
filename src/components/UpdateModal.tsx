import React, { useState } from 'react';
import { useUpdater } from '../hooks/useUpdater';
import { useTranslation } from '../i18n';
import {
  ArrowUpCircle,
  Sparkles,
  X,
  RefreshCw,
  Download,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const UpdateModal: React.FC = () => {
  const { t, isRtl, lang } = useTranslation();
  const {
    currentVersion,
    latestVersion,
    updateAvailable,
    downloading,
    downloadProgress,
    readyToInstall,
    error,
    isMandatory,
    changelog,
    notes,
    logs,
    showStartupModal,
    downloadAndInstall,
    restartAndInstall,
    dismissModal,
    getDiagnosticReport,
  } = useUpdater();

  const [showLogs, setShowLogs] = useState(false);
  const [copied, setCopied] = useState(false);

  // Show modal if startup check triggered it OR if a mandatory update is active
  if (!showStartupModal && !isMandatory) {
    return null;
  }

  if (!updateAvailable && !downloading && !readyToInstall && !error) {
    return null;
  }

  const changelogItems = changelog?.[lang === 'fa' ? 'fa' : 'en'] || (notes ? notes.split('\n') : []);

  const handleCopyLogs = () => {
    const report = getDiagnosticReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div 
        className={`w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-neutral-800 overflow-hidden transform transition-all ${isRtl ? 'rtl' : 'ltr'}`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Modal Header Banner */}
        <div className={`relative p-6 text-white overflow-hidden ${
          isMandatory 
            ? 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600' 
            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600'
        }`}>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                {isMandatory ? (
                  <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
                ) : (
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                )}
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider mb-1">
                  {isMandatory 
                    ? (lang === 'fa' ? 'بروزرسانی الزامی' : 'MANDATORY UPDATE REQUIRED') 
                    : (lang === 'fa' ? 'نسخه جدید آماده است' : 'NEW UPDATE READY')}
                </span>
                <h2 className="text-lg font-bold">
                  {isMandatory 
                    ? (lang === 'fa' ? 'لطفاً برنامه را بروزرسانی کنید' : 'Please update application to continue') 
                    : (lang === 'fa' ? 'به‌روزرسانی جدید تن‌خور دسکتاپ' : 'New Tankhor App Update Available')}
                </h2>
              </div>
            </div>

            {/* Do NOT show close button for mandatory updates */}
            {!isMandatory && (
              <button
                onClick={dismissModal}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
                title={t('cancel')}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Version Pill Header */}
          <div className="mt-4 flex items-center gap-2 text-xs bg-white/15 backdrop-blur-md py-2 px-3.5 rounded-xl border border-white/20 w-fit">
            <span className="text-white/80">{t('current_version')}: <span className="font-mono font-bold text-white">v{currentVersion}</span></span>
            <ArrowUpCircle className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-bold text-emerald-200">v{latestVersion}</span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5 text-slate-800 dark:text-neutral-200 max-h-[75vh] overflow-y-auto">
          {/* Mandatory notice */}
          {isMandatory && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-semibold rounded-2xl border border-amber-200 dark:border-amber-800/60">
              {lang === 'fa' 
                ? 'جهت حفظ امنیت داده‌ها و همگام‌سازی دیتابیس، نصب این بروزرسانی الزامی می‌باشد.' 
                : 'This update is required to maintain database sync and compatibility.'}
            </div>
          )}

          {/* Changelog section */}
          {changelogItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2.5">
                {t('changelog_title')}
              </h3>
              <div className="bg-slate-50 dark:bg-neutral-950/60 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800/80 max-h-40 overflow-y-auto">
                <ul className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-neutral-300">
                  {changelogItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Download progress bar */}
          {downloading && (
            <div className="space-y-2 bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex justify-between text-xs text-indigo-900 dark:text-indigo-200 font-bold">
                <span>{lang === 'fa' ? 'در حال دریافت و بررسی امضای فایل...' : 'Downloading update...'}</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200 dark:bg-indigo-900/60 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Ready to install notification */}
          {readyToInstall && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{lang === 'fa' ? 'فایل به‌روزرسانی آماده نصب است. برنامه پس از نصب مجدداً اجرا می‌شود.' : 'Update ready to install. The app will restart.'}</span>
            </div>
          )}

          {/* Error notification */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-semibold rounded-2xl border border-rose-200 dark:border-rose-800/60">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-xs leading-relaxed">{error}</span>
            </div>
          )}

          {/* Diagnostic Log Viewer Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center justify-between w-full text-xs text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200 py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                <span>{showLogs ? t('updater_hide_logs') : t('updater_show_logs')}</span>
                <span className="text-[10px] bg-slate-200 dark:bg-neutral-800 px-1.5 py-0.2 rounded-full font-bold">
                  {logs.length}
                </span>
              </span>
              {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showLogs && (
              <div className="mt-2 p-3 bg-slate-950 text-slate-300 rounded-xl border border-slate-800 font-mono text-[10px] space-y-2 dir-ltr text-left">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400 font-bold">Diagnostic Logs</span>
                  <button
                    type="button"
                    onClick={handleCopyLogs}
                    className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Report'}</span>
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {logs.map((l) => (
                    <div key={l.id} className="leading-tight">
                      <span className="text-slate-500">[{l.timestamp}]</span>{' '}
                      <span className={`font-bold ${
                        l.level === 'error' ? 'text-rose-400' : l.level === 'warn' ? 'text-amber-400' : l.level === 'success' ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        [{l.category.toUpperCase()}]
                      </span>{' '}
                      <span className={l.level === 'error' ? 'text-rose-300' : l.level === 'warn' ? 'text-amber-300' : 'text-slate-300'}>
                        {l.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {readyToInstall ? (
              <button
                type="button"
                onClick={restartAndInstall}
                className="w-full py-3.5 px-5 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'fa' ? 'راه‌اندازی مجدد و نصب بروزرسانی' : 'Restart & Install Now'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={downloadAndInstall}
                  disabled={downloading}
                  className="flex-1 py-3.5 px-5 rounded-2xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloading ? (lang === 'fa' ? 'در حال دریافت...' : 'Downloading...') : (lang === 'fa' ? 'دانلود و نصب بروزرسانی' : 'Download & Install')}</span>
                </button>

                {!isMandatory && (
                  <button
                    type="button"
                    onClick={dismissModal}
                    className="py-3.5 px-4 rounded-2xl font-medium text-xs bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 transition-all cursor-pointer"
                  >
                    {lang === 'fa' ? 'بعداً' : 'Later'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

