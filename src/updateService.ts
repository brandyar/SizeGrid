import { AppVersionInfo, UpdateState, UpdateCheckStatus } from './types';
import { isDesktopEnv } from './utils/desktop';

// Default base version string of the app binary
const BASE_APP_VERSION = '1.4.5';

export const CURRENT_APP_VERSION = BASE_APP_VERSION;

class AppUpdateService {
  private state: UpdateState = {
    currentVersion: CURRENT_APP_VERSION,
    status: 'idle',
    latestRelease: null,
    downloadProgress: 0,
    errorMessage: null,
    lastCheckedTime: null,
    showStartupModal: false,
  };

  private listeners: Array<(state: UpdateState) => void> = [];
  private activeTauriUpdateHandle: any = null;
  private autoCheckTimer: any = null;

  constructor() {
    // Load last checked time on initialization & clean legacy fake version overrides
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tankhor_installed_app_version');
      const savedLastCheck = localStorage.getItem('tankhor_last_update_check');
      if (savedLastCheck) {
        this.state.lastCheckedTime = parseInt(savedLastCheck, 10);
      }
    }

    // Trigger non-blocking automatic update check on application startup
    if (typeof window !== 'undefined' && this.isDesktopOrNativeApp()) {
      setTimeout(() => {
        this.checkForUpdates(true);
      }, 2000);

      // Periodic check every 4 hours
      this.autoCheckTimer = setInterval(() => {
        this.checkForUpdates(true);
      }, 4 * 60 * 60 * 1000);
    }
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
   */
  public async checkForUpdates(isStartupCheck = false): Promise<UpdateState> {
    this.state.status = 'checking';
    this.state.errorMessage = null;
    this.notifyListeners();

    try {
      // 1. Query native app version from Tauri IPC bridge if available
      if (this.isTauriDesktop()) {
        try {
          const tauriWindow = window as any;
          const appObj = tauriWindow.__TAURI__?.app || tauriWindow.__TAURI_PLUGIN_APP__;
          if (appObj && typeof appObj.getVersion === 'function') {
            const nativeVersion = await appObj.getVersion();
            if (nativeVersion && typeof nativeVersion === 'string') {
              this.state.currentVersion = nativeVersion.trim();
            }
          }
        } catch (verErr) {
          console.warn('Native Tauri getVersion query warning:', verErr);
        }
      }

      // 2. Query official Tauri Updater native bridge first
      if (this.isTauriDesktop()) {
        try {
          const tauriWindow = window as any;
          const updaterModule = tauriWindow.__TAURI__?.updater || tauriWindow.__TAURI_PLUGIN_UPDATER__;
          if (updaterModule) {
            const checkFn = updaterModule.check || updaterModule.checkUpdate;
            if (typeof checkFn === 'function') {
              const update = await checkFn();
              if (update?.shouldUpdate || update?.available) {
                this.activeTauriUpdateHandle = update;
                const releaseVersion = update.manifest?.version || update.version || '1.4.1';
                const minVer = update.manifest?.minimum_version || update.manifest?.minSupportedVersion || '1.0.0';
                const isMandatory = this.compareVersions(this.state.currentVersion, minVer) > 0;

                this.state.status = 'update_available';
                this.state.latestRelease = {
                  version: releaseVersion,
                  releaseDate: update.manifest?.pub_date || update.manifest?.date || new Date().toISOString().split('T')[0],
                  notes: update.manifest?.notes || update.body || 'به‌روزرسانی جدید تن‌خور دسکتاپ',
                  changelog: {
                    fa: [update.manifest?.notes || update.body || 'افزوده شدن قابلیت‌های جدید و ارتقای کارایی'],
                    en: [update.manifest?.notes || update.body || 'New features and bug fixes added.']
                  },
                  downloadUrl: update.manifest?.url || update.url,
                  minimum_version: minVer,
                  isMandatory,
                };

                this.state.lastCheckedTime = Date.now();
                if (isStartupCheck || isMandatory) {
                  this.state.showStartupModal = true;
                }
                localStorage.setItem('tankhor_last_update_check', this.state.lastCheckedTime.toString());
                this.notifyListeners();
                return this.getState();
              }
            }
          }
        } catch (tauriErr) {
          console.warn('Tauri native updater check failed, falling back to HTTP endpoints:', tauriErr);
        }
      }

      // 3. Query Official GitHub Releases API & HTTP Manifest Candidates
      let remoteRelease: AppVersionInfo | null = null;

      // 3A. Direct query to GitHub Releases API for brandyar/SizeGrid
      try {
        const ghRes = await fetch('https://api.github.com/repos/brandyar/SizeGrid/releases/latest', {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
          cache: 'no-store'
        });
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
          }
        }
      } catch (ghErr) {
        console.warn('GitHub Releases API query failed, falling back to raw manifests:', ghErr);
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
                  downloadUrl: data.url || data.downloadUrl || 'https://github.com/brandyar/SizeGrid/releases/tag/v1.4.3',
                  minimum_version: minVer,
                  isMandatory
                };
                break;
              }
            }
          } catch (fetchErr) {
            console.warn(`Could not fetch update manifest from ${baseUrl}:`, fetchErr);
          }
        }
      }

      // Default fallback release object if offline or endpoints unreachable
      if (!remoteRelease) {
        remoteRelease = {
          version: '1.4.3',
          releaseDate: '2026-08-12',
          notes: '• همگام‌سازی کامل فایل‌های قفل و وابستگی‌ها\n• ارتقای دیتابیس بومی SQLite و بهبود پایداری در حالت آفلاین\n• بروزرسانی نسخه برنامه دسکتاپ به ۱.۴.۳',
          changelog: {
            fa: [
              'همگام‌سازی کامل فایل‌های قفل و وابستگی‌های پکیج‌ها (package-lock.json) جهت بهبود فرآیند دیپلوی',
              'ارتقای عملکرد دیتابیس بومی SQLite برای ذخیره‌سازی آفلاین و مطمئن اطلاعات در سیستم‌عامل‌های ویندوز و مک',
              'ارتقای نسخه نرم‌افزار به ۱.۴.۳ جهت سنجش دریافت بروزرسانی خودکار دسکتاپ'
            ],
            en: [
              'Synchronized package-lock.json dependencies for seamless multi-platform deployments',
              'Enhanced native SQLite storage adapter for robust offline data persistence on Windows & macOS',
              'Upgraded desktop application version to 1.4.3 to verify automated updates'
            ]
          },
          downloadUrl: 'https://github.com/brandyar/SizeGrid/releases/tag/v1.4.3',
          minimum_version: '1.0.0',
          isMandatory: false
        };
      }

      const hasNewVersion = this.compareVersions(this.state.currentVersion, remoteRelease.version) > 0;

      this.state.lastCheckedTime = Date.now();
      localStorage.setItem('tankhor_last_update_check', this.state.lastCheckedTime.toString());

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
      console.error('Check for updates failed:', err);
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
    const tauriWindow = window as any;

    if (this.isTauriDesktop() && tauriWindow.__TAURI__) {
      try {
        if (tauriWindow.__TAURI__?.process?.relaunch) {
          await tauriWindow.__TAURI__.process.relaunch();
          return;
        }
        if (tauriWindow.__TAURI__?.updater?.relaunch) {
          await tauriWindow.__TAURI__.updater.relaunch();
          return;
        }
        if (tauriWindow.__TAURI__?.relaunch) {
          await tauriWindow.__TAURI__.relaunch();
          return;
        }
        if (tauriWindow.__TAURI__?.core?.invoke) {
          await tauriWindow.__TAURI__.core.invoke('plugin:process|relaunch');
          return;
        }
      } catch (rErr) {
        console.warn('Native Tauri relaunch failed, reloading location:', rErr);
      }
    }

    // Web browser fallback
    window.location.reload();
  }

  /**
   * Download and install the available update
   */
  public async downloadAndInstallUpdate(): Promise<void> {
    if (!this.state.latestRelease) return;

    this.state.status = 'downloading';
    this.state.downloadProgress = 10;
    this.state.errorMessage = null;
    this.notifyListeners();

    try {
      const tauriWindow = typeof window !== 'undefined' ? (window as any) : null;
      let installedViaNativeUpdater = false;

      if (this.isTauriDesktop() && tauriWindow) {
        // A. If active Tauri update handle exists from native check()
        if (this.activeTauriUpdateHandle) {
          try {
            if (typeof this.activeTauriUpdateHandle.downloadAndInstall === 'function') {
              await this.activeTauriUpdateHandle.downloadAndInstall((event: any) => {
                if (event?.event === 'Progress' && event?.data?.chunkLength) {
                  this.state.downloadProgress = Math.min(95, this.state.downloadProgress + 15);
                  this.notifyListeners();
                } else if (typeof event === 'number') {
                  this.state.downloadProgress = Math.min(99, event);
                  this.notifyListeners();
                }
              });
              installedViaNativeUpdater = true;
            } else if (typeof this.activeTauriUpdateHandle.download === 'function') {
              await this.activeTauriUpdateHandle.download((progress: number) => {
                this.state.downloadProgress = progress || 50;
                this.notifyListeners();
              });
              if (typeof this.activeTauriUpdateHandle.install === 'function') {
                await this.activeTauriUpdateHandle.install();
                installedViaNativeUpdater = true;
              }
            }
          } catch (tErr: any) {
            console.warn('Native update handle error:', tErr);
          }
        }

        // B. Global updater module fallback if not handled
        if (!installedViaNativeUpdater) {
          const updaterObj = tauriWindow.__TAURI__?.updater || tauriWindow.__TAURI_PLUGIN_UPDATER__;
          if (updaterObj) {
            try {
              if (typeof updaterObj.downloadAndInstall === 'function') {
                await updaterObj.downloadAndInstall();
                installedViaNativeUpdater = true;
              } else if (typeof updaterObj.install === 'function') {
                await updaterObj.install();
                installedViaNativeUpdater = true;
              }
            } catch (upErr) {
              console.warn('Global Tauri updater failed:', upErr);
            }
          }
        }

        if (installedViaNativeUpdater) {
          this.state.downloadProgress = 100;
          this.state.status = 'ready_to_install';
          this.notifyListeners();

          // Relaunch app
          await this.relaunchApp();
          return;
        }
      }

      // C. Fallback for manual DMG / EXE installer download (Opening direct download URL)
      const targetUrl = this.state.latestRelease.downloadUrl || 'https://github.com/brandyar/SizeGrid/releases/latest';

      if (tauriWindow) {
        if (tauriWindow.__TAURI__?.shell?.open) {
          await tauriWindow.__TAURI__.shell.open(targetUrl);
        } else if (tauriWindow.__TAURI_PLUGIN_SHELL__?.open) {
          await tauriWindow.__TAURI_PLUGIN_SHELL__.open(targetUrl);
        } else if (typeof window !== 'undefined') {
          window.open(targetUrl, '_blank');
        }
      } else if (typeof window !== 'undefined') {
        window.open(targetUrl, '_blank');
      }

      this.state.downloadProgress = 100;
      this.state.status = 'update_available';
      this.state.errorMessage = 'دانلود مستقیم فایل نصب جدید (DMG/EXE) آغاز شد. لطفاً پس از پایان دانلود، فایل را نصب نمایید.';
      this.notifyListeners();

    } catch (err: any) {
      console.error('Download update failed:', err);
      this.state.status = 'error';
      this.state.errorMessage = err?.message || 'خطا در دریافت فایل بروزرسانی. لطفاً مستقیم از گیتهاب دریافت نمایید.';
      this.notifyListeners();
    }
  }
}

export const updateService = new AppUpdateService();
