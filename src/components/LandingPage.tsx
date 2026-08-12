import React, { useState, useEffect } from 'react';
import { locales } from '../locales';
import { DirectusAPI } from '../directus';
import { storageManager, SyncStats } from '../storage';
import { useRouter } from './Router';
import { 
  Sparkles, 
  Grid3X3, 
  Sliders, 
  FileImage, 
  Store, 
  ChevronRight, 
  ChevronLeft,
  Sun,
  Moon,
  Globe,
  Lock,
  Mail,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Database,
  Cloud,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  PackageCheck,
  Laptop,
  Smartphone,
  RefreshCw,
  Layers,
  Ruler,
  Copy,
  Terminal,
  X,
  Download,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  lang: 'fa' | 'en';
  setLang: (lang: 'fa' | 'en') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function LandingPage({ lang, setLang, darkMode, setDarkMode }: LandingPageProps) {
  const { navigate } = useRouter();
  const t = locales[lang];
  const isRtl = lang === 'fa';

  // Auth States
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // macOS Installation Guide Modal state
  const [showMacModal, setShowMacModal] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Sync Stats State for Header/Architecture showcase
  const [syncStats, setSyncStats] = useState<SyncStats>(storageManager.getSyncStats());

  useEffect(() => {
    const unsubscribe = storageManager.subscribe((stats) => {
      setSyncStats(stats);
    });
    return () => unsubscribe();
  }, []);

  // Quick Demo Interactive States (User Measurements)
  const [demoClothingType, setDemoClothingType] = useState<'tops' | 'bottoms' | 'footwear' | 'one_piece' | 'accessories'>('tops');
  const [demoChest, setDemoChest] = useState<number>(98);
  const [demoShoulder, setDemoShoulder] = useState<number>(44);
  const [demoSleeve, setDemoSleeve] = useState<number>(62);
  const [demoClothLength, setDemoClothLength] = useState<number>(70);
  const [demoWaist, setDemoWaist] = useState<number>(84);
  const [demoHip, setDemoHip] = useState<number>(98);
  const [demoPantsLength, setDemoPantsLength] = useState<number>(102);
  const [demoFootLength, setDemoFootLength] = useState<number>(26.5);
  const [demoResult, setDemoResult] = useState('');
  const [demoFitHint, setDemoFitHint] = useState('');

  // Interactive 3-Step Wizard state for Sizing Guide
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardCalculating, setWizardCalculating] = useState<boolean>(false);

  const calculateDemoSize = () => {
    // Exact single size calculations per clothing type based on user measurements
    let bestSize = 'M';
    let hint = '';

    if (demoClothingType === 'tops') {
      if (demoChest < 88) bestSize = 'XS';
      else if (demoChest < 94) bestSize = 'S';
      else if (demoChest < 102) bestSize = 'M';
      else if (demoChest < 110) bestSize = 'L';
      else if (demoChest < 118) bestSize = 'XL';
      else if (demoChest < 126) bestSize = 'XXL';
      else bestSize = '3XL';
      hint = isRtl ? `محاسبه بر اساس دور سینه ${demoChest} cm و عرض سرشانه ${demoShoulder} cm` : `Calculated for chest ${demoChest} cm & shoulder ${demoShoulder} cm`;
    } else if (demoClothingType === 'bottoms') {
      if (demoWaist < 74) bestSize = 'S (29-30)';
      else if (demoWaist < 82) bestSize = 'M (31-32)';
      else if (demoWaist < 90) bestSize = 'L (33-34)';
      else if (demoWaist < 98) bestSize = 'XL (35-36)';
      else if (demoWaist < 108) bestSize = 'XXL (38-40)';
      else bestSize = '3XL (42+)';
      hint = isRtl ? `محاسبه بر اساس دور کمر ${demoWaist} cm و باسن ${demoHip} cm` : `Calculated for waist ${demoWaist} cm & hip ${demoHip} cm`;
    } else if (demoClothingType === 'footwear') {
      if (demoFootLength <= 23.5) bestSize = '37';
      else if (demoFootLength <= 24.2) bestSize = '38';
      else if (demoFootLength <= 25.0) bestSize = '39';
      else if (demoFootLength <= 25.8) bestSize = '40';
      else if (demoFootLength <= 26.5) bestSize = '41';
      else if (demoFootLength <= 27.2) bestSize = '42';
      else if (demoFootLength <= 28.0) bestSize = '43';
      else if (demoFootLength <= 28.8) bestSize = '44';
      else bestSize = '45';
      hint = isRtl ? `بر اساس طول پا ${demoFootLength} cm (استاندارد EU)` : `Calculated for foot length ${demoFootLength} cm (EU Standard)`;
    } else if (demoClothingType === 'one_piece') {
      if (demoChest < 90 && demoWaist < 75) bestSize = 'S';
      else if (demoChest < 100 && demoWaist < 85) bestSize = 'M';
      else if (demoChest < 110 && demoWaist < 95) bestSize = 'L';
      else bestSize = 'XL';
      hint = isRtl ? `بر اساس ترکیب دور سینه ${demoChest} cm و دور کمر ${demoWaist} cm` : `Calculated for bust ${demoChest} cm & waist ${demoWaist} cm`;
    } else {
      bestSize = isRtl ? "تک‌سایز (Free Size)" : "Free Size";
      hint = isRtl ? "مناسب تمام اندازه‌های استاندارد" : "Fits all standard sizes";
    }

    setDemoResult(bestSize);
    setDemoFitHint(hint);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await DirectusAPI.login(email, password);
        setSuccess(isRtl ? "ورود موفقیت‌آمیز بود! در حال انتقال به پنل مدیریت..." : "Login successful! Redirecting to dashboard...");
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        if (!shopName || !shopSlug) {
          throw new Error(isRtl ? "لطفاً تمام فیلدها را پر کنید" : "Please fill in all fields");
        }
        await DirectusAPI.register(email, password, shopName, shopSlug);
        setSuccess(isRtl ? "ثبت‌نام با موفقیت انجام شد! ورود به پنل..." : "Registration successful! Loading dashboard...");
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || (isRtl ? "خطایی در فرآیند به وجود آمد. مجدداً تلاش نمایید." : "An error occurred. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@tankhor.com');
    setPassword('demo1234');
    setShopName('گالری پوشاک آنلاین شیراز');
    setShopSlug('shiraz-gallery');
    setIsLogin(false);
  };

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-300`}>
      
      {/* STICKY TOP NAVIGATION BAR */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${darkMode ? 'bg-neutral-950/85 border-white/10' : 'bg-white/85 border-neutral-200'} px-3 sm:px-8 py-3 transition-all`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src={darkMode ? "/logo-light.png" : "/logo-dark.png"} 
              alt="Tankhor Logo" 
              className="h-8 sm:h-10 w-auto object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {t.brand_name}
              </span>
              <span className="text-[9px] sm:text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 sm:px-2 py-0.5 rounded-full font-black">
                v1.4.2
              </span>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className={`p-1.5 sm:p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${darkMode ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-900' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'}`}
              aria-label="Toggle language"
              title={lang === 'fa' ? 'English' : 'فارسی'}
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${darkMode ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-900' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'}`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />}
            </button>
            
            {/* Direct Login Button */}
            <button
              onClick={() => navigate('/login')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-xl border transition-all cursor-pointer ${darkMode ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-900' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'}`}
            >
              {isRtl ? "ورود به پنل" : "Login"}
            </button>

            {/* Summarized Desktop Download Icon Button */}
            <a
              href="#download-section"
              className="p-1.5 sm:p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:from-sky-500 hover:to-indigo-500 transition-all shadow-md shadow-sky-600/20 flex items-center justify-center cursor-pointer group"
              title={isRtl ? "دانلود رایگان نرم‌افزار دسکتاپ تن‌خور" : "Download Tankhor Desktop App"}
              aria-label="Download Desktop App"
            >
              <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
            </a>
          </div>
        </div>
      </header>

      {/* MINIMALIST HERO SECTION WITH GENEROUS NEGATIVE SPACE */}
      <section className="relative px-4 sm:px-8 py-20 sm:py-28 overflow-hidden">
        {/* Soft subtle glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/10 via-indigo-500/5 to-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          
          {/* Subtle Pill Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>{isRtl ? "نسخه دسکتاپ تن‌خور (۱۰۰٪ رایگان و آفلاین)" : "Tankhor Free Desktop App (100% Offline)"}</span>
          </div>
          
          {/* Clean Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            {isRtl ? "مدیریت پوشاک و راهنمای سایز اختصاصی، رایگان روی دسکتاپ" : "Free Desktop Apparel & Size Guide Management"}
          </h1>
          
          {/* Small & Clean Text */}
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-neutral-400' : 'text-neutral-600'} leading-relaxed max-w-xl mx-auto font-normal`}>
            {isRtl ? "بدون نیاز به اینترنت یا هزینه اشتراک. انبارداری متقاطع سایز/رنگ، ماتریس موجودی و ویجت هوشمند پیشنهاد سایز را روی ویندوز و مک تجربه کنید." : "Run 100% offline with zero subscription fees. Manage garment inventories and size matrices on Windows and macOS."}
          </p>

          {/* Minimalist Desktop Software Download Actions (Windows & macOS) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5" id="download-section">
            <a
              href="https://github.com/brandyar/SizeGrid/releases/download/v1.4.3/Tankhor_1.4.3_x64-setup.exe"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 font-bold text-xs text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Laptop className="w-4 h-4" />
              <span>{isRtl ? "دانلود نسخه ویندوز (Windows .exe)" : "Download for Windows (.exe)"}</span>
            </a>

            <button
              type="button"
              onClick={() => setShowMacModal(true)}
              className={`w-full sm:w-auto px-6 py-3.5 font-bold text-xs border rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${darkMode ? 'border-neutral-800 hover:bg-neutral-900 text-neutral-300' : 'border-neutral-200 hover:bg-neutral-100 text-neutral-800'}`}
            >
              <span>{isRtl ? "دانلود نسخه مک (macOS .dmg)" : "Download for macOS (.dmg)"}</span>
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 font-medium">
            {isRtl ? "بدون محدودیت زمانی • ۱۰۰٪ رایگان • ویژه ویندوز و مک" : "No time limit • 100% Free • Windows & macOS"}
          </p>

        </div>
      </section>

      {/* STORAGE ADAPTER & HYBRID ARCHITECTURE SECTION (HIGHLIGHTING AGENTS.MD RULES) */}
      <section className={`py-16 px-4 sm:px-8 border-y ${darkMode ? 'bg-neutral-900/60 border-white/10' : 'bg-white border-neutral-200'}`}>
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
              {isRtl ? "معماری قدرتمند ذخیره‌سازی" : "Hybrid Storage Adapter Architecture"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2">
              {isRtl ? "آزاد از قطعی اینترنت با لایه ذخیره‌سازی آفلاین محلی (Tankhor Storage Adapter)" : "Offline Local Database + Cloud Sync Engine"}
            </h2>
            <p className={`text-xs sm:text-sm mt-3 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {isRtl ? "پلتفرم تنخور بدون وابستگی اجباری به سرور خارجی یا اینترنت کار می‌کند. تمام داده‌های فروشگاه شما ابتدا به‌صورت کاملاً رایگان در دیتابیس محلی دستگاه ذخیره شده و در صورت تمایل با سرور ابری همگام می‌شود." : "Work 100% offline with device-local storage or sync seamlessly to Directus Cloud API."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Storage Card 1 */}
            <div className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-neutral-950/80 border-white/10' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black mb-2 text-neutral-200">
                {isRtl ? "۱. دیتابیس آفلاین محلی (Local Storage)" : "1. Local Offline Storage"}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {isRtl ? "کارکرد ۱۰۰٪ مستقل و رایگان بدون نیاز به اینترنت. محصولات، ماتریس متغیرها و جداول سایز در مرورگر و اپلیکیشن شما ذخیره می‌شوند." : "100% free and offline capability storing data directly on your device without network requirements."}
              </p>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-emerald-400">
                <span>{isRtl ? "هزینه سرور: ۰ تومان" : "Server Cost: $0"}</span>
                <Check className="w-4 h-4" />
              </div>
            </div>

            {/* Storage Card 2 */}
            <div className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-neutral-950/80 border-white/10' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl w-fit mb-4">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black mb-2 text-neutral-200">
                {isRtl ? "۲. همگام‌سازی ابری (Directus Cloud Sync)" : "2. Directus Cloud Sync"}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {isRtl ? "با فشرده شدن دکمه همگام‌سازی، تمام تغییرات ایجاد شده در حالت آفلاین به صف ارسال اضافه شده و با دیتابیس ابری همگام می‌شوند." : "Queues local updates in SyncQueue and syncs seamlessly with remote Directus API."}
              </p>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-sky-400">
                <span>{isRtl ? "پشتیبان‌گیری چند دستگاهی" : "Cross-Device Backup"}</span>
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>

            {/* Storage Card 3 */}
            <div className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-neutral-950/80 border-white/10' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black mb-2 text-neutral-200">
                {isRtl ? "۳. آماده اجرا روی دسکتاپ و ویندوز (Tauri Ready)" : "3. Desktop & Windows Ready"}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {isRtl ? "کد فرانت‌اند طبق معماری AGENTS.md کاملاً مستقل از فرچ‌آورها بوده و آماده ساخت فایل اجرایی Native Windows EXE با Tauri می‌باشد." : "Built with strict storage abstraction ready for native desktop packaging."}
              </p>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-indigo-400">
                <span>{isRtl ? "سازگار با Tauri & Electron" : "Tauri & Electron Compatible"}</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* THREE BENTO PLATFORM FEATURES */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">{t.features_title}</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Feature 1: Matrix */}
            <div className={`p-8 rounded-3xl border hover:scale-[1.02] transition-all flex flex-col justify-between ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-neutral-200'}`}>
              <div>
                <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit mb-6">
                  <Grid3X3 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black mb-3 text-neutral-200">{t.feature_matrix_title}</h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{t.feature_matrix_desc}</p>
              </div>
              <div className="mt-8 flex items-center text-xs font-bold text-indigo-400 gap-1 cursor-pointer">
                <span>{isRtl ? "مشاهده ماتریس ۲ بعدی موجودی" : "View Inventory Grid"}</span>
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {/* Feature 2: Size Advisor */}
            <div className={`p-8 rounded-3xl border hover:scale-[1.02] transition-all flex flex-col justify-between ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-neutral-200'}`}>
              <div>
                <div className="p-3.5 bg-sky-500/10 text-sky-400 rounded-2xl w-fit mb-6">
                  <Sliders className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black mb-3 text-neutral-200">{t.feature_advisor_title}</h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{t.feature_advisor_desc}</p>
              </div>
              <div className="mt-8 flex items-center text-xs font-bold text-sky-400 gap-1 cursor-pointer">
                <span>{isRtl ? "اجرای موتور پیشنهاد سایز" : "Launch Sizing Engine"}</span>
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {/* Feature 3: Image Compressor */}
            <div className={`p-8 rounded-3xl border hover:scale-[1.02] transition-all flex flex-col justify-between ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-neutral-200'}`}>
              <div>
                <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit mb-6">
                  <FileImage className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black mb-3 text-neutral-200">{t.feature_compress_title}</h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{t.feature_compress_desc}</p>
              </div>
              <div className="mt-8 flex items-center text-xs font-bold text-emerald-400 gap-1 cursor-pointer">
                <span>{isRtl ? "فشرده‌سازی در مرورگر (Web Canvas)" : "In-Browser Canvas Specs"}</span>
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* STEP-BY-STEP SIZING WIZARD (CLEAN & MINIMALIST FOR END CUSTOMERS) */}
      <section id="demo-interactive-section" className={`py-16 px-4 sm:px-8 border-t ${darkMode ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center mb-8">
            <span className="text-[11px] font-black tracking-widest text-sky-500 uppercase">{isRtl ? "راهنمای تعاملی سایز" : "Interactive Sizing Guide"}</span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1.5">{isRtl ? "محاسبه هوشمند سایز پیشنهادی (ظرف ۵ ثانیه)" : "5-Second Intelligent Size Wizard"}</h2>
            <p className={`text-xs mt-2 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {isRtl ? "با طی ۳ گام ساده، تک‌سایز دقیق بدون سردرگمی بازه‌ای را دریافت کنید." : "Complete 3 easy steps to find your exact single recommended garment size."}
            </p>
          </div>

          {/* STEP INDICATOR TABS */}
          <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
            <button
              onClick={() => setWizardStep(1)}
              className={`flex items-center gap-2 text-xs font-bold transition-all ${wizardStep === 1 ? 'text-sky-500' : (darkMode ? 'text-neutral-500' : 'text-neutral-400')}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${wizardStep === 1 ? 'bg-sky-500 text-white shadow-sm' : (darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-600')}`}>۱</span>
              <span className="hidden sm:inline">{isRtl ? "نوع پوشاک" : "Category"}</span>
            </button>
            <div className={`h-0.5 flex-1 mx-3 ${wizardStep >= 2 ? 'bg-sky-500' : (darkMode ? 'bg-neutral-800' : 'bg-neutral-200')}`} />
            <button
              onClick={() => setWizardStep(2)}
              className={`flex items-center gap-2 text-xs font-bold transition-all ${wizardStep === 2 ? 'text-sky-500' : (darkMode ? 'text-neutral-500' : 'text-neutral-400')}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${wizardStep === 2 ? 'bg-sky-500 text-white shadow-sm' : (darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-600')}`}>۲</span>
              <span className="hidden sm:inline">{isRtl ? "ابعاد بدنی" : "Body Bounds"}</span>
            </button>
            <div className={`h-0.5 flex-1 mx-3 ${wizardStep === 3 ? 'bg-sky-500' : (darkMode ? 'bg-neutral-800' : 'bg-neutral-200')}`} />
            <button
              onClick={() => wizardStep === 3 && setWizardStep(3)}
              className={`flex items-center gap-2 text-xs font-bold transition-all ${wizardStep === 3 ? 'text-sky-500' : (darkMode ? 'text-neutral-500' : 'text-neutral-400')}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${wizardStep === 3 ? 'bg-sky-500 text-white shadow-sm' : (darkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-600')}`}>۳</span>
              <span className="hidden sm:inline">{isRtl ? "سایز پیشنهادی" : "Result"}</span>
            </button>
          </div>

          {/* WIZARD CONTAINER CARD */}
          <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>

            {/* STEP 1: CATEGORY SELECTION */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-base font-extrabold">{isRtl ? "گام ۱: نوع لباس مورد نظر را انتخاب کنید" : "Step 1: Choose Garment Category"}</h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{isRtl ? "الگوریتم سایزبندی متناسب با فرم هر دسته لباس عمل می‌کند." : "Sizing rules adapt specifically to each clothing category structure."}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { key: 'tops', label_fa: 'بالاتنه', label_en: 'Tops', desc: 'تیشرت، هودی، پیراهن' },
                    { key: 'bottoms', label_fa: 'پایین‌تنه', label_en: 'Bottoms', desc: 'شلوار، جین، اسلش' },
                    { key: 'footwear', label_fa: 'کفش', label_en: 'Footwear', desc: 'کتانی، بوت، صندل' },
                    { key: 'one_piece', label_fa: 'سرهمی', label_en: 'OnePiece', desc: 'اورال، مانتو، کت‌وشلوار' },
                    { key: 'accessories', label_fa: 'اکسسوری', label_en: 'Accessories', desc: 'کلاه، شال، دستکش' },
                  ].map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setDemoClothingType(cat.key as any);
                        setDemoResult('');
                      }}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                        demoClothingType === cat.key
                          ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-extrabold shadow-sm'
                          : (darkMode ? 'border-neutral-800 hover:border-neutral-700 text-neutral-300' : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-neutral-50')
                      }`}
                    >
                      <span className="text-xs font-black block">{isRtl ? cat.label_fa : cat.label_en}</span>
                      <span className="text-[10px] text-neutral-500 mt-1 block leading-tight">{cat.desc}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>{isRtl ? "مرحله بعدی: ورود ابعاد بدنی" : "Next Step: Enter Measurements"}</span>
                  {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* STEP 2: USER MEASUREMENTS */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-base font-extrabold">{isRtl ? "گام ۲: اندازه‌های دقیق کاربر را وارد کنید" : "Step 2: Enter Body Measurements"}</h3>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {demoClothingType === 'footwear' ? (isRtl ? "طول پا از پاشنه تا بلندترین انگشت" : "Foot length in cm") : (isRtl ? "اندازه‌های دقیق خود را وارد کنید تا بهترین سایز محاسبه شود." : "Enter your exact measurements for size calculation.")}
                  </p>
                </div>

                {demoClothingType === 'footwear' ? (
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className={darkMode ? 'text-neutral-300' : 'text-neutral-700'}>{isRtl ? "طول پا (سانتی‌متر):" : "Foot Length (cm):"}</span>
                      <span className="text-sky-500 font-black text-sm">{demoFootLength} cm</span>
                    </div>
                    <input
                      type="range"
                      min="21.0"
                      max="31.0"
                      step="0.5"
                      value={demoFootLength}
                      onChange={(e) => setDemoFootLength(Number(e.target.value))}
                      className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                ) : demoClothingType === 'accessories' ? (
                  <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 text-center text-xs font-bold text-neutral-400">
                    {isRtl ? "اکسسوری‌ها معمولاً تک‌سایز (Free Size) می‌باشند." : "Accessories are standard Free Size."}
                  </div>
                ) : demoClothingType === 'bottoms' ? (
                  <div className="space-y-5 max-w-lg mx-auto">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Waist Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={darkMode ? 'text-neutral-300' : 'text-neutral-700'}>{isRtl ? "دور کمر (cm):" : "Waist (cm):"}</span>
                          <span className="text-sky-500 font-black">{demoWaist} cm</span>
                        </div>
                        <input
                          type="range"
                          min="65"
                          max="125"
                          value={demoWaist}
                          onChange={(e) => setDemoWaist(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>

                      {/* Hip Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={darkMode ? 'text-neutral-300' : 'text-neutral-700'}>{isRtl ? "دور باسن (cm):" : "Hip (cm):"}</span>
                          <span className="text-sky-500 font-black">{demoHip} cm</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="135"
                          value={demoHip}
                          onChange={(e) => setDemoHip(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    </div>

                    {/* Pants Length Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className={darkMode ? 'text-neutral-300' : 'text-neutral-700'}>{isRtl ? "قد شلوار (cm):" : "Pants Length (cm):"}</span>
                        <span className="text-sky-500 font-black">{demoPantsLength} cm</span>
                      </div>
                      <input
                        type="range"
                        min="88"
                        max="118"
                        value={demoPantsLength}
                        onChange={(e) => setDemoPantsLength(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 max-w-lg mx-auto">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Chest Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={darkMode ? 'text-neutral-300' : 'text-neutral-700'}>{isRtl ? "دور سینه (cm):" : "Chest (cm):"}</span>
                          <span className="text-sky-500 font-black">{demoChest} cm</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="135"
                          value={demoChest}
                          onChange={(e) => setDemoChest(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>

                      {/* Shoulder Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={darkMode ? 'text-neutral-300' : 'text-neutral-700'}>{isRtl ? "عرض سرشانه (cm):" : "Shoulder Width (cm):"}</span>
                          <span className="text-sky-500 font-black">{demoShoulder} cm</span>
                        </div>
                        <input
                          type="range"
                          min="38"
                          max="58"
                          value={demoShoulder}
                          onChange={(e) => setDemoShoulder(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Sleeve Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={darkMode ? 'text-neutral-300' : 'text-neutral-700'}>{isRtl ? "طول آستین (cm):" : "Sleeve Length (cm):"}</span>
                          <span className="text-sky-500 font-black">{demoSleeve} cm</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="72"
                          value={demoSleeve}
                          onChange={(e) => setDemoSleeve(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>

                      {/* Cloth Length Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={darkMode ? 'text-neutral-300' : 'text-neutral-700'}>{isRtl ? "قد لباس (cm):" : "Cloth Length (cm):"}</span>
                          <span className="text-sky-500 font-black">{demoClothLength} cm</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="95"
                          value={demoClothLength}
                          onChange={(e) => setDemoClothLength(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className={`py-3 px-5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${darkMode ? 'border-neutral-800 text-neutral-400 hover:text-neutral-200' : 'border-neutral-200 text-neutral-600'}`}
                  >
                    {isRtl ? "بازگشت" : "Back"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWizardCalculating(true);
                      calculateDemoSize();
                      setTimeout(() => {
                        setWizardCalculating(false);
                        setWizardStep(3);
                      }, 250);
                    }}
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    {wizardCalculating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{isRtl ? "محاسبه ۵ ثانیه‌ای سایز پیشنهادی" : "Calculate 5-Sec Size"}</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: INSTANT SINGLE RECOMMENDED SIZE RESULT */}
            {wizardStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-500/10 to-transparent border border-sky-500/20 max-w-md mx-auto space-y-3">
                  <span className="text-[11px] font-black uppercase text-sky-500 tracking-wider block">
                    {isRtl ? "سایز دقیق پیشنهادی تن‌خور" : "Recommended Tankhor Single Size"}
                  </span>
                  
                  <div className="text-5xl font-black text-white tracking-tight my-2">
                    {demoResult || 'L'}
                  </div>

                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    {demoFitHint || (isRtl ? "این سایز عالی‌ترین انطباق تن‌خور را بر اساس قد و وزن وارد شده ارائه می‌دهد." : "Calculated fit matches height and weight profile.")}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className={`w-full sm:w-auto py-2.5 px-5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${darkMode ? 'border-neutral-800 text-neutral-400 hover:text-neutral-200' : 'border-neutral-200 text-neutral-600'}`}
                  >
                    {isRtl ? "تغییر اندازه‌ها و سنجش مجدد" : "Adjust Measurements"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const demoStoreSlug = 'demo-shop';
                      navigate(`/shop/${demoStoreSlug}/product/1`);
                    }}
                    className="w-full sm:w-auto py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                  >
                    {isRtl ? "مشاهده محصولات فروشگاه با این سایز" : "Shop Garments in this Size"}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* STEPS EXPLANATORY */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-12">{t.how_it_works}</h2>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-neutral-900/40 border-white/10' : 'bg-white border-neutral-200'} space-y-4`}>
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-black flex items-center justify-center mx-auto text-lg shadow-lg shadow-sky-500/20">۱</div>
              <h3 className="font-extrabold text-base text-neutral-200">{t.step_1}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">{t.step_1_desc}</p>
            </div>
            
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-neutral-900/40 border-white/10' : 'bg-white border-neutral-200'} space-y-4`}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center mx-auto text-lg shadow-lg shadow-indigo-500/20">۲</div>
              <h3 className="font-extrabold text-base text-neutral-200">{t.step_2}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">{t.step_2_desc}</p>
            </div>

            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-neutral-900/40 border-white/10' : 'bg-white border-neutral-200'} space-y-4`}>
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black flex items-center justify-center mx-auto text-lg shadow-lg shadow-purple-500/20">۳</div>
              <h3 className="font-extrabold text-base text-neutral-200">{t.step_3}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">{t.step_3_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 sm:px-8 border-t border-white/10 text-center text-xs text-neutral-400 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="p-1.5 bg-sky-600 text-white rounded-lg">
            <Grid3X3 className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-neutral-200">تنخور | Tankhor</span>
        </div>
        <p>© 2026 tankhor.com | {isRtl ? "پلتفرم تخصصی مدیریت موجودی ۲ بعدی و پیشنهاد سایز پوشاک" : "Fashion Sizing & Inventory Platform"}</p>
      </footer>

      {/* MAC OS INSTALLATION GUIDE MODAL POPUP */}
      {showMacModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div 
            className={`w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-neutral-800 overflow-hidden transform transition-all ${isRtl ? 'rtl' : 'ltr'}`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header Banner */}
            <div className="relative p-6 text-white bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 backdrop-blur-md rounded-2xl text-indigo-400 border border-indigo-500/30">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-sky-500/20 text-sky-300 text-[10px] font-extrabold rounded-full uppercase tracking-wider mb-1">
                      macOS Installation Guide
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white">
                      {isRtl ? "راهنمای دانلود و اجرای نسخه مک (macOS)" : "macOS Download & Fix Guide"}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setShowMacModal(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
                  title={isRtl ? "بستن" : "Close"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-slate-800 dark:text-neutral-200 text-xs">
              
              {/* Direct Download Button */}
              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {isRtl ? "۱. دریافت مستقیم فایل مک (DMG)" : "1. Download macOS DMG"}
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                    v1.4.3 (Apple Silicon / Intel)
                  </span>
                </div>
                <a
                  href="https://github.com/brandyar/SizeGrid/releases/download/v1.4.3/Tankhor_1.4.3_aarch64.dmg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{isRtl ? "دانلود فایل Tankhor_1.4.3_aarch64.dmg" : "Download Tankhor_1.4.3_aarch64.dmg"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Terminal Command Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {isRtl ? "۲. رفع خطای امنیتی قرنطینه اپل (Quarantine Fix)" : "2. Remove macOS Quarantine Flag"}
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {isRtl ? "مهم: فقط یک‌بار اجرا کنید" : "Run once in Terminal"}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">
                  {isRtl 
                    ? "پس از دانلود و انتقال برنامه به پوشه Applications، به دلیل عدم وجود لایسنس سالانه $99 اپل، سیستم‌عامل مک ممکن است خطای Damaged یا Unidentified Developer بدهد. برای حل این مشکل، دستور زیر را کپی کرده و در برنامه ترمینال (Terminal) مک وارد کرده و Enter را بزنید:"
                    : "After moving Tankhor.app to /Applications, macOS Gatekeeper may show a warning. Copy & paste this command into Terminal to fix it:"}
                </p>

                {/* Command display box with copy button */}
                <div className="bg-slate-950 text-emerald-400 p-3.5 rounded-2xl font-mono text-[11px] sm:text-xs flex items-center justify-between gap-2 border border-slate-800 shadow-inner">
                  <div className="overflow-x-auto select-all whitespace-nowrap py-1">
                    <code>sudo xattr -rd com.apple.quarantine /Applications/Tankhor.app</code>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("sudo xattr -rd com.apple.quarantine /Applications/Tankhor.app");
                      setCopiedCmd(true);
                      setTimeout(() => setCopiedCmd(false), 3000);
                    }}
                    className={`shrink-0 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiedCmd 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {copiedCmd ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>{isRtl ? "کپی شد! ✓" : "Copied! ✓"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isRtl ? "کپی دستور" : "Copy"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step By Step Summary List */}
              <div className="p-4 bg-slate-50 dark:bg-neutral-950/60 rounded-2xl border border-slate-200/60 dark:border-neutral-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-neutral-300 block text-xs">
                  {isRtl ? "مراحل کوتاه اجرای نرم‌افزار روی مک:" : "Quick Steps:"}
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
                  <li>{isRtl ? "فایل DMG را باز کرده و Tankhor را به پوشه Applications بکشید." : "Open DMG & drag Tankhor to Applications folder."}</li>
                  <li>{isRtl ? "برنامه Terminal را از طریق Spotlight (دکمه‌های Cmd + Space) باز کنید." : "Open Terminal via Spotlight (Cmd + Space)."}</li>
                  <li>{isRtl ? "دستور فوق را Paste کرده، Enter بزنید و رمز عبور مک خود را تایپ کنید." : "Paste command, press Enter, and enter Mac password."}</li>
                  <li>{isRtl ? "برنامه تن‌خور اکنون کاملاً و بدون خطا اجرا خواهد شد." : "Launch Tankhor from Applications."}</li>
                </ol>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowMacModal(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-bold rounded-xl transition-all cursor-pointer text-xs"
                >
                  {isRtl ? "متوجه شدم و بستن راهنما" : "Got it & Close"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
