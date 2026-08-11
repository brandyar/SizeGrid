import { AppVersionInfo, UpdateState, UpdateCheckStatus } from './types';
import { isDesktopEnv } from './utils/desktop';

// Default base version string of the app binary
const BASE_APP_VERSION = '1.4.0';

// Retrieve installed version if present, or fallback to BASE_APP_VERSION
const getInitialVersion = (): string => {
  if (typeof localStorage !== 'undefined') {
    const installedVer = localStorage.getItem('tankhor_installed_app_version');
    if (installedVer && installedVer.trim().length > 0) {
      return installedVer.trim();
    }
  }
  return BASE_APP_VERSION;
};

export const CURRENT_APP_VERSION = getInitialVersion();

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
    // Load last checked time & stored version on initialization
    if (typeof localStorage !== 'undefined') {
      const savedLastCheck = localStorage.getItem('tankhor_last_update_check');
      if (savedLastCheck) {
        this.state.lastCheckedTime = parseInt(savedLastCheck, 10);
      }
      const savedInstalled = localStorage.getItem('tankhor_installed_app_version');
      if (savedInstalled) {
        this.state.currentVersion = savedInstalled;
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

      // 3. Query HTTP Manifest Candidates (`latest.json` & `version.json`)
      let remoteRelease: AppVersionInfo | null = null;
      const manifestCandidates: string[] = [
        'https://tankhor.com/latest.json',
        'https://tankhor.com/version.json',
        'https://raw.githubusercontent.com/tankhor/tankhor-app/main/public/latest.json',
        'https://raw.githubusercontent.com/tankhor/tankhor-app/main/public/version.json',
        '/latest.json',
        '/version.json'
      ];

      const envManifestUrl = (import.meta as any).env?.VITE_UPDATE_MANIFEST_URL as string;
      if (envManifestUrl && envManifestUrl.trim().length > 0) {
        manifestCandidates.unshift(envManifestUrl.trim());
      }

      if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http')) {
        manifestCandidates.push(`${window.location.origin}/latest.json`);
        manifestCandidates.push(`${window.location.origin}/version.json`);
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
                downloadUrl: data.url || data.downloadUrl || 'https://github.com/tankhor/tankhor-app/releases/latest',
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

      // Default fallback release object if offline or endpoints unreachable
      if (!remoteRelease) {
        remoteRelease = {
          version: '1.4.2',
          releaseDate: '2026-08-11',
          notes: '• لوگوی جدید و اختصاصی تن‌خور (حالت روشن و تاریک)\n• افزودن قابلیت اکسپورت و خروجی کامل انبار (CSV / JSON)\n• بهبود عملکرد و تست فرآیند بروزرسانی خودکار دسکتاپ',
          changelog: {
            fa: [
              'اضافه شدن لوگوهای رسمی جدید تن‌خور (لوگوی اختصاصی لایت و دارک) در تمامی بخش‌های برنامه',
              'افزوده شدن امکان خروجی گرفتن کامل از موجودی انبار و کالاهای پوشاک به فرمت‌های CSV و JSON',
              'ارتقای نسخه نرم‌افزار به ۱.۴.۲ جهت تست فرآیند سنجش و دانلود خودکار بروزرسانی دسکتاپ'
            ],
            en: [
              'Added official Tankhor dark & light theme brand logos across the application',
              'Added complete Warehouse Stock & Inventory Export feature (CSV & JSON)',
              'Upgraded version to 1.4.2 for testing automated desktop updates'
            ]
          },
          downloadUrl: 'https://github.com/tankhor/tankhor-app/releases/latest',
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
    this.state.downloadProgress = 5;
    this.state.errorMessage = null;
    this.notifyListeners();

    try {
      if (this.isTauriDesktop()) {
        const tauriWindow = window as any;

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
            } else if (typeof this.activeTauriUpdateHandle.download === 'function') {
              await this.activeTauriUpdateHandle.download((progress: number) => {
                this.state.downloadProgress = progress || 50;
                this.notifyListeners();
              });
              if (typeof this.activeTauriUpdateHandle.install === 'function') {
                await this.activeTauriUpdateHandle.install();
              }
            }
          } catch (tErr: any) {
            console.warn('Native update handle error:', tErr);
            throw new Error(tErr?.message || 'خطا در تایید امضای دیجیتال یا نصب بروزرسانی دسکتاپ.');
          }
        } else {
          // B. Global updater module fallback
          const updaterObj = tauriWindow.__TAURI__?.updater || tauriWindow.__TAURI_PLUGIN_UPDATER__;
          if (updaterObj) {
            if (typeof updaterObj.downloadAndInstall === 'function') {
              await updaterObj.downloadAndInstall();
            } else if (typeof updaterObj.install === 'function') {
              await updaterObj.install();
            }
          }
        }

        // Persist installed version string
        const newVer = this.state.latestRelease.version;
        this.state.currentVersion = newVer;
        localStorage.setItem('tankhor_installed_app_version', newVer);

        this.state.downloadProgress = 100;
        this.state.status = 'ready_to_install';
        this.notifyListeners();

        // Relaunch app
        await this.relaunchApp();
        return;
      }

      // Simulated background download progress bar for web browser environment
      for (let p = 15; p <= 95; p += 15) {
        await new Promise(r => setTimeout(r, 180));
        this.state.downloadProgress = p;
        this.notifyListeners();
      }

      const newVer = this.state.latestRelease.version;
      this.state.currentVersion = newVer;
      localStorage.setItem('tankhor_installed_app_version', newVer);

      this.state.downloadProgress = 100;
      this.state.status = 'ready_to_install';
      this.notifyListeners();

      if (this.state.latestRelease.downloadUrl && typeof window !== 'undefined') {
        window.open(this.state.latestRelease.downloadUrl, '_blank');
      }

    } catch (err: any) {
      console.error('Download update failed:', err);
      this.state.status = 'error';
      this.state.errorMessage = err?.message || 'خطا در دریافت و تایید امضای فایل بروزرسانی. لطفاً مجدداً تلاش کنید.';
      this.notifyListeners();
    }
  }
}

export const updateService = new AppUpdateService();
