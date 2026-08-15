import { AppVersionInfo, UpdateState, UpdaterLogEntry } from './types';
import { isDesktopEnv } from './utils/desktop';
import { APP_VERSION } from './version';

// Default base version string of the app binary
export const CURRENT_APP_VERSION = APP_VERSION;

const UPDATE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache TTL to avoid GitHub API rate limits
const MAX_LOGS_COUNT = 150;

// Lazy-loaded Tauri native modules
let tauriUpdaterModule: typeof import('@tauri-apps/api/updater') | null = null;
let tauriProcessModule: typeof import('@tauri-apps/api/process') | null = null;
let tauriAppModule: typeof import('@tauri-apps/api/app') | null = null;

async function getTauriModules(logger?: (level: 'info' | 'warn' | 'error' | 'success' | 'debug', cat: any, msg: string, d?: any) => void) {
  if (typeof window === 'undefined') return null;
  try {
    if (!tauriUpdaterModule) {
      const modV1 = '@tauri-apps/api/updater';
      const modV2 = '@tauri-apps/plugin-updater';
      tauriUpdaterModule = await import(/* @vite-ignore */ modV1).catch(() => null) as any;
      if (!tauriUpdaterModule) {
        tauriUpdaterModule = await import(/* @vite-ignore */ modV2).catch(() => null) as any;
      }
      if (!tauriUpdaterModule) {
        const win = window as any;
        if (win.__TAURI_PLUGIN_UPDATER__) {
          tauriUpdaterModule = win.__TAURI_PLUGIN_UPDATER__;
        } else if (win.__TAURI__?.updater) {
          tauriUpdaterModule = win.__TAURI__.updater;
        }
      }
      if (tauriUpdaterModule) {
        logger?.('success', 'tauri-ipc', 'Loaded Tauri updater module successfully');
      } else {
        logger?.('warn', 'tauri-ipc', 'Could not load Tauri updater module via dynamic import or window globals');
      }
    }
    if (!tauriProcessModule) {
      const procMod = '@tauri-apps/api/process';
      tauriProcessModule = await import(/* @vite-ignore */ procMod).catch((err) => {
        logger?.('warn', 'tauri-ipc', 'Failed to import @tauri-apps/api/process module', err?.message || err);
        return null;
      }) as any;
    }
    if (!tauriAppModule) {
      const appMod = '@tauri-apps/api/app';
      tauriAppModule = await import(/* @vite-ignore */ appMod).catch((err) => {
        logger?.('warn', 'tauri-ipc', 'Failed to import @tauri-apps/api/app module', err?.message || err);
        return null;
      }) as any;
    }
    return {
      updater: tauriUpdaterModule,
      process: tauriProcessModule,
      app: tauriAppModule,
    };
  } catch (e: any) {
    logger?.('error', 'tauri-ipc', 'Unexpected error importing Tauri native modules', e?.message || e);
    return null;
  }
}

class AppUpdateService {
  private state: UpdateState = {
    currentVersion: CURRENT_APP_VERSION,
    status: 'idle',
    latestRelease: null,
    downloadProgress: 0,
    errorMessage: null,
    lastCheckedTime: null,
    showStartupModal: false,
    logs: [],
  };

  private listeners: Array<(state: UpdateState) => void> = [];
  private activeTauriUpdateHandle: any = null;
  private autoCheckTimer: any = null;
  private unlistenUpdaterEvents: (() => void) | null = null;

  constructor() {
    // Load last checked time & persisted logs on initialization
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tankhor_installed_app_version');
      const savedLastCheck = localStorage.getItem('tankhor_last_update_check');
      if (savedLastCheck) {
        this.state.lastCheckedTime = parseInt(savedLastCheck, 10);
      }

      try {
        const savedLogs = localStorage.getItem('tankhor_updater_logs');
        if (savedLogs) {
          const parsed = JSON.parse(savedLogs);
          if (Array.isArray(parsed)) {
            this.state.logs = parsed.slice(-50);
          }
        }
      } catch (e) {
        // ignore log parse errors
      }
    }

    // Initial system environment diagnostic log
    const envInfo = this.getEnvironmentDiagnostics();
    this.addLog('info', 'env', `Initialized Tankhor Updater v${CURRENT_APP_VERSION}`, envInfo);

