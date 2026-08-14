import React, { useState } from 'react';
import { locales } from '../locales';
import { DirectusAPI } from '../directus';
import { useRouter } from './Router';
import { isDesktopEnv } from '../utils/desktop';
import { APP_VERSION } from '../version';
import { AppUpdateWidget } from './AppUpdateWidget';
import { 
  Grid3X3, 
  Lock, 
  Mail, 
  Store, 
  Sparkles, 
  Globe, 
  Sun, 
  Moon, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  WifiOff, 
  Laptop,
  Check
} from 'lucide-react';

interface DesktopLoginProps {
  lang: 'fa' | 'en';
  setLang: (lang: 'fa' | 'en') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function DesktopLogin({ lang, setLang, darkMode, setDarkMode }: DesktopLoginProps) {
  const { navigate } = useRouter();
  const t = locales[lang];
  const isRtl = lang === 'fa';

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Is desktop environment detected?
  const isDesktop = isDesktopEnv();

  // Auto-redirect if user is already logged in with a registered account
  React.useEffect(() => {
    const existingUser = DirectusAPI.getCurrentUser();
    if (existingUser && existingUser.id) {
      navigate('/dashboard');
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await DirectusAPI.login(email, password);
        setSuccess(isRtl ? "ورود موفقیت‌آمیز بود! در حال انتقال به پنل دسکتاپ..." : "Login successful! Loading desktop panel...");
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        if (!shopName || !shopSlug) {
          throw new Error(isRtl ? "لطفاً تمام فیلدها را پر کنید" : "Please fill in all required fields");
        }
        await DirectusAPI.register(email, password, shopName, shopSlug);
        setSuccess(isRtl ? "ثبت‌نام و ایجاد حساب با موفقیت انجام شد! انتقال به پنل..." : "Store registration successful! Redirecting...");
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || (isRtl ? "خطایی در ورود به سیستم رخ داد" : "Authentication error occurred"));
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineAccess = () => {
    setError('');
    setSuccess('');
    
    // Check if a registered user session exists in cache
    const savedUserStr = localStorage.getItem('tankhor_user') || localStorage.getItem('sizegrid_user');
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.id && savedUser.id !== 'offline-merchant-local') {
          setSuccess(isRtl ? "نشست کاربری ثبت‌شده قبلی یافت شد. در حال ورود آفلاین..." : "Saved account session found. Logging in offline...");
          setTimeout(() => {
            navigate('/dashboard');
          }, 600);
          return;
        }
      } catch (e) {}
    }

    setError(
      isRtl
        ? "شما هنوز در سیستم تن‌خور ثبت‌نام نکرده‌اید. لطفاً ابتدا یک‌بار با اتصال به اینترنت ثبت‌نام کنید یا وارد حساب خود شوید."
        : "You have not registered an account yet. Please connect to the internet once to register or log in."
    );
  };

  const handleDemoFill = () => {
    setEmail('demo@tankhor.com');
    setPassword('demo1234');
    if (!isLogin) {
      setShopName('گالری پوشاک آنلاین شیراز');
      setShopSlug('shiraz-gallery');
    }
  };

