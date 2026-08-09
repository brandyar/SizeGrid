/**
 * Unified Desktop & Tauri Environment Detection Utility for Tankhor
 * Works across Windows (WebView2), macOS (WKWebView), Linux (WebKitGTK),
 * Tauri v1, Tauri v2, custom protocol schemes, and development queries.
 */

export const isDesktopEnv = (): boolean => {
  if (typeof window === 'undefined') return false;

  const win = window as any;

  // 1. Direct Tauri global objects & internal IPC hooks (Tauri v1 & v2)
  const isTauriGlobal =
    '__TAURI__' in win ||
    '__TAURI_INTERNALS__' in win ||
    '__TAURI_METADATA__' in win ||
    '__TAURI_IPC__' in win ||
    '__TAURI_INVOKE__' in win ||
    '__TAURI_POST_MESSAGE__' in win ||
    win.isTauri === true;

  // 2. Protocols and Origins used by Tauri on Windows / Mac / Linux
  const isTauriProtocol =
    window.location.protocol === 'tauri:' ||
    window.location.protocol === 'asset:' ||
    window.location.hostname === 'tauri.localhost' ||
    window.location.origin.includes('tauri.localhost') ||
    (window.location.hostname === 'localhost' && window.location.port === '1420');

  // 3. UserAgent checks (Windows WebView2 / Tauri UA)
  const userAgent = (navigator.userAgent || '').toLowerCase();
  const isTauriUA = userAgent.includes('tauri');
  const isWindowsWebView2Native =
    userAgent.includes('webview2') &&
    !window.location.hostname.includes('ais-dev') &&
    !window.location.hostname.includes('ais-pre') &&
    !window.location.hostname.includes('cloud.run');

  // 4. Other desktop shells & explicit query parameters
  const isElectron = 'electron' in win || userAgent.includes('electron');
  const isCapacitor = 'Capacitor' in win;
  const isDesktopQuery =
    window.location.search.includes('desktop=true') ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('tankhor_force_desktop') === 'true');

  return (
    isTauriGlobal ||
    isTauriProtocol ||
    isTauriUA ||
    isWindowsWebView2Native ||
    isElectron ||
    isCapacitor ||
    isDesktopQuery
  );
};

export const isTauriDesktop = (): boolean => {
  return isDesktopEnv();
};

export const getTauriGlobal = (): any => {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  return win.__TAURI__ || win.__TAURI_INTERNALS__ || win.__TAURI_IPC__ || null;
};
