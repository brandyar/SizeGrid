import React, { useState, useEffect } from 'react';
import { locales } from '../locales';
import { DirectusAPI } from '../directus';
import { useRouter } from './Router';
import { Product, InventoryItem, Color, Size, User } from '../types';
import {
  Sparkles,
  ShoppingBag,
  Sliders,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Compass,
  ArrowRight,
  Info,
  Globe,
  Sun,
  Moon,
  Ruler,
  Maximize2
} from 'lucide-react';

interface StorefrontProps {
  lang: 'fa' | 'en';
  setLang: (lang: 'fa' | 'en') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function Storefront({ lang, setLang, darkMode, setDarkMode }: StorefrontProps) {
  const { params, navigate } = useRouter();
  const t = locales[lang];
  const isRtl = lang === 'fa';

  // Resolved States
  const [merchant, setMerchant] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [sizeGuides, setSizeGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Picker Selections
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);

  // Active Selected Variant Details
  const [activeVariant, setActiveVariant] = useState<InventoryItem | null>(null);

  // Advisor States
  const [advHeight, setAdvHeight] = useState<number>(170);
  const [advWeight, setAdvWeight] = useState<number>(65);
  const [advShape, setAdvShape] = useState<'slim' | 'athletic' | 'heavy'>('athletic');
  const [calculatedRec, setCalculatedRec] = useState<string>('');
  const [advisorMessage, setAdvisorMessage] = useState<string>('');
  const [advisorIsAvailable, setAdvisorIsAvailable] = useState<boolean>(false);

  // Parse parameters from route
  const shopSlug = params.shop_slug || 'luxury-garments';
  const productId = Number(params.product_id) || 101;

  const loadStorefront = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Resolve merchant slug
      const resolvedMerchant = await DirectusAPI.getMerchantBySlug(shopSlug);
      if (!resolvedMerchant) {
        throw new Error(isRtl ? "فروشگاهی با این آدرس پیدا نشد" : "No registered merchant matched this URL.");
      }
      setMerchant(resolvedMerchant);

      // 2. Fetch product dependencies
      const details = await DirectusAPI.getProductForStorefront(productId);
      if (!details) {
        throw new Error(isRtl ? "محصول مورد نظر یافت نشد" : "This product does not exist in the merchant catalog.");
      }

      setProduct(details.product);
      setInventory(details.inventory);
      setColors(details.colors);
      setSizes(details.sizes);
      setSizeGuides(details.sizeGuides || []);

      // Pre-select first color & size that are enabled
      if (details.colors.length > 0) setSelectedColor(details.colors[0]);
      if (details.sizes.length > 0) setSelectedSize(details.sizes[1] || details.sizes[0]);

    } catch (err: any) {
      setError(err.message || (isRtl ? "خطا در بارگذاری فروشگاه." : "Failed to load public storefront."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorefront();
  }, [shopSlug, productId]);

  // Update dynamic variant picker whenever selection changes
  useEffect(() => {
    if (selectedColor && selectedSize && inventory.length > 0) {
      const match = inventory.find(
        i => i.color_id === selectedColor.id && i.size_id === selectedSize.id
      );
      setActiveVariant(match || null);
    } else {
      setActiveVariant(null);
    }
  }, [selectedColor, selectedSize, inventory]);

  // --- CLIENT SIZE ADVISOR CALCULATOR ---
  const runSizeAdvisorCalculations = () => {
    if (!product) return;
    setCalculatedRec('');
    setAdvisorMessage('');
    setAdvisorIsAvailable(false);

    let theorizedSize = '';

    // Walk through active size guides to find matching bounds
    let bestMatchSizeId: number | null = null;
    for (const guide of sizeGuides) {
      const rawMeas = typeof guide.measurements === 'string'
        ? JSON.parse(guide.measurements)
        : guide.measurements;

      const minH = Number(rawMeas?.min_height ?? 150);
      const maxH = Number(rawMeas?.max_height ?? 180);
      const minW = Number(rawMeas?.min_weight ?? 50);
      const maxW = Number(rawMeas?.max_weight ?? 80);
      const compatibleShapes = rawMeas?.shapes || { slim: true, athletic: true, heavy: false };

      if (
        advHeight >= minH &&
        advHeight <= maxH &&
        advWeight >= minW &&
        advWeight <= maxW &&
        compatibleShapes[advShape] === true
      ) {
        bestMatchSizeId = guide.size_id;
        break;
      }
    }

    if (bestMatchSizeId) {
      const sizeObj = sizes.find(s => s.id === bestMatchSizeId);
      if (sizeObj) {
        theorizedSize = sizeObj.name;
      }
    }

    // Default sizing fallback if out of bounds or no active guide matches
    if (!theorizedSize) {
      if (advHeight < 165) theorizedSize = 'S';
      else if (advHeight < 178) theorizedSize = 'M';
      else if (advHeight < 188) theorizedSize = 'L';
      else theorizedSize = 'XL';
    }

    // Now cross-reference with our ACTIVE inventory matrix
    // Find if the recommended size is currently available in stock (any color)
    const activeInventoryInSize = inventory.filter(
      item => {
        const sizeObj = sizes.find(s => s.id === item.size_id);
        return sizeObj?.name === theorizedSize && item.stock > 0;
      }
    );

    setCalculatedRec(theorizedSize);

    if (activeInventoryInSize.length > 0) {
      setAdvisorIsAvailable(true);
      
      const availableColors = activeInventoryInSize.map(item => {
        const colObj = colors.find(c => c.id === item.color_id);
        return isRtl ? colObj?.name_fa : colObj?.name_en;
      }).filter(Boolean).join('، ');

      setAdvisorMessage(
        isRtl 
          ? `سایز ${theorizedSize} ایده‌آل شماست و هم‌اکنون موجود است!`
          : `Size ${theorizedSize} fits you perfectly and is currently in stock!`
      );

      // Auto-select the size in the variant picker to help buyer checkout!
      const matchSizeObj = sizes.find(s => s.name === theorizedSize);
      if (matchSizeObj) {
        setSelectedSize(matchSizeObj);
      }
    } else {
      setAdvisorIsAvailable(false);
      
      const allInStockSizes = inventory
        .filter(item => item.stock > 0)
        .map(item => sizes.find(s => s.id === item.size_id)?.name)
        .filter(Boolean);

      if (allInStockSizes.length > 0) {
        setAdvisorMessage(
          isRtl
            ? `اندازه علمی شما ${theorizedSize} است، اما متاسفانه تمام شده. سایر سایزهای موجود: ${Array.from(new Set(allInStockSizes)).join(', ')}`
            : `Your calculated size is ${theorizedSize}, but it is out of stock. Alternative sizes in stock: ${Array.from(new Set(allInStockSizes)).join(', ')}`
        );
      } else {
        setAdvisorMessage(
          isRtl
            ? `سایز ${theorizedSize} برای شما مناسب است اما متاسفانه کل انبار این محصول در حال حاضر خالی است.`
            : `Your calculated size is ${theorizedSize}, but this product is completely out of stock.`
        );
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${darkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* STOREFRONT STICKY SUB-HEADER */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${darkMode ? 'bg-neutral-950/85 border-neutral-800' : 'bg-white/85 border-neutral-200'} px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Shop information brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-neutral-400 block">{isRtl ? "خرید از فروشگاه" : "Buying From"}</span>
              <h1 className="text-sm font-black text-indigo-400 tracking-tight leading-none">
                {merchant?.shop_name || "SizeGrid Merchant"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Controls */}
            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className="p-2 border rounded-lg text-xs font-semibold hover:bg-neutral-500/10 border-neutral-800 text-neutral-300"
            >
              {lang === 'fa' ? 'English' : 'فارسی'}
            </button>

            {/* Dark Mode switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border rounded-lg border-neutral-800 text-neutral-300 hover:bg-neutral-800"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>
            
            {/* Direct Dashboard Back link */}
            <a
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1 py-1.5 px-3 bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300 rounded-lg hover:bg-neutral-700 transition-all font-bold"
            >
              <span>{isRtl ? "ورود فروشنده" : "Merchant Panel"}</span>
            </a>
          </div>

        </div>
      </header>

      {/* BODY WORKSPACE */}
      <main className="flex-grow py-12 px-6 max-w-7xl w-full mx-auto">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-400 font-bold">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto text-center py-12 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 space-y-4">
            <XCircle className="w-12 h-12 mx-auto" />
            <h3 className="font-extrabold text-base">{isRtl ? "خطا در برقراری ارتباط" : "Connection Error"}</h3>
            <p className="text-xs leading-relaxed">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500"
            >
              {isRtl ? "بازگشت به خانه" : "Go to Homepage"}
            </button>
          </div>
        ) : product && (
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Product Images & Specifications */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="h-[400px] bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden relative shadow-lg">
                {product.image ? (
                  <img src={product.image} alt={product.name_fa} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col justify-center items-center text-neutral-600">
                    <ShoppingBag className="w-12 h-12 opacity-30 mb-2" />
                    <span className="text-xs">{isRtl ? "فاقد تصویر" : "No Product Image"}</span>
                  </div>
                )}
                
                <span className="absolute top-4 left-4 px-3 py-1 bg-indigo-600 text-white font-extrabold text-xs rounded-full shadow-lg">
                  {product.category}
                </span>
              </div>

              {/* Product Info Description */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black">{isRtl ? product.name_fa : product.name_en}</h2>
                  <p className="text-xs font-extrabold text-neutral-400 mt-1">ID: #{product.id}</p>
                </div>

                <div className={`p-4 rounded-xl text-xs leading-relaxed border ${darkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                  {isRtl ? product.description_fa : product.description_en}
                </div>
              </div>

            </div>

            {/* Right: Picker and SIZE ADVISOR widget (Bento Grid Style) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Product price & variant interactive picker card */}
              <div className={`p-6 rounded-2xl border shadow-xl ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t.variant_picker}</span>
                  
                  {/* Dynamic Interactive price */}
                  <div className="text-right">
                    <p className="text-xs text-neutral-400 font-semibold">{isRtl ? "مبلغ نهایی با متغیر" : "Selected price"}</p>
                    <p className="text-2xl font-black text-emerald-400">
                      {activeVariant ? (
                        isRtl 
                          ? `${activeVariant.price.toLocaleString('fa-IR')} تومان`
                          : `$${(activeVariant.price / 50000).toFixed(1)} USD`
                      ) : (
                        isRtl 
                          ? `${product.base_price.toLocaleString('fa-IR')} تومان`
                          : `$${(product.base_price / 50000).toFixed(1)} USD`
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Colors List Picker */}
                  <div>
                    <label className="block text-xs font-extrabold text-neutral-400 mb-2">{t.colors}</label>
                    <div className="flex flex-wrap gap-3">
                      {colors.map(col => {
                        const isSelected = selectedColor?.id === col.id;
                        return (
                          <button
                            key={col.id}
                            onClick={() => setSelectedColor(col)}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-2 ring-indigo-500/20' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0" style={{ backgroundColor: col.hex_code }} />
                            <span>{isRtl ? col.name_fa : col.name_en}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sizes List Picker */}
                  <div>
                    <label className="block text-xs font-extrabold text-neutral-400 mb-2">{t.sizes}</label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map(sz => {
                        const isSelected = selectedSize?.id === sz.id;
                        // check if this size for the active color has stock
                        const corrInv = inventory.find(i => i.color_id === selectedColor?.id && i.size_id === sz.id);
                        const isEnabled = corrInv && corrInv.stock > 0;

                        return (
                          <button
                            key={sz.id}
                            disabled={!corrInv} // disable if not created in matrix
                            onClick={() => setSelectedSize(sz)}
                            className={`w-12 h-11 rounded-xl border font-black text-xs flex flex-col items-center justify-center transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/20' : corrInv ? 'border-neutral-800 text-neutral-300 hover:border-neutral-700' : 'border-neutral-900 text-neutral-600 bg-neutral-950/25 cursor-not-allowed opacity-30'}`}
                          >
                            <span>{sz.name}</span>
                            {corrInv && (
                              <span className={`text-[8px] font-normal leading-none ${corrInv.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {corrInv.stock > 0 ? `${corrInv.stock}x` : '0x'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock Availability indicator status line */}
                  <div className="pt-4 border-t border-neutral-800/60">
                    {activeVariant ? (
                      activeVariant.stock > 0 ? (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-bold">{t.in_stock}</span>
                          </div>
                          <span className="font-extrabold">{isRtl ? `${activeVariant.stock} عدد موجود است` : `${activeVariant.stock} units available`}</span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          <span className="font-bold">{t.out_of_stock}</span>
                        </div>
                      )
                    ) : (
                      <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs flex items-center gap-2">
                        <Info className="w-4 h-4 text-indigo-400" />
                        <span>{isRtl ? "این ترکیب رنگ و سایز توسط فروشنده تامین نشده است." : "This color-size combination is unavailable."}</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* OFFLINE CUSTOMER SIZE ADVISOR CLIENT WIDGET */}
              <div className={`p-6 rounded-2xl border shadow-xl bg-gradient-to-tr ${darkMode ? 'from-neutral-900 to-indigo-950/20 border-neutral-800' : 'from-white to-indigo-50/20 border-neutral-200'}`}>
                
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold">{t.size_advisor}</h3>
                    <p className="text-[10px] text-neutral-400 leading-none mt-0.5">{isRtl ? "برآورد قد و وزن و انطباق با جدول موجودی ماتریس" : "Accurate physical matching using real-time stock sync."}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 items-start">
                  
                  {/* Slider fields */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                        <span>{t.height_cm}</span>
                        <span className="text-indigo-400 font-extrabold">{advHeight} cm</span>
                      </div>
                      <input
                        type="range"
                        min="130"
                        max="220"
                        value={advHeight}
                        onChange={(e) => setAdvHeight(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                        <span>{t.weight_kg}</span>
                        <span className="text-indigo-400 font-extrabold">{advWeight} kg</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="140"
                        value={advWeight}
                        onChange={(e) => setAdvWeight(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-2">{t.body_shape}</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAdvShape('slim')}
                          className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all ${advShape === 'slim' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-neutral-800 text-neutral-400'}`}
                        >
                          {t.shape_slim}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdvShape('athletic')}
                          className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all ${advShape === 'athletic' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-neutral-800 text-neutral-400'}`}
                        >
                          {t.shape_athletic}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdvShape('heavy')}
                          className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all ${advShape === 'heavy' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-neutral-800 text-neutral-400'}`}
                        >
                          {t.shape_heavy}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={runSizeAdvisorCalculations}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all"
                    >
                      {t.calculate_size}
                    </button>
                  </div>

                  {/* Sizing advisor result box */}
                  <div className="p-6 rounded-xl bg-neutral-950/30 border border-neutral-800/60 flex flex-col justify-center items-center h-full text-center min-h-[180px]">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase mb-2">{t.recommended_size}</span>
                    
                    {calculatedRec ? (
                      <div className="space-y-3">
                        <p className="text-5xl font-black text-indigo-400 tracking-tight">{calculatedRec}</p>
                        
                        <div className={`p-3 rounded-lg text-xs leading-relaxed ${advisorIsAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {advisorMessage}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-neutral-400 py-6">
                        <Maximize2 className="w-8 h-8 mx-auto opacity-20" />
                        <p className="text-[10px]">{isRtl ? "ورودی‌های بدنی را مشخص کنید و پیشنهاد سایز را دریافت کنید." : "Provide parameters to calculate sizing match."}</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="py-8 border-t border-neutral-800 text-center text-xs text-neutral-400">
        <p>© 2026 SizeGrid Client Utility. Verified securely for direct customer deployment.</p>
      </footer>

    </div>
  );
}