  return (
    <div className={`min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'}`}>
      
      {/* Dynamic Ambient Background Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-sky-600/20 via-indigo-600/20 to-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Top Controls (Theme & Language & Web Preview Navigation) */}
      <div className="absolute top-5 right-5 left-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-xl shadow-md">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {t.brand_name}
          </span>
          <AppUpdateWidget compact />
          <span className="hidden sm:inline-flex text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-extrabold items-center gap-1">
            <Laptop className="w-3 h-3" />
            v{APP_VERSION} {isDesktop ? 'Desktop App' : 'Desktop Edition'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isDesktop && (
            <button
              onClick={() => navigate('/')}
              className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all ${darkMode ? 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-200 bg-white/80 text-neutral-700 hover:bg-neutral-100'}`}
            >
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{isRtl ? "صفحه وب فروشگاه" : "Web Landing"}</span>
            </button>
          )}

          <button
            onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${darkMode ? 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-200 bg-white/80 text-neutral-700 hover:bg-neutral-100'}`}
            title={lang === 'fa' ? 'English' : 'فارسی'}
          >
            <Globe className="w-4 h-4 text-sky-400" />
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${darkMode ? 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-200 bg-white/80 text-neutral-700 hover:bg-neutral-100'}`}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </div>

      {/* Main Glassmorphic Login Card */}
      <div className={`relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl backdrop-blur-2xl transition-all ${darkMode ? 'bg-neutral-900/80 border-white/10 shadow-black/80' : 'bg-white/90 border-neutral-200/80 shadow-sky-900/10'}`}>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 text-sky-400 mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {isLogin 
              ? (isRtl ? "ورود به پنل مدیریت دسکتاپ" : "Desktop Merchant Login") 
              : (isRtl ? "ثبت‌نام فروشگاه جدید" : "Register New Store")}
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 font-medium">
            {isRtl ? "مدیریت پوشاک، راهنمای سایز اختصاصی و انبارداری دو حالته" : "Clothing inventory, custom sizing guides & hybrid storage"}
          </p>
        </div>

        {/* Tab Toggle: Login vs Register */}
        <div className={`p-1 rounded-2xl border flex items-center mb-6 ${darkMode ? 'bg-neutral-950/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${isLogin ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            {isRtl ? "ورود به حساب" : "Account Login"}
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!isLogin ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            {isRtl ? "ساخت فروشگاه" : "Register Store"}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-80">
                  {isRtl ? "نام فروشگاه" : "Store Name"}
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute top-3.5 right-3.5 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => {
                      setShopName(e.target.value);
                      const slug = e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w\-]+/g, '');
                      setShopSlug(slug || 'my-store');
                    }}
                    placeholder={isRtl ? "مثال: بوتیک شیک‌پوشان" : "e.g. Trendy Boutique"}
                    className={`w-full pr-10 pl-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${darkMode ? 'bg-neutral-950/60 border-neutral-800 text-neutral-100 focus:border-sky-500' : 'bg-white border-neutral-300 text-neutral-900 focus:border-sky-500'} outline-none`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-80">
                  {isRtl ? "شناسه اینترنتی فروشگاه (Slug)" : "Store Slug ID"}
                </label>
                <input
                  type="text"
                  required
                  value={shopSlug}
                  onChange={(e) => setShopSlug(e.target.value)}
                  placeholder="e.g. trendy-boutique"
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all ${darkMode ? 'bg-neutral-950/60 border-neutral-800 text-sky-400 focus:border-sky-500' : 'bg-white border-neutral-300 text-sky-600 focus:border-sky-500'} outline-none`}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold mb-1.5 opacity-80">
              {isRtl ? "ایمیل مدیریت" : "Admin Email"}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute top-3.5 right-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@store.com"
                className={`w-full pr-10 pl-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${darkMode ? 'bg-neutral-950/60 border-neutral-800 text-neutral-100 focus:border-sky-500' : 'bg-white border-neutral-300 text-neutral-900 focus:border-sky-500'} outline-none`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 opacity-80">
              {isRtl ? "رمز عبور" : "Password"}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute top-3.5 right-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pr-10 pl-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${darkMode ? 'bg-neutral-950/60 border-neutral-800 text-neutral-100 focus:border-sky-500' : 'bg-white border-neutral-300 text-neutral-900 focus:border-sky-500'} outline-none`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-sky-400 hover:underline font-bold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isRtl ? "پرکردن نمونه تست" : "Auto fill test info"}</span>
            </button>
            <span className="text-neutral-500 font-medium">
              {isRtl ? "پشتیبانی کامل از آفلاین/آنلاین" : "Hybrid Storage Supported"}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-sky-600/30 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>
                  {isLogin 
                    ? (isRtl ? "ورود به پنل دسکتاپ" : "Login to Desktop") 
                    : (isRtl ? "ایجاد و ساخت فروشگاه" : "Create Store")}
                </span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </form>

        {/* Requirement Note & Offline Entry Button for Existing Users */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`} />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
            <span className={`px-3 ${darkMode ? 'bg-neutral-900 text-neutral-500' : 'bg-white text-neutral-400'}`}>
              {isRtl ? "نکته مهم استفاده آفلاین" : "IMPORTANT OFFLINE NOTE"}
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed font-medium mb-4 ${darkMode ? 'bg-neutral-950/40 border-neutral-800/80 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {isRtl 
                ? "ثبت‌نام اولیه نیازمند اینترنت است تا کاربر در سیستم ثبت گردد. پس از اولین ورود موفق، استفاده از نسخه دسکتاپ برای همیشه به‌صورت ۱۰۰٪ آفلاین و رایگان میسر خواهد بود."
                : "Initial registration requires internet to register your user account. After first login, desktop mode works 100% offline forever."}
            </span>
          </p>
        </div>

        {/* Saved Session Offline Login Button */}
        <button
          type="button"
          onClick={handleOfflineAccess}
          disabled={loading}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all cursor-pointer ${darkMode ? 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700' : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'}`}
        >
          <WifiOff className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>
            {isRtl ? "ورود آفلاین به حساب ثبت‌شده قبلی" : "Offline Login to Registered Account"}
          </span>
        </button>

        {/* Desktop Footer Badge */}
        <div className="mt-6 pt-4 border-t border-neutral-800/40 text-center">
          <p className="text-[10px] text-neutral-500 font-medium flex items-center justify-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{isRtl ? "سیستم مدیریت انبار و سایز تن‌خور • نسخه دسکتاپ " : "Tankhor Apparel System • Desktop Native Bridge"}</span>
          </p>
        </div>

      </div>
    </div>
  );
}
