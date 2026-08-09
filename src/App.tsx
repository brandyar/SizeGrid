import React, { useState, useEffect } from 'react';
import { RouterProvider, Route } from './components/Router';
import LandingPage from './components/LandingPage';
import DesktopLogin from './components/DesktopLogin';
import Dashboard from './components/Dashboard';
import Storefront from './components/Storefront';
import { UpdateModal } from './components/UpdateModal';
import { I18nProvider, useTranslation } from './i18n';
import { isDesktopEnv } from './utils/desktop';

function AppContent() {
  const { lang, setLang } = useTranslation();
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Detect native desktop application runtime (Tauri / Electron / Windows WebView2 / macOS WKWebView)
  const isDesktop = isDesktopEnv();

  // Synchronize dark class on document element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.backgroundColor = '#0a0a0a';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f9f9f9';
    }
  }, [darkMode]);

  return (
    <RouterProvider>
      {/* Global Startup Update Modal Popup */}
      <UpdateModal />

      {/* 1. Root Route: Landing Page on Web, Modern Login Screen on Desktop */}
      <Route 
        pattern="/" 
        element={
          isDesktop ? (
            <DesktopLogin 
              lang={lang} 
              setLang={setLang} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
            />
          ) : (
            <LandingPage 
              lang={lang} 
              setLang={setLang} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
            />
          )
        } 
      />

      {/* 2. Direct Login Route */}
      <Route 
        pattern="/login" 
        element={
          <DesktopLogin 
            lang={lang} 
            setLang={setLang} 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
          />
        } 
      />

      {/* 3. Merchant Dashboard Subrouting */}
      <Route 
        pattern="/dashboard/*" 
        element={
          <Dashboard 
            lang={lang} 
            setLang={setLang} 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
          />
        } 
      />

      {/* 4. Customer Storefront Route */}
      <Route 
        pattern="/shop/:shop_slug/product/:product_id" 
        element={
          <Storefront 
            lang={lang} 
            setLang={setLang} 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
          />
        } 
      />
    </RouterProvider>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
