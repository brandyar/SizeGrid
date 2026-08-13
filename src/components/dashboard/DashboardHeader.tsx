import React from 'react';
import {
  Package,
  ShoppingCart,
  Warehouse,
  Barcode as BarcodeIcon,
  Ruler,
  Sliders,
  FileImage,
  Settings,
  Crown,
  Cloud,
  Info,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { AppUpdateWidget } from '../AppUpdateWidget';
import { DirectusAPI } from '../../directus';
import { SyncStats } from '../../storage';

interface DashboardHeaderProps {
  t: Record<string, string>;
  isRtl: boolean;
  darkMode: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  setIsEditingProd: (val: any) => void;
  isEditingProd: any;
  syncStats: SyncStats;
  syncingCloud: boolean;
  handleManualSync: () => void;
  activeProductsCount: number;
  lang: string;
  setLang: (lang: string) => void;
  setDarkMode: (dark: boolean) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({
  t,
  isRtl,
  darkMode,
  activeTab,
  setActiveTab,
  setIsEditingProd,
  isEditingProd,
  syncStats,
  syncingCloud,
  handleManualSync,
  activeProductsCount,
  lang,
  setLang,
  setDarkMode,
}) => {
  const subInfo = DirectusAPI.getSubscriptionInfo();

  return (
    <header className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Navigation icons */}
        <div className="md:hidden flex items-center gap-1 bg-neutral-900/30 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => { setActiveTab('products'); setIsEditingProd(null); }}
            className={`p-1.5 rounded-md ${activeTab === 'products' ? 'bg-sky-600 text-white' : 'text-neutral-400'}`}
            title={isRtl ? "کالاها" : "Products"}
          >
            <Package className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('orders'); setIsEditingProd(null); }}
            className={`p-1.5 rounded-md ${activeTab === 'orders' ? 'bg-sky-600 text-white' : 'text-neutral-400'}`}
            title={isRtl ? "سفارشات" : "Orders"}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('warehouse'); setIsEditingProd(null); }}
            className={`p-1.5 rounded-md ${activeTab === 'warehouse' ? 'bg-sky-600 text-white' : 'text-neutral-400'}`}
            title={isRtl ? "انبار" : "Warehouse"}
          >
            <Warehouse className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('barcodes'); setIsEditingProd(null); }}
            className={`p-1.5 rounded-md ${activeTab === 'barcodes' ? 'bg-sky-600 text-white' : 'text-neutral-400'}`}
            title={isRtl ? "بارکد و لیبل انبار" : "Barcodes"}
          >
            <BarcodeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('templates'); setIsEditingProd(null); }}
            className={`p-1.5 rounded-md ${activeTab === 'templates' ? 'bg-sky-600 text-white' : 'text-neutral-400'}`}
            title={isRtl ? "قالب‌های سایز" : "Size Templates"}
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('sizes'); setIsEditingProd(null); }}
            className={`p-1.5 rounded-md ${activeTab === 'sizes' ? 'bg-sky-600 text-white' : 'text-neutral-400'}`}
            title={isRtl ? "مدیریت سایزها" : "Size Management"}
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('compressor'); setIsEditingProd(null); }}
            className={`p-1.5 rounded-md ${activeTab === 'compressor' ? 'bg-sky-600 text-white' : 'text-neutral-400'}`}
            title={t.image_compressor}
          >
            <FileImage className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setIsEditingProd(null); }}
            className={`p-1.5 rounded-md ${activeTab === 'settings' ? 'bg-sky-600 text-white' : 'text-neutral-400'}`}
            title={t.store_settings}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-xs sm:text-sm font-extrabold text-neutral-400 flex items-center gap-1.5">
          <span className="hidden sm:inline">{t.brand_name}</span>
          <span className="hidden sm:inline">/</span>
          <span className="text-sky-500 font-black">
            {activeTab === 'products' ? (isEditingProd ? (isEditingProd.id === 0 ? t.add_product : t.edit_product) : (isRtl ? "کاتالوگ کالاها" : "Catalog")) : ''}
            {activeTab === 'orders' ? (isRtl ? "مدیریت سفارشات و صدور فاکتور" : "Orders & Invoice POS") : ''}
            {activeTab === 'warehouse' ? (isRtl ? "مدیریت انبار" : "Warehouse") : ''}
            {activeTab === 'barcodes' ? (isRtl ? "تولید و چاپ بارکد و اتیکت انبار" : "Barcode & Label Generator") : ''}
            {activeTab === 'templates' ? (isRtl ? "قالب‌های سایزبندی" : "Size Templates") : ''}
            {activeTab === 'sizes' ? (isRtl ? "مدیریت سایزها" : "Size Management") : ''}
            {activeTab === 'compressor' ? t.image_compressor : ''}
            {activeTab === 'settings' ? t.store_settings : ''}
          </span>
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Desktop App Update Widget Badge */}
        <AppUpdateWidget compact />

        {/* Subscription License Badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black ${
          subInfo.isPro 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
            : 'bg-neutral-800 border-neutral-700 text-neutral-400'
        }`}>
          <Crown className="w-3 h-3 text-amber-400" />
          <span>{subInfo.isPro ? 'PRO' : (isRtl ? 'دسکتاپ' : 'Desktop')}</span>
        </span>

        {/* Directus Cloud Sync Icon Button */}
        <button
          onClick={handleManualSync}
          disabled={syncingCloud}
          className={`p-2 rounded-lg border border-neutral-800 transition-all cursor-pointer relative flex items-center justify-center ${syncingCloud ? 'bg-sky-500/20 text-sky-400' : 'bg-neutral-900 text-sky-400 hover:bg-neutral-800'}`}
          title={isRtl ? "همگام‌سازی با کلود دایرکتوس" : "Sync with Directus Cloud"}
          aria-label="Cloud Sync"
        >
          <Cloud className={`w-4 h-4 ${syncingCloud ? 'animate-bounce' : ''}`} />
          {syncStats.pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-neutral-900 animate-pulse" />
          )}
        </button>

        <span className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-neutral-100 border-neutral-200 text-neutral-700'}`}>
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="whitespace-nowrap">
            {subInfo.isPro
              ? (isRtl ? `کالاها: ${activeProductsCount} (اشتراک PRO)` : `Products: ${activeProductsCount} (PRO Plan)`)
              : (isRtl ? `کالاها: ${activeProductsCount} از ۳۰ (طرح رایگان)` : `Products: ${activeProductsCount} of 30 (Free Tier)`)
            }
          </span>
        </span>

        {/* Language Controls */}
        <button
          onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
          className={`p-2 border rounded-lg flex items-center justify-center transition-all cursor-pointer ${darkMode ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'}`}
          title={lang === 'fa' ? 'English' : 'فارسی'}
          aria-label="Toggle language"
        >
          <Globe className="w-4 h-4 text-sky-400" />
        </button>

        {/* Dark/Light Switch */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 border rounded-lg transition-all ${darkMode ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'}`}
        >
          {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
        </button>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
