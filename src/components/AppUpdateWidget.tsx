import React, { useState } from 'react';
import { useUpdater } from '../hooks/useUpdater';
import { useTranslation } from '../i18n';
import {
  RefreshCw,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowUpCircle,
  Sparkles,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Cpu,
  Info,
  Check,
  AlertCircle,
  Zap
} from 'lucide-react';
import { isDesktopEnv } from '../utils/desktop';

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
    logs,
    checkForUpdates,
    downloadAndInstall,
    restartAndInstall,
    clearLogs,
    getDiagnosticReport,
  } = useUpdater();

  const [showLogs, setShowLogs] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'tauri' | 'download'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const formattedLastChecked = lastCheckedTime
    ? new Date(lastCheckedTime).toLocaleTimeString(isRtl ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const isDesktop = isDesktopEnv();

  const handleCopyLogs = () => {
    const report = getDiagnosticReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleForceRecheck = () => {
    checkForUpdates();
  };

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'error') return l.level === 'error' || l.level === 'warn';
    if (logFilter === 'tauri') return l.category === 'tauri-ipc';
    if (logFilter === 'download') return l.category === 'download' || l.category === 'install';
    return true;
  });

  const errorLogsCount = logs.filter(l => l.level === 'error').length;
  const warnLogsCount = logs.filter(l => l.level === 'warn').length;

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
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-neutral-800 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {lang === 'fa' ? 'به‌روزرسانی نرم‌افزار (Software Updates)' : 'Software Updates'}
              </h3>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                isDesktop ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-500'
              }`}>
                <Cpu className="w-3 h-3" />
                <span>{isDesktop ? (lang === 'fa' ? 'محیط نیتیو دسکتاپ' : 'Native Desktop') : (lang === 'fa' ? 'محیط وب' : 'Web App')}</span>
              </span>
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all border cursor-pointer ${
              showLogs
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600'
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-200'
            }`}
            title="نمایش لاگ‌های تشخیصی بروزرسانی"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showLogs ? t('updater_hide_logs') : t('updater_show_logs')}</span>
            {errorLogsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {errorLogsCount}
              </span>
            )}
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleForceRecheck}
            disabled={checking || downloading}
            className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? (lang === 'fa' ? 'در حال بررسی...' : 'Checking...') : (lang === 'fa' ? 'بررسی بروزرسانی' : 'Check for updates')}</span>
          </button>
        </div>
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
            <span className="line-clamp-2">{error}</span>
          </div>
          <button
            onClick={checkForUpdates}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition-all shrink-0 cursor-pointer"
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
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                  {lang === 'fa' ? 'در حال دریافت فایل بروزرسانی...' : 'Downloading update...'}
                </span>
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

      {/* DIAGNOSTIC LOGS CONSOLE ACCORDION */}
      {showLogs && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 text-slate-200 p-4 space-y-3 font-mono text-xs shadow-inner">
          {/* Diagnostic Console Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-100 text-xs tracking-wide">
                {t('updater_diagnostics_title')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {logs.length} logs
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyLogs}
                className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title={t('updater_copy_logs')}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? t('updater_logs_copied') : t('updater_copy_logs')}</span>
              </button>

              <button
                onClick={clearLogs}
                className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                title={t('updater_clear_logs')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Diagnostic Summary Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">ENVIRONMENT</span>
              <span className={`font-bold ${isDesktop ? 'text-indigo-400' : 'text-amber-400'}`}>
                {isDesktop ? 'Tauri Desktop (Native)' : 'Web Browser'}
              </span>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">CURRENT / TARGET</span>
              <span className="font-bold text-slate-200">
                v{currentVersion} / v{latestVersion || '?'}
              </span>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">STATUS</span>
              <span className="font-bold text-emerald-400 uppercase">
                {downloading ? `DOWNLOADING ${downloadProgress}%` : readyToInstall ? 'READY TO INSTALL' : updateAvailable ? 'UPDATE AVAILABLE' : checking ? 'CHECKING...' : 'IDLE'}
              </span>
            </div>

            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block text-[10px]">ERRORS / WARNS</span>
              <span className="font-bold text-rose-400">
                {errorLogsCount} err / {warnLogsCount} warn
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1 text-[11px]">
            <span className="text-slate-500 text-[10px] uppercase mr-1">Filter:</span>
            <button
              onClick={() => setLogFilter('all')}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                logFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setLogFilter('tauri')}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                logFilter === 'tauri' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Tauri IPC
            </button>
            <button
              onClick={() => setLogFilter('download')}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                logFilter === 'download' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Download/Install
            </button>
            <button
              onClick={() => setLogFilter('error')}
              className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                logFilter === 'error' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-900 text-rose-400 hover:text-rose-300'
              }`}
            >
              Errors/Warnings ({errorLogsCount + warnLogsCount})
            </button>
          </div>

          {/* Logs Viewport */}
          <div className="bg-slate-900/90 rounded-xl p-2.5 max-h-72 overflow-y-auto space-y-1.5 text-[11px] font-mono border border-slate-800/80 dir-ltr text-left">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-6">
                هنوز لاگی ثبت نشده است یا فیلتر انتخابی نتیجه‌ای ندارد.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                let levelBadge = 'bg-slate-800 text-slate-300';
                let levelIcon = <Info className="w-3 h-3 text-sky-400 shrink-0" />;

                if (log.level === 'error') {
                  levelBadge = 'bg-rose-950/80 text-rose-400 border border-rose-800';
                  levelIcon = <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />;
                } else if (log.level === 'warn') {
                  levelBadge = 'bg-amber-950/80 text-amber-400 border border-amber-800';
                  levelIcon = <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />;
                } else if (log.level === 'success') {
                  levelBadge = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800';
                  levelIcon = <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />;
                } else if (log.level === 'debug') {
                  levelBadge = 'bg-slate-800/50 text-slate-500';
                  levelIcon = <Terminal className="w-3 h-3 text-slate-500 shrink-0" />;
                }

                return (
                  <div
                    key={log.id}
                    className={`rounded-lg p-2 transition-colors ${
                      log.level === 'error' ? 'bg-rose-950/20' : log.level === 'warn' ? 'bg-amber-950/20' : 'bg-slate-950/60'
                    }`}
                  >
                    <div
                      className="flex items-start justify-between gap-2 cursor-pointer"
                      onClick={() => log.details && setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        {levelIcon}
                        <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp}</span>
                        <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded shrink-0 uppercase ${levelBadge}`}>
                          {log.category}
                        </span>
                        <span className={`break-words ${
                          log.level === 'error' ? 'text-rose-300 font-semibold' : log.level === 'warn' ? 'text-amber-300 font-semibold' : log.level === 'success' ? 'text-emerald-300 font-semibold' : 'text-slate-300'
                        }`}>
                          {log.message}
                        </span>
                      </div>
                      {log.details && (
                        <button className="text-slate-500 hover:text-slate-300 text-[10px] shrink-0">
                          {isExpanded ? '[-]' : '[+]'}
                        </button>
                      )}
                    </div>

                    {/* Expandable JSON / Error Stack details */}
                    {isExpanded && log.details && (
                      <div className="mt-2 p-2 bg-black/60 rounded-md border border-slate-800 overflow-x-auto text-[10px] text-slate-400 font-mono">
                        <pre className="whitespace-pre-wrap break-all">
                          {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
            <span>💡 این لاگ‌ها دقیقاً دلیل پرش (Skip) یا بروز خطای Updater نیتیو را ثبت می‌کنند.</span>
            <span>Tankhor Updater Engine</span>
          </div>
        </div>
      )}
    </div>
  );
};