    // Trigger non-blocking automatic update check on application startup
    if (typeof window !== 'undefined' && this.isDesktopOrNativeApp()) {
      setTimeout(() => {
        this.addLog('info', 'tauri-ipc', 'Triggering startup non-blocking update check');
        this.checkForUpdates(true);
      }, 2000);

      // Periodic check every 4 hours
      this.autoCheckTimer = setInterval(() => {
        this.addLog('info', 'tauri-ipc', 'Triggering periodic scheduled update check (4h interval)');
        this.checkForUpdates(true);
      }, 4 * 60 * 60 * 1000);
    }
  }

  /**
   * Diagnostic environment inspector
   */
  public getEnvironmentDiagnostics() {
    if (typeof window === 'undefined') return { isNode: true };
    const win = window as any;
    const isDesktop = isDesktopEnv();
    const tauriKeys = Object.keys(win).filter(k => k.startsWith('__TAURI'));
    return {
      userAgent: navigator.userAgent,
      isDesktopEnv: isDesktop,
      tauriKeysFound: tauriKeys,
      protocol: window.location.protocol,
      origin: window.location.origin,
      hostname: window.location.hostname,
      hasActiveTauriHandle: !!this.activeTauriUpdateHandle,
      currentVersion: this.state.currentVersion,
    };
  }

  /**
   * Append a structured diagnostic log entry
   */
  public addLog(
    level: 'info' | 'warn' | 'error' | 'success' | 'debug',
    category: 'tauri-ipc' | 'manifest' | 'network' | 'signature' | 'download' | 'install' | 'env',
    message: string,
    details?: any
  ) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    
    const entry: UpdaterLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: timeStr,
      level,
      category,
      message,
      details: details ? (typeof details === 'object' ? JSON.parse(JSON.stringify(details, Object.getOwnPropertyNames(details))) : details) : undefined,
    };

    // Keep memory logs within bounds
    this.state.logs = [...this.state.logs.slice(-(MAX_LOGS_COUNT - 1)), entry];

    // Persist latest 50 logs to localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('tankhor_updater_logs', JSON.stringify(this.state.logs.slice(-50)));
      } catch (e) {
        // localStorage could be full
      }
    }

    // Console output with formatted prefix
    const prefix = `[Tankhor Updater - ${category.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, message, details || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, details || '');
    } else {
      console.log(prefix, message, details || '');
    }

    this.notifyListeners();
  }

  public getLogs(): UpdaterLogEntry[] {
    return [...this.state.logs];
  }

  public clearLogs(): void {
    this.state.logs = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tankhor_updater_logs');
    }
    this.addLog('info', 'env', 'Diagnostic logs cleared by user');
    this.notifyListeners();
  }

  public getDiagnosticReport(): string {
    const env = this.getEnvironmentDiagnostics();
    let report = `=== TANKHOR UPDATER DIAGNOSTIC REPORT ===\n`;
    report += `Generated at: ${new Date().toISOString()}\n`;
    report += `App Version: v${this.state.currentVersion}\n`;
    report += `Status: ${this.state.status}\n`;
    report += `Download Progress: ${this.state.downloadProgress}%\n`;
    report += `Active Tauri Handle Present: ${!!this.activeTauriUpdateHandle}\n`;
    report += `Latest Release Target: ${this.state.latestRelease?.version || 'None'}\n`;
    report += `Download Target URL: ${this.state.latestRelease?.downloadUrl || 'None'}\n`;
    report += `Last Error: ${this.state.errorMessage || 'None'}\n\n`;
    report += `--- ENVIRONMENT ---\n`;
    report += JSON.stringify(env, null, 2) + `\n\n`;
    report += `--- LOG ENTRIES (${this.state.logs.length}) ---\n`;
    this.state.logs.forEach(l => {
      report += `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.category.toUpperCase()}] ${l.message}\n`;
      if (l.details) {
        report += `  Details: ${typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}\n`;
      }
    });
    return report;
  }

  public getState(): UpdateState {
    return { ...this.state };
  }

  public subscribe(listener: (state: UpdateState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const currentState = this.getState();
    this.listeners.forEach(l => l(currentState));
  }

  public dismissStartupModal() {
    if (this.state.latestRelease?.isMandatory) {
      // Mandatory updates cannot be permanently dismissed
      return;
    }
    this.state.showStartupModal = false;
    this.notifyListeners();
  }

  /**
   * Compare semantic versions (v1 = current, v2 = target)
   * Returns:
   *   > 0 if v2 is newer than v1 (e.g. v1="1.4.0", v2="1.4.1" -> returns 1)
   *   < 0 if v2 is older than v1 (e.g. v1="1.4.1", v2="1.4.0" -> returns -1)
   *   0 if equal
   */
  public compareVersions(v1: string, v2: string): number {
    const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const p1 = parse(v1);
    const p2 = parse(v2);

    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num2 > num1) return 1;
      if (num2 < num1) return -1;
    }
    return 0;
  }

  public isDesktopOrNativeApp(): boolean {
    return isDesktopEnv();
  }

  public isTauriDesktop(): boolean {
    return isDesktopEnv();
  }

  /**
   * Check for software updates
   * @param isStartupCheck Whether this was initiated silently at app launch
   * @param forceRefresh Whether to bypass local TTL cache and query remote servers directly
   */
  public async checkForUpdates(isStartupCheck = false, forceRefresh = false): Promise<UpdateState> {
    this.addLog('info', 'network', `checkForUpdates started (forceRefresh=${forceRefresh}, isStartupCheck=${isStartupCheck})`);

    // Return cached result if checked within TTL window and not forcing refresh
    if (!forceRefresh && typeof localStorage !== 'undefined') {
      const savedLastCheck = localStorage.getItem('tankhor_last_update_check');
      const cachedReleaseStr = localStorage.getItem('tankhor_cached_update_release');
      if (savedLastCheck && cachedReleaseStr) {
        const lastCheckTs = parseInt(savedLastCheck, 10);
        if (!isNaN(lastCheckTs) && (Date.now() - lastCheckTs < UPDATE_CACHE_TTL_MS)) {
          try {
            const cachedRelease: AppVersionInfo = JSON.parse(cachedReleaseStr);
            const hasNewVersion = this.compareVersions(this.state.currentVersion, cachedRelease.version) > 0;
            this.state.status = hasNewVersion ? 'update_available' : 'up_to_date';
            this.state.latestRelease = cachedRelease;
            this.state.lastCheckedTime = lastCheckTs;
            if (isStartupCheck && (hasNewVersion || cachedRelease.isMandatory)) {
              this.state.showStartupModal = true;
            }
            this.addLog('info', 'manifest', `Using cached update release v${cachedRelease.version} (checked ${Math.round((Date.now() - lastCheckTs) / 1000)}s ago)`);
            this.notifyListeners();
            return this.getState();
          } catch (e) {
            // Ignore parse errors and fall through
          }
        }
      }
    }

    this.state.status = 'checking';
    this.state.errorMessage = null;
    this.notifyListeners();

    try {
      const tauriModules = await getTauriModules((lvl, cat, msg, d) => this.addLog(lvl, cat, msg, d));

      // 1. Query native app version from Tauri IPC bridge if available
      if (this.isTauriDesktop() && tauriModules?.app) {
        try {
          const nativeVersion = await tauriModules.app.getVersion();
          if (nativeVersion && typeof nativeVersion === 'string') {
            this.state.currentVersion = nativeVersion.trim();
            this.addLog('info', 'tauri-ipc', `Retrieved native binary version via Tauri IPC: v${this.state.currentVersion}`);
          }
        } catch (verErr: any) {
          this.addLog('warn', 'tauri-ipc', `Native Tauri getVersion query warning: ${verErr?.message || verErr}`, verErr);
        }
      }

      // 2. Query official Tauri Updater native bridge first
      if (this.isTauriDesktop() && tauriModules?.updater) {
        try {
          this.addLog('info', 'tauri-ipc', 'Invoking Tauri native updater IPC (checkUpdate / check)...');
          let update: any = null;
          if (typeof (tauriModules.updater as any).checkUpdate === 'function') {
            update = await (tauriModules.updater as any).checkUpdate();
          } else if (typeof (tauriModules.updater as any).check === 'function') {
            update = await (tauriModules.updater as any).check();
          }
          this.addLog('debug', 'tauri-ipc', 'Tauri updater returned result', update);

          const shouldUpdate = update?.shouldUpdate ?? update?.available;

          if (shouldUpdate) {
            this.activeTauriUpdateHandle = update;
            const releaseVersion = update?.version || update?.manifest?.version || APP_VERSION;
            const minVer = (update?.manifest as any)?.minimum_version || (update?.manifest as any)?.minSupportedVersion || '1.0.0';
            const isMandatory = this.compareVersions(this.state.currentVersion, minVer) > 0;

            this.state.status = 'update_available';
            this.state.latestRelease = {
              version: releaseVersion,
              releaseDate: update?.date || (update?.manifest as any)?.pub_date || (update?.manifest as any)?.date || new Date().toISOString().split('T')[0],
              notes: update?.body || (update?.manifest as any)?.notes || (update as any)?.notes || 'به‌روزرسانی جدید تن‌خور دسکتاپ',
              changelog: {
                fa: [update?.body || (update?.manifest as any)?.notes || (update as any)?.notes || 'افزوده شدن قابلیت‌های جدید و ارتقای کارایی'],
                en: [update?.body || (update?.manifest as any)?.notes || (update as any)?.notes || 'New features and bug fixes added.']
              },
              downloadUrl: (update?.manifest as any)?.url || 'https://github.com/brandyar/SizeGrid/releases/latest',
              minimum_version: minVer,
              isMandatory,
            };

            this.state.lastCheckedTime = Date.now();
            if (isStartupCheck || isMandatory) {
              this.state.showStartupModal = true;
            }
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('tankhor_last_update_check', this.state.lastCheckedTime.toString());
            }

            this.addLog('success', 'tauri-ipc', `Native Tauri updater confirmed new update v${releaseVersion} is available and verified!`, {
              manifest: update.manifest,
              shouldUpdate: update.shouldUpdate,
            });

            this.notifyListeners();
            return this.getState();
          } else {
            this.addLog('info', 'tauri-ipc', 'Tauri native updater reported shouldUpdate: false (No native package update signaled by endpoints).');
          }
        } catch (tauriErr: any) {
          this.addLog('warn', 'tauri-ipc', `Tauri native updater check threw an error: ${tauriErr?.message || tauriErr}. Will check HTTP endpoints as fallback.`, {
            error: tauriErr?.message || String(tauriErr),
            stack: tauriErr?.stack,
          });
        }
      } else {
        this.addLog('info', 'tauri-ipc', `Native Tauri updater not engaged (isDesktop=${this.isTauriDesktop()}, updaterLoaded=${!!tauriModules?.updater})`);
      }

      // 3. Query Official GitHub Releases API & HTTP Manifest Candidates
      let remoteRelease: AppVersionInfo | null = null;

      // 3A. Direct query to GitHub Releases API for brandyar/SizeGrid
      try {
        this.addLog('info', 'network', 'Querying GitHub Releases API (api.github.com/repos/brandyar/SizeGrid/releases/latest)...');
        const ghRes = await fetch('https://api.github.com/repos/brandyar/SizeGrid/releases/latest', {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
          cache: 'no-store'
        });
        this.addLog('debug', 'network', `GitHub Releases API response HTTP status: ${ghRes.status}`);

        if (ghRes.ok) {
          const ghData = await ghRes.json();
          if (ghData && ghData.tag_name) {
            const cleanVer = ghData.tag_name.replace(/^v/, '');
            const notes = ghData.body || 'به‌روزرسانی جدید نرم‌افزار تن‌خور دسکتاپ';
            let exeUrl = `https://github.com/brandyar/SizeGrid/releases/download/v${cleanVer}/Tankhor_${cleanVer}_x64-setup.exe`;
            let dmgUrl = `https://github.com/brandyar/SizeGrid/releases/download/v${cleanVer}/Tankhor_${cleanVer}_aarch64.dmg`;

            if (Array.isArray(ghData.assets)) {
              const exeAsset = ghData.assets.find((a: any) => a.name?.endsWith('.exe'));
              if (exeAsset?.browser_download_url) exeUrl = exeAsset.browser_download_url;
              const dmgAsset = ghData.assets.find((a: any) => a.name?.endsWith('.dmg'));
              if (dmgAsset?.browser_download_url) dmgUrl = dmgAsset.browser_download_url;
            }

            const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
            const downloadUrl = isMac ? dmgUrl : exeUrl;

            remoteRelease = {
              version: cleanVer,
              releaseDate: ghData.published_at ? ghData.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
              notes: notes,
              changelog: {
                fa: notes.split('\n').filter((l: string) => l.trim().length > 0),
                en: notes.split('\n').filter((l: string) => l.trim().length > 0)
              },
              downloadUrl: downloadUrl || ghData.html_url,
              minimum_version: '1.0.0',
              isMandatory: false
            };

            this.addLog('success', 'network', `Found GitHub release tag: v${cleanVer}`, {
              downloadUrl,
              assetsCount: ghData.assets?.length || 0,
            });
          }
        }
      } catch (ghErr: any) {
        this.addLog('warn', 'network', `GitHub Releases API query failed: ${ghErr?.message || ghErr}`, ghErr);
      }

      // 3B. Query Raw Manifest Endpoints if GitHub Releases API didn't return or was rate-limited
      if (!remoteRelease) {
        const manifestCandidates: string[] = [
          'https://raw.githubusercontent.com/brandyar/SizeGrid/main/public/version.json',
          'https://raw.githubusercontent.com/brandyar/SizeGrid/main/public/latest.json',
          'https://raw.githubusercontent.com/brandyar/SizeGrid/master/public/version.json',
          'https://raw.githubusercontent.com/brandyar/SizeGrid/master/public/latest.json',
          'https://tankhor.com/version.json',
          'https://tankhor.com/latest.json'
        ];

        const envManifestUrl = (import.meta as any).env?.VITE_UPDATE_MANIFEST_URL as string;
        if (envManifestUrl && envManifestUrl.trim().length > 0) {
          manifestCandidates.unshift(envManifestUrl.trim());
        }

        if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http')) {
          manifestCandidates.push(`${window.location.origin}/latest.json`);
          manifestCandidates.push(`${window.location.origin}/version.json`);
        }

        // Only query relative /version.json in WEB browser mode, NOT in Tauri desktop mode
        if (!this.isTauriDesktop()) {
          manifestCandidates.push('/latest.json');
          manifestCandidates.push('/version.json');
        }

        for (const baseUrl of manifestCandidates) {
          try {
            const sep = baseUrl.includes('?') ? '&' : '?';
            const cacheBusterUrl = `${baseUrl}${sep}_t=${Date.now()}`;
            this.addLog('debug', 'manifest', `Checking manifest endpoint: ${baseUrl}`);
            const res = await fetch(cacheBusterUrl, { 
              cache: 'no-store',
              headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
              }
            });

            if (res.ok) {
              const data = await res.json();
              if (data && data.version) {
                const minVer = data.minimum_version || data.minSupportedVersion || '1.0.0';
                const isMandatory = this.compareVersions(this.state.currentVersion, minVer) > 0;

                let faChangelog: string[] = [];
                let enChangelog: string[] = [];

                if (data.changelog && Array.isArray(data.changelog.fa)) {
                  faChangelog = data.changelog.fa;
                  enChangelog = data.changelog.en || data.changelog.fa;
                } else if (data.notes) {
                  faChangelog = data.notes.split('\n').filter((l: string) => l.trim().length > 0);
                  enChangelog = faChangelog;
                } else {
                  faChangelog = ['به‌روزرسانی جدید نرم‌افزار تن‌خور'];
                  enChangelog = ['New Tankhor update available'];
                }

                remoteRelease = {
                  version: data.version,
                  releaseDate: data.pub_date || data.releaseDate || new Date().toISOString().split('T')[0],
                  notes: data.notes || faChangelog.join(' • '),
                  changelog: {
                    fa: faChangelog,
                    en: enChangelog
                  },
                  downloadUrl: data.url || data.downloadUrl || 'https://github.com/brandyar/SizeGrid/releases/tag/v1.4.7',
                  minimum_version: minVer,
                  isMandatory
                };
                this.addLog('success', 'manifest', `Successfully parsed version manifest from ${baseUrl} (v${data.version})`);
                break;
              }
            }
          } catch (fetchErr: any) {
            this.addLog('debug', 'manifest', `Endpoint unreachable: ${baseUrl} (${fetchErr?.message || fetchErr})`);
          }
        }
      }

      // Default fallback release object if offline or endpoints unreachable
      if (!remoteRelease) {
        this.addLog('warn', 'manifest', 'All remote endpoints unreachable; applying built-in fallback release object');
        remoteRelease = {
          version: APP_VERSION,
          releaseDate: new Date().toISOString().split('T')[0],
          notes: '• نمایش پویا و خودکار نسخه نرم‌افزار در تمامی هدرهای وب، دسکتاپ و صفحه ورود\n• ارتقا و بهینه‌سازی زیرساخت سنجش و دانلود خودکار بروزرسانی در پس‌زمینه (Background Auto-Updater)',
          changelog: {
            fa: [
              'نمایش پویای نسخه و ویجت وضعیت بروزرسانی در هدر سایت و صفحه ورود دسکتاپ',
              'همگام‌سازی خودکار و داینامیک لینک‌های دانلود فایل‌های نصبی مک (DMG) و ویندوز (EXE)',
              'بهبود مکانیزم بررسی و دریافت بسته‌های بروزرسانی در پس‌زمینه (Background Auto-Updater)'
            ],
            en: [
              'Dynamic version and update status widget in site header and desktop login header',
              'Dynamic synchronization of download links for macOS (DMG) and Windows (EXE)',
              'Enhanced background update checking and auto-download mechanism'
            ]
          },
          downloadUrl: `https://github.com/brandyar/SizeGrid/releases/tag/v${APP_VERSION}`,
          minimum_version: '1.0.0',
          isMandatory: false
        };
      }

      const hasNewVersion = this.compareVersions(this.state.currentVersion, remoteRelease.version) > 0;
      this.addLog('info', 'manifest', `Version evaluation: Current=v${this.state.currentVersion} vs Remote=v${remoteRelease.version} -> HasNewVersion=${hasNewVersion}`);

      this.state.lastCheckedTime = Date.now();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tankhor_last_update_check', this.state.lastCheckedTime.toString());
        if (remoteRelease) {
          localStorage.setItem('tankhor_cached_update_release', JSON.stringify(remoteRelease));
        }
      }

      if (hasNewVersion) {
        this.state.status = 'update_available';
        this.state.latestRelease = remoteRelease;
        if (isStartupCheck || remoteRelease.isMandatory) {
          this.state.showStartupModal = true;
        }
      } else {
        this.state.status = 'up_to_date';
        this.state.latestRelease = remoteRelease;
      }

      this.notifyListeners();
      return this.getState();

    } catch (err: any) {
      this.addLog('error', 'network', `Check for updates failed: ${err?.message || err}`, err);
      this.state.status = 'error';
      this.state.errorMessage = err?.message || 'برقراری ارتباط با سرور بروزرسانی برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید.';
      this.notifyListeners();
      return this.getState();
    }
  }

  /**
   * Relaunch the application after installation
   */
  public async relaunchApp(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.addLog('info', 'install', 'Initiating application relaunch...');

    if (this.isTauriDesktop()) {
      try {
        const tauriModules = await getTauriModules((lvl, cat, msg, d) => this.addLog(lvl, cat, msg, d));
        if (tauriModules?.process?.relaunch) {
          this.addLog('info', 'tauri-ipc', 'Invoking tauriModules.process.relaunch()');
          await tauriModules.process.relaunch();
          return;
        }
        const tauriWindow = window as any;
        if (tauriWindow.__TAURI__?.process?.relaunch) {
          this.addLog('info', 'tauri-ipc', 'Invoking window.__TAURI__.process.relaunch()');
          await tauriWindow.__TAURI__.process.relaunch();
          return;
        }
        if (tauriWindow.__TAURI__?.relaunch) {
          this.addLog('info', 'tauri-ipc', 'Invoking window.__TAURI__.relaunch()');
          await tauriWindow.__TAURI__.relaunch();
          return;
        }
      } catch (rErr: any) {
        this.addLog('warn', 'tauri-ipc', `Native Tauri relaunch failed: ${rErr?.message || rErr}`, rErr);
      }
    }

    // Web browser fallback
    this.addLog('info', 'install', 'Reloading browser window as fallback...');
    window.location.reload();
  }

  /**
   * Download and install the available update in the background
   */
  public async downloadAndInstallUpdate(): Promise<void> {
    if (!this.state.latestRelease) {
      this.addLog('warn', 'download', 'Cannot download update: latestRelease is null');
      return;
    }

    this.addLog('info', 'download', `Initiating download and installation for v${this.state.latestRelease.version}...`, {
      isDesktop: this.isTauriDesktop(),
      hasHandle: !!this.activeTauriUpdateHandle,
    });

    this.state.status = 'downloading';
    this.state.downloadProgress = 10;
    this.state.errorMessage = null;
    this.notifyListeners();

    try {
      const tauriModules = await getTauriModules((lvl, cat, msg, d) => this.addLog(lvl, cat, msg, d));
      let installedViaNativeUpdater = false;

      if (this.isTauriDesktop()) {
        // A. Listen to native updater events for live download progress
        if (tauriModules?.updater?.onUpdaterEvent) {
          try {
            if (this.unlistenUpdaterEvents) {
              this.unlistenUpdaterEvents();
              this.unlistenUpdaterEvents = null;
            }
            this.addLog('info', 'tauri-ipc', 'Registering native updater event listener onUpdaterEvent()...');
            this.unlistenUpdaterEvents = await tauriModules.updater.onUpdaterEvent((statusEvent: any) => {
              const statusStr = String(statusEvent?.status || statusEvent || '');
              this.addLog('info', 'tauri-ipc', `Native updater event received: ${statusStr}`, statusEvent);

              if (statusStr === 'PENDING') {
                this.state.status = 'downloading';
                this.state.downloadProgress = 20;
                this.notifyListeners();
              } else if (statusStr === 'DOWNLOADING') {
                this.state.status = 'downloading';
                this.state.downloadProgress = Math.min(92, Math.max(30, this.state.downloadProgress + 15));
                this.notifyListeners();
              } else if (statusStr === 'DOWNLOADED') {
                this.state.status = 'ready_to_install';
                this.state.downloadProgress = 100;
                this.addLog('success', 'download', 'Native update binary downloaded and verified by Tauri!');
                this.notifyListeners();
              } else if (statusStr === 'DONE') {
                this.state.status = 'ready_to_install';
                this.state.downloadProgress = 100;
                this.addLog('success', 'install', 'Native update binary installation finished (DONE)');
                this.notifyListeners();
              } else if (statusStr === 'ERROR') {
                this.state.status = 'error';
                const errDetail = statusEvent?.error || 'خطا در دانلود خودکار فایل';
                this.state.errorMessage = errDetail;
                this.addLog('error', 'tauri-ipc', `Native updater event reported error: ${errDetail}`, statusEvent);
                this.notifyListeners();
              }
            });
          } catch (listenerErr: any) {
            this.addLog('warn', 'tauri-ipc', `Could not register onUpdaterEvent listener: ${listenerErr?.message || listenerErr}`, listenerErr);
          }
        }

        // B. If active Tauri update handle is missing, try a quick checkUpdate() to acquire handle now
        if (!this.activeTauriUpdateHandle && tauriModules?.updater?.checkUpdate) {
          try {
            this.addLog('info', 'tauri-ipc', 'Active Tauri update handle is missing. Attempting checkUpdate() to acquire fresh update handle...');
            const freshUpdate = await tauriModules.updater.checkUpdate();
            if (freshUpdate?.shouldUpdate) {
              this.activeTauriUpdateHandle = freshUpdate;
              this.addLog('success', 'tauri-ipc', 'Acquired fresh native update handle from Tauri updater successfully!');
            } else {
              this.addLog('warn', 'tauri-ipc', 'Fresh checkUpdate() returned shouldUpdate=false or null handle');
            }
          } catch (freshErr: any) {
            this.addLog('warn', 'tauri-ipc', `checkUpdate() on-the-fly acquisition failed: ${freshErr?.message || freshErr}`, freshErr);
          }
        }

        // C. If active Tauri update handle exists from native check()
        if (this.activeTauriUpdateHandle) {
          try {
            this.addLog('info', 'download', 'Found active native update handle. Calling downloadAndInstall()...');
            if (typeof this.activeTauriUpdateHandle.downloadAndInstall === 'function') {
              await this.activeTauriUpdateHandle.downloadAndInstall((event: any) => {
                this.addLog('debug', 'download', 'Download progress chunk received', event);
                if (event?.event === 'Progress' && event?.data?.chunkLength) {
                  this.state.downloadProgress = Math.min(95, this.state.downloadProgress + 10);
                  this.notifyListeners();
                } else if (typeof event === 'number') {
                  this.state.downloadProgress = Math.min(99, event);
                  this.notifyListeners();
                }
              });
              installedViaNativeUpdater = true;
              this.addLog('success', 'install', 'activeTauriUpdateHandle.downloadAndInstall() completed successfully!');
            } else if (typeof this.activeTauriUpdateHandle.download === 'function') {
              this.addLog('info', 'download', 'Calling activeTauriUpdateHandle.download()...');
              await this.activeTauriUpdateHandle.download((progress: number) => {
                this.state.downloadProgress = progress || 50;
                this.notifyListeners();
              });
              if (typeof this.activeTauriUpdateHandle.install === 'function') {
                this.addLog('info', 'install', 'Calling activeTauriUpdateHandle.install()...');
                await this.activeTauriUpdateHandle.install();
                installedViaNativeUpdater = true;
                this.addLog('success', 'install', 'activeTauriUpdateHandle.install() completed successfully!');
              }
            }
          } catch (tErr: any) {
            this.addLog('error', 'tauri-ipc', `Native update handle download/install execution error: ${tErr?.message || tErr}`, {
              error: tErr?.message || String(tErr),
              stack: tErr?.stack,
            });
          }
        }

        // D. Global updater installUpdate() fallback
        if (!installedViaNativeUpdater && tauriModules?.updater?.installUpdate) {
          try {
            this.addLog('info', 'tauri-ipc', 'Attempting global tauriModules.updater.installUpdate() fallback...');
            await tauriModules.updater.installUpdate();
            installedViaNativeUpdater = true;
            this.addLog('success', 'install', 'Global tauriModules.updater.installUpdate() succeeded!');
          } catch (upErr: any) {
            this.addLog('warn', 'tauri-ipc', `Global Tauri installUpdate failed: ${upErr?.message || upErr}`, upErr);
          }
        }

        if (installedViaNativeUpdater) {
          this.state.downloadProgress = 100;
          this.state.status = 'ready_to_install';
          this.addLog('success', 'install', 'Background update completed successfully! Scheduling auto-relaunch in 1.5s...');
          this.notifyListeners();

          // Auto relaunch after 1.5 seconds or let user click restart button
          setTimeout(async () => {
            await this.relaunchApp();
          }, 1500);
          return;
        }
      }

      // E. Fallback for Web browser or environments where native updater was skipped/failed
      const targetUrl = this.state.latestRelease.downloadUrl || `https://github.com/brandyar/SizeGrid/releases/tag/v${this.state.latestRelease.version}`;
      this.addLog('warn', 'download', `Background native update could not proceed (Native handle unavailable or verification failed). Fallback: Opening direct release/download URL in browser: ${targetUrl}`, {
        isTauriDesktop: this.isTauriDesktop(),
        hasTauriModules: !!tauriModules?.updater,
        hasUpdateHandle: !!this.activeTauriUpdateHandle,
      });

      const tauriWindow = typeof window !== 'undefined' ? (window as any) : null;

      if (tauriWindow) {
        if (tauriWindow.__TAURI__?.shell?.open) {
          this.addLog('info', 'tauri-ipc', 'Opening download URL via window.__TAURI__.shell.open');
          await tauriWindow.__TAURI__.shell.open(targetUrl);
        } else if (tauriWindow.__TAURI_PLUGIN_SHELL__?.open) {
          this.addLog('info', 'tauri-ipc', 'Opening download URL via window.__TAURI_PLUGIN_SHELL__.open');
          await tauriWindow.__TAURI_PLUGIN_SHELL__.open(targetUrl);
        } else if (typeof window !== 'undefined') {
          this.addLog('info', 'env', 'Opening download URL via window.open');
          window.open(targetUrl, '_blank');
        }
      } else if (typeof window !== 'undefined') {
        window.open(targetUrl, '_blank');
      }

      this.state.downloadProgress = 100;
      this.state.status = 'update_available';
      this.state.errorMessage = 'دانلود فایل نصب جدید (DMG/EXE) آغاز شد. پس از پایان دانلود، فایل را جهت نصب اجرا نمایید (به دلیل عدم تایید امضای بومی Minisign یا نبود هندل نیتیو، آپدیت در پس‌زمینه انجام نشد).';
      this.notifyListeners();

    } catch (err: any) {
      this.addLog('error', 'download', `Download update fatal exception: ${err?.message || err}`, err);
      this.state.status = 'error';
      this.state.errorMessage = err?.message || 'خطا در دریافت فایل بروزرسانی. لطفاً مستقیم از گیتهاب دریافت نمایید.';
      this.notifyListeners();
    }
  }
}

export const updateService = new AppUpdateService();

