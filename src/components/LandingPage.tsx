import React, { useState, useEffect } from 'react';
import { locales } from '../locales';
import { DirectusAPI } from '../directus';
import { useRouter } from './Router';
import { 
  Sparkles, 
  Grid3X3, 
  UserCheck, 
  Sliders, 
  FileImage, 
  Store, 
  Layers, 
  ChevronRight, 
  ChevronLeft,
  Sun,
  Moon,
  Globe,
  Lock,
  Mail,
  AlertCircle,
  TrendingUp,
  CheckCircle2
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

  // Quick Demo Interactive States
  const [demoClothingType, setDemoClothingType] = useState<'tops' | 'bottoms' | 'footwear' | 'one_piece' | 'accessories'>('tops');
  const [demoHeight, setDemoHeight] = useState(172);
  const [demoWeight, setDemoWeight] = useState(68);
  const [demoShape, setDemoShape] = useState<'slim' | 'regular' | 'athletic' | 'heavy'>('athletic');
  const [demoIsPrecisionMode, setDemoIsPrecisionMode] = useState<boolean>(false);
  const [demoChest, setDemoChest] = useState<number>(95);
  const [demoWaist, setDemoWaist] = useState<number>(82);
  const [demoHip, setDemoHip] = useState<number>(97);
  const [demoShoulder, setDemoShoulder] = useState<number>(42);
  const [demoFootLength, setDemoFootLength] = useState<number>(26.5);
  const [demoResult, setDemoResult] = useState('');
  const [demoFitHint, setDemoFitHint] = useState('');
  const [demoResultTops, setDemoResultTops] = useState('');
  const [demoResultBottoms, setDemoResultBottoms] = useState('');
  const [demoResultFootwear, setDemoResultFootwear] = useState('');
  const [demoResultOnePiece, setDemoResultOnePiece] = useState('');
  const [demoResultAccessories, setDemoResultAccessories] = useState('');

  // Auto-calculate body measurements on height/weight/shape changes if not in custom mode
  useEffect(() => {
    if (!demoIsPrecisionMode) {
      let chest = demoWeight * 1.4;
      let waist = demoWeight * 1.22;
      let hip = demoWeight * 1.4;
      let shoulder = demoHeight * 0.23;
      let foot = 21 + (demoHeight - 150) * 0.12 + (demoWeight - 50) * 0.03;

      if (demoShape === 'slim') {
        chest = demoWeight * 1.35 + (demoHeight - 100) * 0.1;
        waist = demoWeight * 1.10 + (demoHeight - 100) * 0.1;
        hip = demoWeight * 1.35 + (demoHeight - 100) * 0.1;
        shoulder = demoHeight * 0.22 - 1;
      } else if (demoShape === 'athletic') {
        chest = demoWeight * 1.45 + (demoHeight - 100) * 0.1;
        waist = demoWeight * 1.18 + (demoHeight - 100) * 0.1;
        hip = demoWeight * 1.42 + (demoHeight - 100) * 0.1;
        shoulder = demoHeight * 0.23 + 2;
      } else if (demoShape === 'heavy') {
        chest = demoWeight * 1.55 + (demoHeight - 100) * 0.1;
        waist = demoWeight * 1.45 + (demoHeight - 100) * 0.1;
        hip = demoWeight * 1.50 + (demoHeight - 100) * 0.1;
        shoulder = demoHeight * 0.23 + 1;
      } else { // regular
        chest = demoWeight * 1.40 + (demoHeight - 100) * 0.1;
        waist = demoWeight * 1.22 + (demoHeight - 100) * 0.1;
        hip = demoWeight * 1.40 + (demoHeight - 100) * 0.1;
        shoulder = demoHeight * 0.23;
      }

      setDemoChest(Math.round(chest));
      setDemoWaist(Math.round(waist));
      setDemoHip(Math.round(hip));
      setDemoShoulder(Math.round(shoulder));
      setDemoFootLength(Number(foot.toFixed(1)));
    }
  }, [demoHeight, demoWeight, demoShape, demoIsPrecisionMode]);

  const calculateDemoSize = () => {
    // Single exact size calculations per clothing type
    const targetSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

    // 1. TOPS (Single size result)
    let bestTopsSize = 'M';
    if (demoChest < 88) bestTopsSize = 'XS';
    else if (demoChest < 94) bestTopsSize = 'S';
    else if (demoChest < 102) bestTopsSize = 'M';
    else if (demoChest < 110) bestTopsSize = 'L';
    else if (demoChest < 118) bestTopsSize = 'XL';
    else if (demoChest < 126) bestTopsSize = 'XXL';
    else bestTopsSize = 'XXXL';

    // 2. BOTTOMS (Single size result)
    let bestBottomsSize = 'M';
    if (demoWaist < 72) bestBottomsSize = 'S (28-29)';
    else if (demoWaist < 80) bestBottomsSize = 'M (30-31)';
    else if (demoWaist < 88) bestBottomsSize = 'L (32-33)';
    else if (demoWaist < 96) bestBottomsSize = 'XL (34-36)';
    else if (demoWaist < 106) bestBottomsSize = 'XXL (38-40)';
    else bestBottomsSize = 'XXXL (42+)';

    // 3. FOOTWEAR (Single size result)
    let shoeSize = '42';
    if (demoFootLength <= 23.5) shoeSize = '37';
    else if (demoFootLength <= 24.2) shoeSize = '38';
    else if (demoFootLength <= 25.0) shoeSize = '39';
    else if (demoFootLength <= 25.8) shoeSize = '40';
    else if (demoFootLength <= 26.5) shoeSize = '41';
    else if (demoFootLength <= 27.2) shoeSize = '42';
    else if (demoFootLength <= 28.0) shoeSize = '43';
    else if (demoFootLength <= 28.8) shoeSize = '44';
    else shoeSize = '45';

    // 4. ONE_PIECE (Single size result)
    let bestOnePiece = 'M';
    if (demoHeight < 162 && demoChest < 90) bestOnePiece = 'S';
    else if (demoHeight < 174 && demoChest < 100) bestOnePiece = 'M';
    else if (demoHeight < 185 && demoChest < 110) bestOnePiece = 'L';
    else bestOnePiece = 'XL';

    // 5. ACCESSORIES (Free Size)
    const bestAccessories = isRtl ? "تک‌سایز (Free Size)" : "Free Size";

    setDemoResultTops(bestTopsSize);
    setDemoResultBottoms(bestBottomsSize);
    setDemoResultFootwear(shoeSize);
    setDemoResultOnePiece(bestOnePiece);
    setDemoResultAccessories(bestAccessories);

    if (demoClothingType === 'tops') {
      setDemoResult(bestTopsSize);
      setDemoFitHint(isRtl ? `اندازه دقیق بر اساس دور سینه ${demoChest} cm و عرض سرشانه ${demoShoulder} cm` : `Calculated for chest ${demoChest} cm`);
    } else if (demoClothingType === 'bottoms') {
      setDemoResult(bestBottomsSize);
      setDemoFitHint(isRtl ? `اندازه دقیق بر اساس دور کمر ${demoWaist} cm و دور باسن ${demoHip} cm` : `Calculated for waist ${demoWaist} cm`);
    } else if (demoClothingType === 'footwear') {
      setDemoResult(shoeSize);
      setDemoFitHint(isRtl ? `بر اساس طول پا ${demoFootLength} cm (اروپایی standard EU)` : `Calculated for foot length ${demoFootLength} cm`);
    } else if (demoClothingType === 'one_piece') {
      setDemoResult(bestOnePiece);
      setDemoFitHint(isRtl ? `بر اساس قد ${demoHeight} cm و دور سینه/کمر` : `Calculated for total height & body shape`);
    } else {
      setDemoResult(bestAccessories);
      setDemoFitHint(isRtl ? "مناسب برای تمام اندازه‌ها (Free Size)" : "Fits all standard dimensions");
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await DirectusAPI.login(email, password);
        setSuccess(isRtl ? "ورود موفقیت‌آمیز بود! در حال انتقال به پنل مدیریت..." : "Login successful! Redirecting to panel...");
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        if (!shopName || !shopSlug) {
          throw new Error(isRtl ? "لطفاً تمام فیلدها را پر کنید" : "Please fill in all fields");
        }
        const user = await DirectusAPI.register(email, password, shopName, shopSlug);
        setSuccess(isRtl ? "ثبت‌نام با موفقیت انجام شد! ورود به پنل..." : "Registration successful! Loading panel...");
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || (isRtl ? "خطایی در فرآیند به وجود آمد. مجدداً تلاش نمایید." : "An error occurred. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    // Fill quick registration details for easy testing
    setEmail('demo@sizegrid.ir');
    setPassword('demo1234');
    setShopName('گالری لباس شیراز');
    setShopSlug('shiraz-gallery');
    setIsLogin(false);
  };

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-300`}>
      
      {/* HEADER / NAVIGATION */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${darkMode ? 'bg-neutral-950/80 border-neutral-800' : 'bg-white/80 border-neutral-200'} px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">
              <Grid3X3 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                {t.brand_name}
              </span>
              <p className="text-[10px] text-neutral-400 font-medium tracking-wide leading-none">{t.tagline}</p>
            </div>
          </div>

          {/* Settings / Controls */}
          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className={`p-2 rounded-lg border flex items-center gap-2 text-xs font-semibold hover:bg-neutral-500/10 ${darkMode ? 'border-neutral-800 text-neutral-300' : 'border-neutral-200 text-neutral-700'} transition-all`}
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4 text-sky-500" />
              <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border ${darkMode ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'} transition-all`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            
            <a
              href="#auth-section"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              {t.get_started}
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative px-6 pt-16 pb-24 overflow-hidden">
        {/* Abstract background lighting */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Text / Info */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>{isRtl ? "سیستم یکپارچه و بهینه بر پایه کانتینرهای داکر" : "Docker & Coolify Optimized Production Platform"}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              {t.hero_title}
            </h1>
            
            <p className={`text-base sm:text-lg ${darkMode ? 'text-neutral-400' : 'text-neutral-600'} leading-relaxed max-w-2xl mx-auto lg:mx-0`}>
              {t.hero_subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <a
                href="#auth-section"
                className="px-6 py-3.5 font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl shadow-lg hover:shadow-sky-500/20 transition-all flex items-center gap-2"
              >
                <span>{t.get_started}</span>
                {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </a>
              
              <a
                href="#demo-interactive-section"
                className={`px-6 py-3.5 font-bold border rounded-xl hover:bg-neutral-500/10 transition-all ${darkMode ? 'border-neutral-800 text-neutral-300' : 'border-neutral-200 text-neutral-700'}`}
              >
                {isRtl ? "تست آنلاین ویجت هوشمند" : "Try Interactive Size Widget"}
              </a>
            </div>

            {/* Quick stats / metrics */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-neutral-800 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl font-black text-sky-500">%۳۴-</p>
                <p className="text-xs text-neutral-400">{isRtl ? "کاهش نرخ مرجوعی کالا" : "Reduction in Returns"}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-indigo-500">۱۰X</p>
                <p className="text-xs text-neutral-400">{isRtl ? "سرعت ثبت متغیرهای سایز" : "Faster Variant Setup"}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-500">۱۰۰٪</p>
                <p className="text-xs text-neutral-400">{isRtl ? "محاسبه کاملاً آفلاین مرورگر" : "Client-Side Processing"}</p>
              </div>
            </div>
          </div>

          {/* Right Interface Mockup & Register/Login Forms */}
          <div className="lg:col-span-5" id="auth-section">
            <div className={`p-6 rounded-2xl border backdrop-blur-lg shadow-2xl transition-all ${darkMode ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white/95 border-neutral-200'}`}>
              
              {/* Login/Register Tabs */}
              <div className="flex border-b border-neutral-800 mb-6">
                <button
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 pb-3 text-sm font-extrabold border-b-2 transition-all ${isLogin ? 'border-sky-500 text-sky-500' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                >
                  {t.login}
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 pb-3 text-sm font-extrabold border-b-2 transition-all ${!isLogin ? 'border-sky-500 text-sky-500' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                >
                  {t.register}
                </button>
              </div>

              {/* Action Error Alerts */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.shop_name}</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">
                          <Store className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          placeholder={isRtl ? "مثال: پوشاک ورزشی نایک" : "e.g. Nike Sportswear"}
                          className={`w-full pr-10 pl-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-neutral-400">
                        {t.shop_slug} <span className="text-[10px] text-sky-400">(مثال: shop/nike)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">
                          <Globe className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={shopSlug}
                          onChange={(e) => setShopSlug(e.target.value)}
                          placeholder="nike"
                          className={`w-full pr-10 pl-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-sky-500 text-left dir-ltr ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.email}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@store.com"
                      className={`w-full pr-10 pl-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-sky-500 text-left dir-ltr ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.password}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pr-10 pl-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-sky-500 text-left dir-ltr ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-600/15 hover:shadow-sky-600/25 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{isLogin ? t.login : t.register}</span>
                  )}
                </button>
              </form>

              {/* Developer Test Fast Actions */}
              <div className="mt-4 pt-4 border-t border-neutral-800 text-center">
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRtl ? "پیش‌نویس خودکار اطلاعات دمو (ویژه داور)" : "Auto-Fill Demo Info (Reviewer Shortcut)"}</span>
                </button>
              </div>

              {/* Toggle Account type links */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-xs text-neutral-400 hover:text-neutral-200 transition-all hover:underline"
                >
                  {isLogin ? t.no_account : t.have_account}
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* THREE BENTO PLATFORM FEATURES */}
      <section className={`py-20 px-6 ${darkMode ? 'bg-neutral-950 border-t border-neutral-900' : 'bg-neutral-100 border-t border-neutral-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">{t.features_title}</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-sky-500 to-indigo-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Feature 1: Matrix */}
            <div className={`p-8 rounded-2xl border hover:scale-[1.02] transition-all flex flex-col justify-between ${darkMode ? 'bg-neutral-900/50 border-neutral-800/80' : 'bg-white border-neutral-200'}`}>
              <div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-6">
                  <Grid3X3 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-extrabold mb-3">{t.feature_matrix_title}</h3>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{t.feature_matrix_desc}</p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-indigo-400 gap-1 cursor-pointer">
                <span>{isRtl ? "امتحان جدول ۲ بعدی" : "View Inventory Grid"}</span>
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {/* Feature 2: Size Advisor */}
            <div className={`p-8 rounded-2xl border hover:scale-[1.02] transition-all flex flex-col justify-between ${darkMode ? 'bg-neutral-900/50 border-neutral-800/80' : 'bg-white border-neutral-200'}`}>
              <div>
                <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl w-fit mb-6">
                  <Sliders className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-extrabold mb-3">{t.feature_advisor_title}</h3>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{t.feature_advisor_desc}</p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-sky-400 gap-1 cursor-pointer">
                <span>{isRtl ? "راه اندازی محاسبات آفلاین" : "Launch Offline Engine"}</span>
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

            {/* Feature 3: Image Compressor */}
            <div className={`p-8 rounded-2xl border hover:scale-[1.02] transition-all flex flex-col justify-between ${darkMode ? 'bg-neutral-900/50 border-neutral-800/80' : 'bg-white border-neutral-200'}`}>
              <div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-6">
                  <FileImage className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-extrabold mb-3">{t.feature_compress_title}</h3>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{t.feature_compress_desc}</p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-emerald-400 gap-1 cursor-pointer">
                <span>{isRtl ? "آشنایی با متد Canvas" : "Canvas Scaling Specs"}</span>
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* LIVE INTERACTIVE DEMO (SIZE ADVISOR ENGINE EXPLAINED) */}
      <section id="demo-interactive-section" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-12">
            <span className="text-xs font-black tracking-widest text-sky-500 uppercase">{isRtl ? "دموی تعاملی و ابزار زنده" : "Live Interactive Demo"}</span>
            <h2 className="text-3xl font-extrabold mt-2">{isRtl ? "موتور هوشمند پیشنهاد سایز را امتحان کنید" : "Experience the Offline Size Advisor Widget"}</h2>
            <p className={`text-sm mt-3 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {isRtl ? "ورودی‌های فرضی قد و وزن را تغییر دهید تا نحوه فیلتر کردن هوشمند ماتریس سایز را به صورت آفلاین مشاهده کنید." : "Modify your physical dimensions to observe how the client-side calculator filters size guidelines in real time."}
            </p>
          </div>

          <div className={`p-8 rounded-2xl border shadow-xl ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <div className="grid sm:grid-cols-2 gap-8">
              
              {/* Form Input fields */}
              <div className="space-y-4">
                
                {/* Clothing Type Selector (5 System Clothing Types) */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-neutral-400">{isRtl ? "انتخاب دسته لباس اصلی (Clothing Type):" : "Select Main Clothing Type:"}</label>
                  <div className="grid grid-cols-5 gap-1 bg-neutral-950/40 p-1 rounded-xl border border-white/5 text-[10px] text-center font-bold">
                    <button
                      type="button"
                      onClick={() => { setDemoClothingType('tops'); setDemoResult(''); }}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${demoClothingType === 'tops' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      {isRtl ? "بالاتنه" : "Tops"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDemoClothingType('bottoms'); setDemoResult(''); }}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${demoClothingType === 'bottoms' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      {isRtl ? "پایین‌تنه" : "Bottoms"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDemoClothingType('footwear'); setDemoResult(''); }}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${demoClothingType === 'footwear' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      {isRtl ? "کفش" : "Shoes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDemoClothingType('one_piece'); setDemoResult(''); }}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${demoClothingType === 'one_piece' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      {isRtl ? "سرهمی" : "OnePiece"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDemoClothingType('accessories'); setDemoResult(''); }}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer ${demoClothingType === 'accessories' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      {isRtl ? "اکسسوری" : "Acc"}
                    </button>
                  </div>
                </div>

                {/* Mode Selector */}
                {demoClothingType !== 'accessories' && demoClothingType !== 'footwear' && (
                  <div className="flex bg-neutral-950/20 p-1 rounded-lg border border-white/5">
                    <button
                      type="button"
                      onClick={() => setDemoIsPrecisionMode(false)}
                      className={`flex-1 py-1.5 text-center text-xs font-bold rounded transition-all cursor-pointer ${!demoIsPrecisionMode ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      {isRtl ? "محاسبه هوشمند (قد و وزن)" : "Smart Estimation"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoIsPrecisionMode(true)}
                      className={`flex-1 py-1.5 text-center text-xs font-bold rounded transition-all cursor-pointer ${demoIsPrecisionMode ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      {isRtl ? "ورود دقیق اندازه‌ها" : "Exact Measurements"}
                    </button>
                  </div>
                )}

                {demoClothingType === 'footwear' ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold text-neutral-400">{isRtl ? "طول پا (سانتی‌متر):" : "Foot Length (cm):"}</label>
                        <span className="text-xs font-extrabold text-sky-500">{demoFootLength} cm</span>
                      </div>
                      <input 
                        type="range" 
                        min="21.0" 
                        max="31.0" 
                        step="0.5"
                        value={demoFootLength}
                        onChange={(e) => setDemoFootLength(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-normal bg-sky-950/20 p-2.5 rounded-lg border border-sky-500/10">
                      {isRtl ? "راهنما: پاشنه پا را به دیوار تکیه دهید و طول بلندترین انگشت تا پاشنه را بر حسب سانتی‌متر اندازه بگیرید." : "Tip: Place heel against a wall and measure length to longest toe in cm."}
                    </p>
                  </div>
                ) : demoClothingType === 'accessories' ? (
                  <div className="p-4 rounded-xl bg-neutral-950/20 border border-white/5 text-center space-y-2">
                    <p className="text-xs font-bold text-neutral-300">{isRtl ? "محصولات دسته اکسسوری فری‌سایز یا تک‌سایز هستند." : "Accessory items are Free Size / One-Size."}</p>
                    <p className="text-[10px] text-neutral-400">{isRtl ? "نیاز به وارد کردن ابعاد خاصی وجود ندارد." : "No specific body measurements required."}</p>
                  </div>
                ) : !demoIsPrecisionMode ? (
                  <>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold text-neutral-400">{t.height_cm}</label>
                        <span className="text-xs font-extrabold text-sky-500">{demoHeight} cm</span>
                      </div>
                      <input 
                        type="range" 
                        min="140" 
                        max="220" 
                        value={demoHeight}
                        onChange={(e) => setDemoHeight(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-bold text-neutral-400">{t.weight_kg}</label>
                        <span className="text-xs font-extrabold text-sky-500">{demoWeight} kg</span>
                      </div>
                      <input 
                        type="range" 
                        min="40" 
                        max="140" 
                        value={demoWeight}
                        onChange={(e) => setDemoWeight(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.body_shape}</label>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => setDemoShape('slim')}
                          className={`py-2 px-1 text-[10px] font-semibold rounded-lg border transition-all ${demoShape === 'slim' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-neutral-800 text-neutral-400'}`}
                        >
                          {t.shape_slim}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDemoShape('regular')}
                          className={`py-2 px-1 text-[10px] font-semibold rounded-lg border transition-all ${demoShape === 'regular' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-neutral-800 text-neutral-400'}`}
                        >
                          {isRtl ? "معمولی" : "Regular"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDemoShape('athletic')}
                          className={`py-2 px-1 text-[10px] font-semibold rounded-lg border transition-all ${demoShape === 'athletic' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-neutral-800 text-neutral-400'}`}
                        >
                          {t.shape_athletic}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDemoShape('heavy')}
                          className={`py-2 px-1 text-[10px] font-semibold rounded-lg border transition-all ${demoShape === 'heavy' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-neutral-800 text-neutral-400'}`}
                        >
                          {t.shape_heavy}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 p-3 rounded-xl bg-sky-950/10 border border-sky-500/10">
                    {(demoClothingType === 'tops' || demoClothingType === 'one_piece') && (
                      <div>
                        <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                          <span>{isRtl ? "دور سینه (بالاتنه)" : "Chest / Bust"}</span>
                          <span className="text-sky-500 font-extrabold">{demoChest} cm</span>
                        </div>
                        <input
                          type="range"
                          min="70"
                          max="140"
                          value={demoChest}
                          onChange={(e) => setDemoChest(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    )}

                    {(demoClothingType === 'bottoms' || demoClothingType === 'one_piece') && (
                      <div>
                        <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                          <span>{isRtl ? "دور کمر (پایین‌تنه)" : "Waistline"}</span>
                          <span className="text-sky-500 font-extrabold">{demoWaist} cm</span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="130"
                          value={demoWaist}
                          onChange={(e) => setDemoWaist(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    )}

                    {(demoClothingType === 'bottoms' || demoClothingType === 'one_piece') && (
                      <div>
                        <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                          <span>{isRtl ? "دور باسن" : "Hip Width"}</span>
                          <span className="text-sky-500 font-extrabold">{demoHip} cm</span>
                        </div>
                        <input
                          type="range"
                          min="70"
                          max="140"
                          value={demoHip}
                          onChange={(e) => setDemoHip(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    )}

                    {demoClothingType === 'tops' && (
                      <div>
                        <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                          <span>{isRtl ? "عرض سرشانه" : "Shoulder Width"}</span>
                          <span className="text-sky-500 font-extrabold">{demoShoulder} cm</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="60"
                          value={demoShoulder}
                          onChange={(e) => setDemoShoulder(Number(e.target.value))}
                          className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={calculateDemoSize}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold rounded-lg transition-all cursor-pointer shadow-lg shadow-sky-600/20"
                >
                  {t.calculate_size}
                </button>
              </div>

              {/* Dynamic Sizing recommendation Output - Single Specific Size */}
              <div className="flex flex-col justify-between bg-neutral-950/20 rounded-xl p-5 border border-neutral-800/40 min-h-[240px]">
                <div className="text-center mb-2">
                  <p className="text-xs text-neutral-400 font-bold">{isRtl ? "پیشنهاد تک‌سایز اختصاصی این محصول" : "Definitive Single Size Output"}</p>
                </div>
                
                {demoResult ? (
                  <div className="space-y-4 my-auto">
                    <div className="p-5 bg-gradient-to-b from-sky-500/15 to-indigo-500/10 border border-sky-500/30 rounded-2xl text-center shadow-xl">
                      <span className="block text-xs font-extrabold text-sky-400 mb-1 uppercase tracking-wider">
                        {demoClothingType === 'tops' && (isRtl ? "سایز پیشنهادی بالاتنه" : "Recommended Tops Size")}
                        {demoClothingType === 'bottoms' && (isRtl ? "سایز پیشنهادی پایین‌تنه" : "Recommended Bottoms Size")}
                        {demoClothingType === 'footwear' && (isRtl ? "سایز پیشنهادی کفش (اروپایی)" : "Recommended Shoe Size")}
                        {demoClothingType === 'one_piece' && (isRtl ? "سایز پیشنهادی سرهمی" : "Recommended OnePiece Size")}
                        {demoClothingType === 'accessories' && (isRtl ? "وضعیت اکسسوری" : "Accessory Status")}
                      </span>
                      <span className="block text-4xl font-black text-white my-2 tracking-tight">{demoResult}</span>
                      <span className="block text-[11px] text-sky-200/80 leading-snug">{demoFitHint}</span>
                    </div>

                    <div className="text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? "تک‌سایز دقیق محاسبه‌شده بدون نمایش بازه" : "Single definitive size output (No ranges)"}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-500 text-xs py-12">
                    {isRtl ? "تنظیمات را مشخص کرده و روی دکمه محاسبه کلیک کنید" : "Adjust inputs and click calculate size"}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* STEPS EXPLANATORY */}
      <section className={`py-16 px-6 ${darkMode ? 'bg-neutral-900/50' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-12">{t.how_it_works}</h2>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-sky-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg shadow-lg shadow-sky-500/15">۱</div>
              <h3 className="font-extrabold text-lg">{t.step_1}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">{t.step_1_desc}</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg shadow-lg shadow-indigo-500/15">۲</div>
              <h3 className="font-extrabold text-lg">{t.step_2}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">{t.step_2_desc}</p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto text-lg shadow-lg shadow-emerald-500/15">۳</div>
              <h3 className="font-extrabold text-lg">{t.step_3}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">{t.step_3_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-neutral-800 text-center text-xs text-neutral-400">
        <p>© 2026 SizeGrid App. {isRtl ? "طراحی شده برای زیرساخت Coolify" : "Engineered for Coolify PaaS deployments with Docker."}</p>
      </footer>

    </div>
  );
}
