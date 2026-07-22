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
  const [advShape, setAdvShape] = useState<'slim' | 'regular' | 'athletic' | 'heavy'>('athletic');
  const [isPrecisionMode, setIsPrecisionMode] = useState<boolean>(false);
  const [advChest, setAdvChest] = useState<number>(95);
  const [advWaist, setAdvWaist] = useState<number>(85);
  const [advHip, setAdvHip] = useState<number>(98);
  const [advShoulder, setAdvShoulder] = useState<number>(42);
  const [advFootLength, setAdvFootLength] = useState<number>(26.5);
  const [calculatedRec, setCalculatedRec] = useState<string>('');
  const [calculatedRecTops, setCalculatedRecTops] = useState<string>('');
  const [calculatedRecBottoms, setCalculatedRecBottoms] = useState<string>('');
  const [fitHintTops, setFitHintTops] = useState<string>('');
  const [fitHintBottoms, setFitHintBottoms] = useState<string>('');
  const [advisorMessage, setAdvisorMessage] = useState<string>('');
  const [advisorIsAvailable, setAdvisorIsAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (!isPrecisionMode) {
      let chest = advWeight * 1.4;
      let waist = advWeight * 1.22;
      let hip = advWeight * 1.4;
      let shoulder = advHeight * 0.23;
      let foot = 21 + (advHeight - 150) * 0.12 + (advWeight - 50) * 0.03;

      if (advShape === 'slim') {
        chest = advWeight * 1.35 + (advHeight - 100) * 0.1;
        waist = advWeight * 1.10 + (advHeight - 100) * 0.1;
        hip = advWeight * 1.35 + (advHeight - 100) * 0.1;
        shoulder = advHeight * 0.22 - 1;
      } else if (advShape === 'athletic') {
        chest = advWeight * 1.45 + (advHeight - 100) * 0.1;
        waist = advWeight * 1.18 + (advHeight - 100) * 0.1;
        hip = advWeight * 1.42 + (advHeight - 100) * 0.1;
        shoulder = advHeight * 0.23 + 2;
      } else if (advShape === 'heavy') {
        chest = advWeight * 1.55 + (advHeight - 100) * 0.1;
        waist = advWeight * 1.45 + (advHeight - 100) * 0.1;
        hip = advWeight * 1.50 + (advHeight - 100) * 0.1;
        shoulder = advHeight * 0.23 + 1;
      } else { // regular
        chest = advWeight * 1.40 + (advHeight - 100) * 0.1;
        waist = advWeight * 1.22 + (advHeight - 100) * 0.1;
        hip = advWeight * 1.40 + (advHeight - 100) * 0.1;
        shoulder = advHeight * 0.23;
      }

      setAdvChest(Math.round(chest));
      setAdvWaist(Math.round(waist));
      setAdvHip(Math.round(hip));
      setAdvShoulder(Math.round(shoulder));
      setAdvFootLength(Number(foot.toFixed(1)));
    }
  }, [advHeight, advWeight, advShape, isPrecisionMode]);

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

  // --- Helper to detect exact clothing_type_slug ---
  const getClothingTypeSlug = (prod: any): 'tops' | 'bottoms' | 'footwear' | 'one_piece' | 'accessories' => {
    if (!prod) return 'tops';
    if (prod.clothing_type_slug) return prod.clothing_type_slug;
    const cat = (prod.category || '').toLowerCase();
    const nameEn = (prod.name_en || '').toLowerCase();
    const nameFa = (prod.name_fa || '').toLowerCase();

    if (cat.includes('footwear') || cat.includes('shoe') || cat.includes('کفش') || nameEn.includes('shoe') || nameFa.includes('کفش')) {
      return 'footwear';
    }
    if (cat.includes('pant') || cat.includes('bottom') || cat.includes('jean') || cat.includes('شلوار') || nameFa.includes('شلوار')) {
      return 'bottoms';
    }
    if (cat.includes('overall') || cat.includes('one_piece') || cat.includes('سرهمی') || nameFa.includes('سرهمی')) {
      return 'one_piece';
    }
    if (cat.includes('accessories') || cat.includes('کلاه') || cat.includes('جوراب') || nameFa.includes('اکسسوری')) {
      return 'accessories';
    }
    return 'tops';
  };

  // --- CLIENT SIZE ADVISOR CALCULATOR ---
  const runSizeAdvisorCalculations = () => {
    if (!product) return;
    setCalculatedRec('');
    setCalculatedRecTops('');
    setCalculatedRecBottoms('');
    setFitHintTops('');
    setFitHintBottoms('');
    setAdvisorMessage('');
    setAdvisorIsAvailable(false);

    // Helpers to retrieve specifications for any size (either custom from sizeGuides or standard nominals)
    const getTopsSpecs = (sizeName: string) => {
      const name = sizeName.toUpperCase().trim();
      // Try to find if there is an active custom sizeGuide defined by the merchant
      const guide = sizeGuides.find(g => {
        const sObj = sizes.find(s => s.id === g.size_id);
        return sObj?.name.toUpperCase().trim() === name;
      });

      if (guide) {
        const rawMeas = typeof guide.measurements === 'string' ? JSON.parse(guide.measurements) : guide.measurements;
        if (rawMeas && rawMeas.enabled) {
          return {
            min_chest: Number(rawMeas.min_chest || 80),
            max_chest: Number(rawMeas.max_chest || 130),
            min_shoulder: Number(rawMeas.min_shoulder || 35),
            max_shoulder: Number(rawMeas.max_shoulder || 55),
            min_height: Number(rawMeas.min_height || 140),
            max_height: Number(rawMeas.max_height || 210),
            shapes: rawMeas.shapes || { slim: true, regular: true, athletic: true, heavy: true }
          };
        }
      }

      // Default high-quality fallback nominals
      if (name.includes('XS') || name === '36' || name === '۳۶') {
        return { min_chest: 80, max_chest: 87, min_shoulder: 36, max_shoulder: 39, min_height: 150, max_height: 165, shapes: { slim: true, regular: true, athletic: false, heavy: false } };
      }
      if (name.includes('XXXL') || name === '46' || name === '۴۶') {
        return { min_chest: 116, max_chest: 125, min_shoulder: 48, max_shoulder: 51, min_height: 185, max_height: 205, shapes: { slim: false, regular: true, athletic: true, heavy: true } };
      }
      if (name.includes('XXL') || name === '44' || name === '۴۴') {
        return { min_chest: 110, max_chest: 116, min_shoulder: 46, max_shoulder: 48, min_height: 180, max_height: 195, shapes: { slim: false, regular: true, athletic: true, heavy: true } };
      }
      if (name.includes('XL') || name === '42' || name === '۴۲') {
        return { min_chest: 104, max_chest: 110, min_shoulder: 44, max_shoulder: 46, min_height: 175, max_height: 190, shapes: { slim: true, regular: true, athletic: true, heavy: true } };
      }
      if (name.includes('L') || name === '40' || name === '۴۰') {
        return { min_chest: 98, max_chest: 104, min_shoulder: 42, max_shoulder: 44, min_height: 170, max_height: 185, shapes: { slim: true, regular: true, athletic: true, heavy: true } };
      }
      if (name.includes('M') || name === '38' || name === '۳۸') {
        return { min_chest: 92, max_chest: 98, min_shoulder: 40, max_shoulder: 42, min_height: 165, max_height: 178, shapes: { slim: true, regular: true, athletic: true, heavy: false } };
      }
      if (name.includes('S') || name === '37' || name === '۳۷') {
        return { min_chest: 86, max_chest: 92, min_shoulder: 38, max_shoulder: 40, min_height: 155, max_height: 172, shapes: { slim: true, regular: true, athletic: true, heavy: false } };
      }
      return { min_chest: 92, max_chest: 98, min_shoulder: 40, max_shoulder: 42, min_height: 165, max_height: 178, shapes: { slim: true, regular: true, athletic: true, heavy: true } };
    };

    const getBottomsSpecs = (sizeName: string) => {
      const name = sizeName.toUpperCase().trim();
      const guide = sizeGuides.find(g => {
        const sObj = sizes.find(s => s.id === g.size_id);
        return sObj?.name.toUpperCase().trim() === name;
      });

      if (guide) {
        const rawMeas = typeof guide.measurements === 'string' ? JSON.parse(guide.measurements) : guide.measurements;
        if (rawMeas && rawMeas.enabled) {
          return {
            min_waist: Number(rawMeas.min_waist || 60),
            max_waist: Number(rawMeas.max_waist || 120),
            min_hip: Number(rawMeas.min_hip || 80),
            max_hip: Number(rawMeas.max_hip || 135),
            min_height: Number(rawMeas.min_height || 140),
            max_height: Number(rawMeas.max_height || 210),
            shapes: rawMeas.shapes || { slim: true, regular: true, athletic: true, heavy: true }
          };
        }
      }

      // Default high-quality fallback nominals
      if (name.includes('XS') || name === '36' || name === '۳۶') {
        return { min_waist: 60, max_waist: 68, min_hip: 84, max_hip: 90, min_height: 150, max_height: 165, shapes: { slim: true, regular: true, athletic: false, heavy: false } };
      }
      if (name.includes('XXXL') || name === '46' || name === '۴۶') {
        return { min_waist: 106, max_waist: 116, min_hip: 120, max_hip: 130, min_height: 185, max_height: 205, shapes: { slim: false, regular: true, athletic: true, heavy: true } };
      }
      if (name.includes('XXL') || name === '44' || name === '۴۴') {
        return { min_waist: 98, max_waist: 106, min_hip: 114, max_hip: 120, min_height: 180, max_height: 195, shapes: { slim: false, regular: true, athletic: true, heavy: true } };
      }
      if (name.includes('XL') || name === '42' || name === '۴۲') {
        return { min_waist: 90, max_waist: 98, min_hip: 108, max_hip: 114, min_height: 175, max_height: 190, shapes: { slim: true, regular: true, athletic: true, heavy: true } };
      }
      if (name.includes('L') || name === '40' || name === '۴۰') {
        return { min_waist: 82, max_waist: 90, min_hip: 102, max_hip: 108, min_height: 170, max_height: 185, shapes: { slim: true, regular: true, athletic: true, heavy: true } };
      }
      if (name.includes('M') || name === '38' || name === '۳۸') {
        return { min_waist: 74, max_waist: 82, min_hip: 96, max_hip: 102, min_height: 165, max_height: 178, shapes: { slim: true, regular: true, athletic: true, heavy: false } };
      }
      if (name.includes('S') || name === '37' || name === '۳۷') {
        return { min_waist: 66, max_waist: 74, min_hip: 90, max_hip: 96, min_height: 155, max_height: 172, shapes: { slim: true, regular: true, athletic: true, heavy: false } };
      }
      return { min_waist: 74, max_waist: 82, min_hip: 96, max_hip: 102, min_height: 165, max_height: 178, shapes: { slim: true, regular: true, athletic: true, heavy: true } };
    };

    // Calculate best Tops Size
    let bestTopsSize = '';
    let minTopsPenalty = 999999;
    
    // Calculate best Bottoms Size
    let bestBottomsSize = '';
    let minBottomsPenalty = 999999;

    const targetSizes = sizes.length > 0 ? sizes.map(s => s.name) : ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

    for (const sizeName of targetSizes) {
      // Tops penalty calculation
      const topSpec = getTopsSpecs(sizeName);
      let topsPenalty = 0;

      // Chest
      if (advChest < topSpec.min_chest) {
        topsPenalty += (topSpec.min_chest - advChest) * 1.5; // Slightly loose
      } else if (advChest > topSpec.max_chest) {
        topsPenalty += (advChest - topSpec.max_chest) * 4.5; // Too tight!
      }

      // Shoulder
      if (advShoulder < topSpec.min_shoulder) {
        topsPenalty += (topSpec.min_shoulder - advShoulder) * 1.0;
      } else if (advShoulder > topSpec.max_shoulder) {
        topsPenalty += (advShoulder - topSpec.max_shoulder) * 4.0; // Tight shoulders are very uncomfortable
      }

      // Height
      if (advHeight < topSpec.min_height) {
        topsPenalty += (topSpec.min_height - advHeight) * 0.4;
      } else if (advHeight > topSpec.max_height) {
        topsPenalty += (advHeight - topSpec.max_height) * 1.5; // Short length!
      }

      // Shape
      const shapeMatch = topSpec.shapes[advShape] === true || topSpec.shapes[advShape] === undefined;
      if (!shapeMatch) {
        topsPenalty += 10;
      }

      if (topsPenalty < minTopsPenalty) {
        minTopsPenalty = topsPenalty;
        bestTopsSize = sizeName;
      }

      // Bottoms penalty calculation
      const botSpec = getBottomsSpecs(sizeName);
      let bottomsPenalty = 0;

      // Waist
      if (advWaist < botSpec.min_waist) {
        bottomsPenalty += (botSpec.min_waist - advWaist) * 1.2; // Slightly loose waist, can wear with belt
      } else if (advWaist > botSpec.max_waist) {
        bottomsPenalty += (advWaist - botSpec.max_waist) * 5.0; // Waist is tight, impossible to button!
      }

      // Hip
      if (advHip < botSpec.min_hip) {
        bottomsPenalty += (botSpec.min_hip - advHip) * 1.0;
      } else if (advHip > botSpec.max_hip) {
        bottomsPenalty += (advHip - botSpec.max_hip) * 4.0; // Too tight hip is uncomfortable
      }

      // Height
      if (advHeight < botSpec.min_height) {
        bottomsPenalty += (botSpec.min_height - advHeight) * 0.3;
      } else if (advHeight > botSpec.max_height) {
        bottomsPenalty += (advHeight - botSpec.max_height) * 1.2; // Too short pants!
      }

      // Shape
      const botShapeMatch = botSpec.shapes[advShape] === true || botSpec.shapes[advShape] === undefined;
      if (!botShapeMatch) {
        bottomsPenalty += 10;
      }

      if (bottomsPenalty < minBottomsPenalty) {
        minBottomsPenalty = bottomsPenalty;
        bestBottomsSize = sizeName;
      }
    }

    // Footwear calculation
    let bestShoeSize = '42';
    if (advFootLength <= 23.5) bestShoeSize = '37';
    else if (advFootLength <= 24.2) bestShoeSize = '38';
    else if (advFootLength <= 25.0) bestShoeSize = '39';
    else if (advFootLength <= 25.8) bestShoeSize = '40';
    else if (advFootLength <= 26.5) bestShoeSize = '41';
    else if (advFootLength <= 27.2) bestShoeSize = '42';
    else if (advFootLength <= 28.0) bestShoeSize = '43';
    else if (advFootLength <= 28.8) bestShoeSize = '44';
    else bestShoeSize = '45';

    // One-piece calculation
    let bestOnePieceSize = 'M';
    if (advHeight < 162 && advChest < 90) bestOnePieceSize = 'S';
    else if (advHeight < 174 && advChest < 100) bestOnePieceSize = 'M';
    else if (advHeight < 185 && advChest < 110) bestOnePieceSize = 'L';
    else bestOnePieceSize = 'XL';

    // Accessories
    const bestAccessories = isRtl ? "تک‌سایز (Free Size)" : "Free Size";

    // Determine resolved product size based on exact clothingType
    const clothingType = getClothingTypeSlug(product);
    let resolvedProductSize = 'M';
    let fitHint = '';

    if (clothingType === 'tops') {
      resolvedProductSize = bestTopsSize;
      fitHint = isRtl ? `اندازه دقیق بر اساس دور سینه ${advChest} cm و عرض سرشانه ${advShoulder} cm` : `Calculated for chest ${advChest} cm`;
    } else if (clothingType === 'bottoms') {
      resolvedProductSize = bestBottomsSize;
      fitHint = isRtl ? `اندازه دقیق بر اساس دور کمر ${advWaist} cm و دور باسن ${advHip} cm` : `Calculated for waist ${advWaist} cm`;
    } else if (clothingType === 'footwear') {
      resolvedProductSize = bestShoeSize;
      fitHint = isRtl ? `بر اساس طول پا ${advFootLength} cm (استاندارد اروپایی EU)` : `Calculated for foot length ${advFootLength} cm`;
    } else if (clothingType === 'one_piece') {
      resolvedProductSize = bestOnePieceSize;
      fitHint = isRtl ? `بر اساس قد ${advHeight} cm و فرم کلی بدن` : `Calculated for total height & body shape`;
    } else {
      resolvedProductSize = bestAccessories;
      fitHint = isRtl ? "مناسب برای تمام اندازه‌ها (Free Size)" : "Fits all standard dimensions";
    }

    // Set states
    setCalculatedRecTops(bestTopsSize);
    setCalculatedRecBottoms(bestBottomsSize);
    setFitHintTops(fitHint);
    setFitHintBottoms(fitHint);
    setCalculatedRec(resolvedProductSize);

    if (clothingType === 'accessories') {
      setAdvisorIsAvailable(true);
      setAdvisorMessage(
        isRtl ? "این محصول اکسسوری است و فری‌سایز (تک‌سایز) می‌باشد." : "This item is an accessory and is Free Size."
      );
      if (sizes.length > 0) setSelectedSize(sizes[0]);
      return;
    }

    // Cross-reference with active inventory for this product
    const activeInventoryInSize = inventory.filter(
      item => {
        const sizeObj = sizes.find(s => s.id === item.size_id);
        if (!sizeObj) return false;
        const sName = sizeObj.name.toUpperCase().trim();
        const rName = resolvedProductSize.toUpperCase().trim();
        return (sName === rName || sName.includes(rName) || rName.includes(sName)) && item.stock > 0;
      }
    );

    if (activeInventoryInSize.length > 0) {
      setAdvisorIsAvailable(true);
      setAdvisorMessage(
        isRtl 
          ? `سایز پیشنهادی برای این محصول: سایز ${resolvedProductSize} است (${fitHint}) و هم‌اکنون موجود است!`
          : `Size ${resolvedProductSize} is recommended for this product (${fitHint}) and is in stock!`
      );

      // Auto-select the size in the variant picker
      const matchSizeObj = sizes.find(s => {
        const sName = s.name.toUpperCase().trim();
        const rName = resolvedProductSize.toUpperCase().trim();
        return sName === rName || sName.includes(rName) || rName.includes(sName);
      });
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
            ? `اندازه دقیق بدنی شما برای این محصول ${resolvedProductSize} است (${fitHint}) اما متاسفانه این سایز ناموجود است. سایزهای موجود: ${Array.from(new Set(allInStockSizes)).join(', ')}`
            : `Your physical match is ${resolvedProductSize} (${fitHint}), but it is currently out of stock. Alternative sizes in stock: ${Array.from(new Set(allInStockSizes)).join(', ')}`
        );
      } else {
        setAdvisorMessage(
          isRtl
            ? `سایز ایده آل شما ${resolvedProductSize} است (${fitHint}) اما کل موجودی این کالا در انبار به اتمام رسیده است.`
            : `Your calculated size is ${resolvedProductSize} (${fitHint}), but this product is completely out of stock.`
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
                    <p className="text-[10px] text-neutral-400 leading-none mt-0.5">{isRtl ? "سیستم هوشمند دو مرحله‌ای برآورد و انطباق سایز" : "Intelligent 2-Tier matching using real-time sync."}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 items-start">
                  
                  {/* Slider fields */}
                  <div className="space-y-4 font-vazirmatn">
                    {/* Toggle Mode */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/20 border border-white/5">
                      <span className="text-xs font-extrabold text-neutral-300">
                        {isRtl ? "من اندازه‌های دقیق بدنم را می‌دانم" : "I know my exact measurements"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPrecisionMode(!isPrecisionMode)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPrecisionMode ? 'bg-indigo-600' : 'bg-neutral-800'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPrecisionMode ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {!isPrecisionMode ? (
                      /* Tier 1 (Quick Mode) Inputs */
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
                          <div className="grid grid-cols-4 gap-1">
                            <button
                              type="button"
                              onClick={() => setAdvShape('slim')}
                              className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${advShape === 'slim' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-neutral-800 text-neutral-400'}`}
                            >
                              {t.shape_slim}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdvShape('regular')}
                              className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${advShape === 'regular' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-neutral-800 text-neutral-400'}`}
                            >
                              {isRtl ? "معمولی" : "Regular"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdvShape('athletic')}
                              className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${advShape === 'athletic' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-neutral-800 text-neutral-400'}`}
                            >
                              {t.shape_athletic}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdvShape('heavy')}
                              className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${advShape === 'heavy' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-neutral-800 text-neutral-400'}`}
                            >
                              {t.shape_heavy}
                            </button>
                          </div>
                        </div>

                        {/* Estimated Dimensions Summary */}
                        <div className="p-2.5 rounded-lg bg-neutral-950/20 border border-white/5 text-[10px] text-neutral-400 space-y-1">
                          <p className="font-extrabold text-[11px] text-neutral-300">{isRtl ? "ابعاد تخمینی بدن شما (محاسبه خودکار):" : "Your estimated body dimensions (auto):"}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>{isRtl ? `دور سینه: ${advChest} سانتی‌متر` : `Chest/Bust: ${advChest} cm`}</div>
                            <div>{isRtl ? `دور کمر: ${advWaist} سانتی‌متر` : `Waist: ${advWaist} cm`}</div>
                            <div>{isRtl ? `دور باسن: ${advHip} سانتی‌متر` : `Hips: ${advHip} cm`}</div>
                            <div>{isRtl ? `عرض سرشانه: ${advShoulder} سانتی‌متر` : `Shoulders: ${advShoulder} cm`}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Tier 2 (Precision Mode) Inputs */
                      <div className="space-y-3 p-3 rounded-xl bg-indigo-950/10 border border-indigo-500/10">
                        <p className="text-[11px] font-extrabold text-indigo-400 mb-2">
                          {isRtl ? "لطفاً اندازه‌های دقیق دور بدن خود را وارد کنید (سانتی‌متر):" : "Please input your exact body measurements (cm):"}
                        </p>
                        
                        <div>
                          <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                            <span>{isRtl ? "دور سینه" : "Chest / Bust"}</span>
                            <span className="text-indigo-400 font-extrabold">{advChest} cm</span>
                          </div>
                          <input
                            type="range"
                            min="70"
                            max="140"
                            value={advChest}
                            onChange={(e) => setAdvChest(Number(e.target.value))}
                            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                            <span>{isRtl ? "دور کمر" : "Waistline"}</span>
                            <span className="text-indigo-400 font-extrabold">{advWaist} cm</span>
                          </div>
                          <input
                            type="range"
                            min="60"
                            max="130"
                            value={advWaist}
                            onChange={(e) => setAdvWaist(Number(e.target.value))}
                            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                            <span>{isRtl ? "دور باسن" : "Hip Width"}</span>
                            <span className="text-indigo-400 font-extrabold">{advHip} cm</span>
                          </div>
                          <input
                            type="range"
                            min="70"
                            max="140"
                            value={advHip}
                            onChange={(e) => setAdvHip(Number(e.target.value))}
                            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-neutral-400 mb-1">
                            <span>{isRtl ? "عرض سرشانه" : "Shoulder Width"}</span>
                            <span className="text-indigo-400 font-extrabold">{advShoulder} cm</span>
                          </div>
                          <input
                            type="range"
                            min="30"
                            max="60"
                            value={advShoulder}
                            onChange={(e) => setAdvShoulder(Number(e.target.value))}
                            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={runSizeAdvisorCalculations}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      {t.calculate_size}
                    </button>
                  </div>

                  {/* Sizing advisor result box - Single Exact Size Display */}
                  <div className="p-6 rounded-xl bg-neutral-950/30 border border-neutral-800/60 flex flex-col justify-between h-full min-h-[220px]">
                    <div className="text-center mb-4">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{isRtl ? "پیشنهاد تک‌سایز دقیق محصول" : "Single Size Match Output"}</span>
                    </div>
                    
                    {calculatedRec ? (
                      <div className="space-y-4 my-auto">
                        <div className="p-5 bg-gradient-to-b from-indigo-500/15 to-sky-500/10 border border-indigo-500/30 rounded-2xl text-center shadow-xl">
                          <span className="block text-[11px] font-extrabold text-indigo-400 mb-1 uppercase tracking-wider">
                            {isRtl ? "سایز دقیق پیشنهادی برای این محصول" : "Recommended Size For This Item"}
                          </span>
                          <span className="block text-4xl font-black text-white my-2 tracking-tight">{calculatedRec}</span>
                          <span className="block text-xs text-indigo-200/80 leading-snug">{fitHintTops}</span>
                        </div>

                        {/* Recommendation details & inventory availability message */}
                        <div className={`p-3 rounded-lg text-xs leading-relaxed ${advisorIsAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          <div className="font-extrabold mb-1 flex items-center gap-1.5 justify-center">
                            <span className={`w-1.5 h-1.5 rounded-full ${advisorIsAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                            <span>{isRtl ? "سیستم هوشمند انطباق" : "Smart Compatibility Match"}</span>
                          </div>
                          <p className="text-center text-[11px]">{advisorMessage}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-neutral-400 py-10 text-center">
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
