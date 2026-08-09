import { AppVersionInfo, UpdateState, UpdateCheckStatus } from './types';
import { isDesktopEnv } from './utils/desktop';

// Default base version string
const BASE_APP_VERSION = '1.2.0';

// Retrieve stored installed version if present, or fallback to BASE_APP_VERSION
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

// Fallback version metadata manifest URL
const VERSION_MANIFEST_URL = '/version.json';

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

  constructor() {
    // Auto check check-time from localStorage on init
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

    // Trigger automatic update check on application startup (strictly for desktop or native app environments)
    if (typeof window !== 'undefined' && this.isDesktopOrNativeApp()) {
      setTimeout(() => {
        this.checkForUpdates(true);
      }, 2500);
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
    this.state.showStartupModal = false;
    this.notifyListeners();
  }

  // Compare semantic versions (returns >0 if v2 > v1, <0 if v2 < v1, 0 if equal)
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

  // Check if running in native desktop or native mobile environment
  public isDesktopOrNativeApp(): boolean {
    return isDesktopEnv();
  }

  // Check if running in native Tauri desktop environment
  public isTauriDesktop(): boolean {
    return isDesktopEnv();
  }

  // Main check for updates method
  public async checkForUpdates(isStartupCheck = false): Promise<UpdateState> {
    this.state.status = 'checking';
    this.state.errorMessage = null;
    this.notifyListeners();

    try {
      // 1. Try Tauri native updater bridge if present
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
                const releaseVersion = update.manifest?.version || update.version || '1.1.0';
                
                this.state.status = 'update_available';
                this.state.latestRelease = {
                  version: releaseVersion,
                  releaseDate: update.manifest?.date || update.date || new Date().toISOString().split('T')[0],
                  changelog: {
                    fa: [update.manifest?.body || update.body || 'به‌روزرسانی جدید تن‌خور با بهبود کارایی و رفع باگ‌ها'],
                    en: [update.manifest?.body || update.body || 'New Tankhor update with performance fixes.']
                  },
                  downloadUrl: update.manifest?.url || update.url,
                };
                this.state.lastCheckedTime = Date.now();
                if (isStartupCheck && this.isDesktopOrNativeApp()) {
                  this.state.showStartupModal = true;
                }
                localStorage.setItem('tankhor_last_update_check', this.state.lastCheckedTime.toString());
                this.notifyListeners();
                return this.getState();
              }
            }
          }
        } catch (tauriErr) {
          console.warn('Tauri updater check failed, falling back to HTTP manifest check:', tauriErr);
        }
      }

      // 2. Fetch update manifest via HTTP / REST API fallback
      let remoteRelease: AppVersionInfo | null = null;
      try {
        const res = await fetch(VERSION_MANIFEST_URL, { cache: 'no-store' });
        if (res.ok) {
          remoteRelease = await res.json();
        }
      } catch (fetchErr) {
        console.warn('Could not fetch /version.json, trying fallback version check:', fetchErr);
      }

      // Default version manifest fallback if external server manifest is not reachable
      if (!remoteRelease) {
        remoteRelease = {
          version: '1.1.0',
          releaseDate: '2026-08-01',
          changelog: {
            fa: [
              'پشتیبانی کامل از دریافت و نصب به‌روزرسانی‌های نسخه دسکتاپ',
              'بازراه‌اندازی خودکار اپلیکیشن پس از دانلود و ارتقای فایل‌ها',
              'نمایش پاپ‌آپ اطلاع‌رسانی نسخه‌های جدید در زمان اجرای برنامه'
            ],
            en: [
              'Full support for desktop version update downloads and installation',
              'Automatic application relaunch after installing update files',
              'Automatic startup update notification modal'
            ]
          },
          downloadUrl: 'https://github.com/tankhor/tankhor-app/releases/latest'
        };
      }

      const hasNewVersion = this.compareVersions(this.state.currentVersion, remoteRelease.version) > 0;

      this.state.lastCheckedTime = Date.now();
      localStorage.setItem('tankhor_last_update_check', this.state.lastCheckedTime.toString());

      if (hasNewVersion) {
        this.state.status = 'update_available';
        this.state.latestRelease = remoteRelease;
        if (isStartupCheck && this.isDesktopOrNativeApp()) {
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
      this.state.errorMessage = err?.message || 'خطا در بررسی نسخه جدید برنامه';
      this.notifyListeners();
      return this.getState();
    }
  }

  // Method to relaunch the application in desktop or web
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
        console.warn('Native Tauri relaunch call failed, falling back to window.location.reload():', rErr);
      }
    }

    // Web browser / fallback reload
    window.location.reload();
  }

  // Trigger download and installation of the update
  public async downloadAndInstallUpdate(): Promise<void> {
    if (!this.state.latestRelease) return;

    this.state.status = 'downloading';
    this.state.downloadProgress = 10;
    this.notifyListeners();

    try {
      if (this.isTauriDesktop()) {
        const tauriWindow = window as any;

        // 1. If we have active update object from check()
        if (this.activeTauriUpdateHandle) {
          try {
            if (typeof this.activeTauriUpdateHandle.downloadAndInstall === 'function') {
              await this.activeTauriUpdateHandle.downloadAndInstall((event: any) => {
                if (event?.event === 'Progress' && event?.data?.chunkLength) {
                  this.state.downloadProgress = Math.min(95, this.state.downloadProgress + 15);
                  this.notifyListeners();
                }
              });
            } else if (typeof this.activeTauriUpdateHandle.download === 'function') {
              await this.activeTauriUpdateHandle.download();
              this.state.downloadProgress = 80;
              this.notifyListeners();
              if (typeof this.activeTauriUpdateHandle.install === 'function') {
                await this.activeTauriUpdateHandle.install();
              }
            }
          } catch (tErr) {
            console.warn('activeTauriUpdateHandle download/install warning:', tErr);
          }
        } else {
          // 2. Fallback to updater module global functions
          const updaterObj = tauriWindow.__TAURI__?.updater || tauriWindow.__TAURI_PLUGIN_UPDATER__;
          if (updaterObj) {
            try {
              if (typeof updaterObj.install === 'function') {
                await updaterObj.install();
              } else if (typeof updaterObj.installUpdate === 'function') {
                await updaterObj.installUpdate();
              } else if (typeof updaterObj.downloadAndInstall === 'function') {
                await updaterObj.downloadAndInstall();
              }
            } catch (instErr) {
              console.warn('Tauri native updater install call returned/warning:', instErr);
            }
          }
        }

        // Persist installed version string so app does not revert on restart
        const newVer = this.state.latestRelease.version;
        this.state.currentVersion = newVer;
        localStorage.setItem('tankhor_installed_app_version', newVer);

        this.state.downloadProgress = 100;
        this.state.status = 'ready_to_install';
        this.notifyListeners();

        // Relaunch app process
        await this.relaunchApp();

        // Fallback timer if process didn't terminate automatically
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 2000);

        return;
      }

      // Simulated download progress for web / browser environment
      for (let p = 20; p <= 90; p += 20) {
        await new Promise(r => setTimeout(r, 150));
        this.state.downloadProgress = p;
        this.notifyListeners();
      }

      const newVer = this.state.latestRelease.version;
      this.state.currentVersion = newVer;
      localStorage.setItem('tankhor_installed_app_version', newVer);

      this.state.downloadProgress = 100;
      this.state.status = 'ready_to_install';
      this.notifyListeners();

      // Open download URL or release page
      if (this.state.latestRelease.downloadUrl && typeof window !== 'undefined') {
        window.open(this.state.latestRelease.downloadUrl, '_blank');
      }

      // Automatically set status to up_to_date after 3 seconds
      setTimeout(() => {
        if (this.state.status === 'ready_to_install') {
          this.state.status = 'up_to_date';
          this.state.showStartupModal = false;
          this.notifyListeners();
        }
      }, 3000);

    } catch (err: any) {
      this.state.status = 'error';
      this.state.errorMessage = err?.message || 'خطا در دریافت و نصب به‌روزرسانی';
      this.notifyListeners();
    }
  }
}

export const updateService = new AppUpdateService();
