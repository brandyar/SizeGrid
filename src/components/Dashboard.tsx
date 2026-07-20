import React, { useState, useEffect, useRef } from 'react';
import { locales } from '../locales';
import { DirectusAPI } from '../directus';
import { useRouter } from './Router';
import { Product, InventoryItem, Color, Size } from '../types';
import {
  Grid3X3,
  Package,
  Sliders,
  Settings,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Image,
  Upload,
  Check,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Layers,
  ArrowRightLeft,
  X,
  FileImage,
  Store,
  Compass,
  Sun,
  Moon
} from 'lucide-react';

interface DashboardProps {
  lang: 'fa' | 'en';
  setLang: (lang: 'fa' | 'en') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

type ActiveTab = 'products' | 'matrix' | 'size_guides' | 'compressor' | 'settings';

export default function Dashboard({ lang, setLang, darkMode, setDarkMode }: DashboardProps) {
  const { navigate } = useRouter();
  const t = locales[lang];
  const isRtl = lang === 'fa';

  // Auth Protection Check
  const currentUser = DirectusAPI.getCurrentUser();
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser]);

  // Global Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Panel/Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');

  // Products CRUD State
  const [isEditingProd, setIsEditingProd] = useState<Product | null>(null); // null = listing, object = form editing, 'new' = creation
  const [prodFormNameFa, setProdFormNameFa] = useState('');
  const [prodFormNameEn, setProdFormNameEn] = useState('');
  const [prodFormDescFa, setProdFormDescFa] = useState('');
  const [prodFormDescEn, setProdFormDescEn] = useState('');
  const [prodFormBasePrice, setProdFormBasePrice] = useState(0);
  const [prodFormCategory, setProdFormCategory] = useState('Clothing');
  const [prodFormImage, setProdFormImage] = useState('');
  const [prodFormStatus, setProdFormStatus] = useState<'idle' | 'saving' | 'limit_reached'>('idle');

  // Matrix Editor State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [matrixInventory, setMatrixInventory] = useState<InventoryItem[]>([]);
  const [matrixGridState, setMatrixGridState] = useState<Record<string, { stock: number; price: number; enabled: boolean }>>({});
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Settings Form State
  const [settingsShopName, setSettingsShopName] = useState(currentUser?.shop_name || '');
  const [settingsShopSlug, setSettingsShopSlug] = useState(currentUser?.shop_slug || '');
  const [savingSettings, setSavingSettings] = useState(false);

  // Compressor Tab State
  const [compressorFile, setCompressorFile] = useState<File | null>(null);
  const [compressorOriginalSize, setCompressorOriginalSize] = useState<number>(0);
  const [compressorCompressedSize, setCompressorCompressedSize] = useState<number>(0);
  const [compressorBlob, setCompressorBlob] = useState<Blob | null>(null);
  const [compressorPreview, setCompressorPreview] = useState<string>('');
  const [compressorUploading, setCompressorUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- SIZE GUIDES EDITOR STATE & METHODS ---
  const [selectedSizeGuidesProduct, setSelectedSizeGuidesProduct] = useState<Product | null>(null);
  const [sizeGuidesList, setSizeGuidesList] = useState<any[]>([]);
  const [sizeGuidesFormState, setSizeGuidesFormState] = useState<Record<string, { enabled: boolean; min_height: number; max_height: number; min_weight: number; max_weight: number; shapes: { slim: boolean; athletic: boolean; heavy: boolean } }>>({});
  const [savingSizeGuides, setSavingSizeGuides] = useState(false);

  const launchSizeGuidesEditorForProduct = async (prod: Product) => {
    setSelectedSizeGuidesProduct(prod);
    setSavingSizeGuides(false);
    setError('');
    setActiveTab('size_guides');

    try {
      const guides = await DirectusAPI.getSizeGuidesForProduct(prod.id);
      setSizeGuidesList(guides);

      // Map sizes into forms
      const formState: Record<string, any> = {};
      sizes.forEach(sz => {
        const matchedGuide = guides.find(g => g.size_id === sz.id);
        
        let measurements = {
          min_height: 150,
          max_height: 180,
          min_weight: 50,
          max_weight: 80,
          shapes: { slim: true, athletic: true, heavy: false }
        };

        if (matchedGuide) {
          const rawMeas = typeof matchedGuide.measurements === 'string' 
            ? JSON.parse(matchedGuide.measurements) 
            : matchedGuide.measurements;
          
          measurements = {
            min_height: Number(rawMeas?.min_height ?? 150),
            max_height: Number(rawMeas?.max_height ?? 180),
            min_weight: Number(rawMeas?.min_weight ?? 50),
            max_weight: Number(rawMeas?.max_weight ?? 80),
            shapes: {
              slim: !!rawMeas?.shapes?.slim,
              athletic: !!rawMeas?.shapes?.athletic,
              heavy: !!rawMeas?.shapes?.heavy,
            }
          };
        }

        formState[sz.id] = {
          enabled: !!matchedGuide,
          min_height: measurements.min_height,
          max_height: measurements.max_height,
          min_weight: measurements.min_weight,
          max_weight: measurements.max_weight,
          shapes: measurements.shapes
        };
      });

      setSizeGuidesFormState(formState);
    } catch (e) {
      setError(isRtl ? "خطا در بارگذاری اطلاعات جدول راهنمای سایز." : "Could not fetch size guides data.");
    }
  };

  const handleSizeGuideCellChange = (sizeId: number, field: string, subfield: string | null, value: any) => {
    setSizeGuidesFormState(prev => {
      const updated = { ...prev[sizeId] };
      if (subfield) {
        updated[field] = {
          ...updated[field],
          [subfield]: value
        };
      } else {
        updated[field] = value;
      }

      return {
        ...prev,
        [sizeId]: updated
      };
    });
  };

  const saveSizeGuidesSubmit = async () => {
    if (!selectedSizeGuidesProduct) return;
    setSavingSizeGuides(true);
    setError('');

    try {
      for (const sz of sizes) {
        const formCell = sizeGuidesFormState[sz.id];
        const existingGuide = sizeGuidesList.find(g => g.size_id === sz.id);

        if (formCell.enabled) {
          const measurements = {
            min_height: Number(formCell.min_height),
            max_height: Number(formCell.max_height),
            min_weight: Number(formCell.min_weight),
            max_weight: Number(formCell.max_weight),
            shapes: formCell.shapes
          };
          await DirectusAPI.saveSizeGuide(
            selectedSizeGuidesProduct.id,
            sz.id,
            measurements,
            existingGuide?.id
          );
        } else {
          if (existingGuide) {
            await DirectusAPI.deleteSizeGuide(existingGuide.id);
          }
        }
      }

      setSuccess(t.changes_saved);
      setTimeout(() => setSuccess(''), 3000);
      await launchSizeGuidesEditorForProduct(selectedSizeGuidesProduct);
    } catch (e) {
      setError(isRtl ? "خطا در ثبت مشخصات سایزبندی." : "Failed to sync size guide database.");
    } finally {
      setSavingSizeGuides(false);
    }
  };

  // Load baseline resources
  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [prodsList, colorsList, sizesList] = await Promise.all([
        DirectusAPI.getProducts(),
        DirectusAPI.getColors(),
        DirectusAPI.getSizes()
      ]);
      setProducts(prodsList);
      setColors(colorsList);
      setSizes(sizesList.sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) {
      setError(isRtl ? "خطا در بارگذاری اطلاعات پیش آمد." : "Failed to load dashboard resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Sync state if user changes settings in background
  useEffect(() => {
    if (currentUser) {
      setSettingsShopName(currentUser.shop_name || '');
      setSettingsShopSlug(currentUser.shop_slug || '');
    }
  }, [currentUser]);

  const handleLogout = () => {
    DirectusAPI.logout();
    navigate('/');
  };

  // --- PRODUCTS CRUD LOGIC ---
  const triggerAddProductMode = () => {
    const merchantOwnedCount = products.filter(p => p.created_by === currentUser?.id).length;
    if (merchantOwnedCount >= 30) {
      setError(t.free_tier_warning);
      return;
    }
    setError('');
    setIsEditingProd({ id: 0, name_fa: '', name_en: '', base_price: 500000 });
    setProdFormNameFa('');
    setProdFormNameEn('');
    setProdFormDescFa('');
    setProdFormDescEn('');
    setProdFormBasePrice(500000);
    setProdFormCategory('Clothing');
    setProdFormImage('');
  };

  const triggerEditProductMode = (prod: Product) => {
    setError('');
    setIsEditingProd(prod);
    setProdFormNameFa(prod.name_fa);
    setProdFormNameEn(prod.name_en);
    setProdFormDescFa(prod.description_fa || '');
    setProdFormDescEn(prod.description_en || '');
    setProdFormBasePrice(prod.base_price);
    setProdFormCategory(prod.category || 'Clothing');
    setProdFormImage(prod.image || '');
  };

  const saveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingProd) return;
    setProdFormStatus('saving');
    setError('');

    const payload = {
      name_fa: prodFormNameFa,
      name_en: prodFormNameEn,
      description_fa: prodFormDescFa,
      description_en: prodFormDescEn,
      base_price: Number(prodFormBasePrice),
      category: prodFormCategory,
      image: prodFormImage
    };

    try {
      if (isEditingProd.id === 0) {
        // Add new
        await DirectusAPI.addProduct(payload);
        setSuccess(isRtl ? "محصول جدید با موفقیت ثبت شد." : "Product registered successfully.");
      } else {
        // Edit existing
        await DirectusAPI.updateProduct(isEditingProd.id, payload);
        setSuccess(isRtl ? "محصول با موفقیت ویرایش شد." : "Product updated successfully.");
      }
      setIsEditingProd(null);
      await loadDashboardData();
    } catch (err: any) {
      if (err.message === "FREE_TIER_LIMIT_REACHED") {
        setError(t.free_tier_warning);
      } else {
        setError(isRtl ? "خطا در ثبت اطلاعات محصول" : "Failed to record product profile.");
      }
    } finally {
      setProdFormStatus('idle');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm(isRtl ? "آیا از حذف این محصول و کل موجودی‌های متناظر آن اطمینان دارید؟" : "Are you sure you want to delete this product and its stock matrix?")) return;
    try {
      await DirectusAPI.deleteProduct(id);
      await loadDashboardData();
      setSuccess(isRtl ? "محصول با موفقیت حذف شد." : "Product deleted successfully.");
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(isRtl ? "حذف با خطا مواجه شد." : "Deletion failed.");
    }
  };

  // --- 2D MATRIX EDITOR LOGIC ---
  const launchMatrixEditorForProduct = async (prod: Product) => {
    setSelectedProduct(prod);
    setSavingMatrix(false);
    setError('');
    setActiveTab('matrix');
    
    try {
      const inv = await DirectusAPI.getInventoryForProduct(prod.id);
      setMatrixInventory(inv);

      // Map inventory into key-based coordinate state ColorID-SizeID for easy 2D rendering
      const gridState: Record<string, { stock: number; price: number; enabled: boolean }> = {};
      colors.forEach(col => {
        sizes.forEach(sz => {
          const key = `${col.id}-${sz.id}`;
          const matchedItem = inv.find(i => i.color_id === col.id && i.size_id === sz.id);

          if (matchedItem) {
            gridState[key] = {
              stock: matchedItem.stock,
              price: matchedItem.price,
              enabled: true
            };
          } else {
            gridState[key] = {
              stock: 0,
              price: prod.base_price,
              enabled: false
            };
          }
        });
      });
      setMatrixGridState(gridState);
    } catch (e) {
      setError(isRtl ? "خطا در بارگذاری جدول موجودی." : "Could not fetch inventory matrix.");
    }
  };

  const handleCellChange = (colorId: number, sizeId: number, field: 'stock' | 'price' | 'enabled', value: any) => {
    const key = `${colorId}-${sizeId}`;
    setMatrixGridState(prev => {
      const updated = { ...prev[key] };
      if (field === 'stock') updated.stock = Math.max(0, parseInt(value) || 0);
      else if (field === 'price') updated.price = Math.max(0, parseInt(value) || 0);
      else if (field === 'enabled') updated.enabled = !!value;

      return {
        ...prev,
        [key]: updated
      };
    });
  };

  const saveMatrixSubmit = async () => {
    if (!selectedProduct) return;
    setSavingMatrix(true);
    setError('');

    // Transform active enabling matrix cells to match InventoryItem payload
    const updatedPayload: Array<Omit<InventoryItem, 'id'>> = [];
    
    colors.forEach(col => {
      sizes.forEach(sz => {
        const key = `${col.id}-${sz.id}`;
        const cell = matrixGridState[key];
        if (cell && cell.enabled) {
          updatedPayload.push({
            product_id: selectedProduct.id,
            color_id: col.id,
            size_id: sz.id,
            stock: cell.stock,
            price: cell.price
          });
        }
      });
    });

    try {
      await DirectusAPI.syncInventory(selectedProduct.id, updatedPayload);
      setSuccess(t.changes_saved);
      setTimeout(() => setSuccess(''), 3000);
      // reload inventory state from source
      await launchMatrixEditorForProduct(selectedProduct);
    } catch (e) {
      setError(t.error_saving);
    } finally {
      setSavingMatrix(false);
    }
  };

  // --- HTML5 CANVAS IMAGE COMPRESSION LOGIC ---
  const handleCompressorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setCompressorFile(file);
      setCompressorOriginalSize(Math.round(file.size / 1024)); // size in KB

      try {
        const compressedBlob = await DirectusAPI.compressImage(file);
        setCompressorBlob(compressedBlob);
        setCompressorCompressedSize(Math.round(compressedBlob.size / 1024));

        const previewURL = URL.createObjectURL(compressedBlob);
        setCompressorPreview(previewURL);
      } catch (err) {
        setError(isRtl ? "عملیات فشرده‌سازی با خطا روبرو شد." : "Image compression failed.");
      }
    }
  };

  const uploadAndApplyToProduct = async (product: Product) => {
    if (!compressorFile) return;
    setCompressorUploading(true);
    setError('');
    
    try {
      const finalURL = await DirectusAPI.uploadProductImage(compressorFile);
      
      // Update product image value
      await DirectusAPI.updateProduct(product.id, { image: finalURL });
      setSuccess(isRtl ? "تصویر با موفقیت فشرده شده و به کالا اعمال شد." : "Image compressed and applied to product successfully.");
      
      // Refresh list
      await loadDashboardData();
      
      // Reset Compressor View
      setCompressorFile(null);
      setCompressorPreview('');
      setCompressorBlob(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(isRtl ? "آپلود تصویر با خطا مواجه شد." : "Failed to upload compressed image.");
    } finally {
      setCompressorUploading(false);
    }
  };

  // --- MERCHANT ACCOUNT SETTINGS SAVE ---
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setError('');
    
    try {
      await DirectusAPI.updateSettings(settingsShopName, settingsShopSlug);
      setSuccess(isRtl ? "تنظیمات فروشگاه با موفقیت به‌روزرسانی شد." : "Store settings updated successfully.");
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(isRtl ? "به‌روزرسانی تنظیمات با خطا همراه بود." : "Settings update failed.");
    } finally {
      setSavingSettings(false);
    }
  };

  const activeProductsCount = products.filter(p => p.created_by === currentUser?.id).length;

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* SIDEBAR NAVIGATION - Responsive */}
      <aside className={`w-64 border-r shrink-0 hidden md:flex flex-col justify-between ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-neutral-800 flex items-center gap-2">
            <div className="p-2 bg-sky-600 rounded-lg text-white">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
                SizeGrid Panel
              </h1>
              <p className="text-[10px] text-neutral-500 font-bold">{t.store_settings}</p>
            </div>
          </div>

          {/* User badge */}
          <div className="p-4 mx-3 my-4 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-600/20 text-sky-400 font-extrabold flex items-center justify-center border border-sky-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-extrabold truncate text-sky-400">{currentUser?.shop_name || 'My Shop'}</p>
              <p className="text-[10px] text-neutral-400 truncate text-left font-semibold">@{currentUser?.shop_slug || 'slug'}</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="px-3 space-y-1">
            <button
              onClick={() => { setActiveTab('products'); setIsEditingProd(null); setSelectedProduct(null); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${activeTab === 'products' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'}`}
            >
              <Package className="w-4 h-4" />
              <span>{isRtl ? "مدیریت کالاها" : "Products Manager"}</span>
            </button>

            {selectedProduct && (
              <button
                onClick={() => setActiveTab('matrix')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${activeTab === 'matrix' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'}`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>{t.matrix_editor}</span>
              </button>
            )}

            <button
              onClick={() => { setActiveTab('size_guides'); setIsEditingProd(null); setSelectedSizeGuidesProduct(null); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${activeTab === 'size_guides' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'}`}
            >
              <Sliders className="w-4 h-4" />
              <span>{isRtl ? "راهنمای سایز و ابعاد" : "Size Guides"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('compressor'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${activeTab === 'compressor' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'}`}
            >
              <FileImage className="w-4 h-4" />
              <span>{t.image_compressor}</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${activeTab === 'settings' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'}`}
            >
              <Settings className="w-4 h-4" />
              <span>{t.store_settings}</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Action */}
        <div className="p-4 border-t border-neutral-800 space-y-3">
          {/* Public Storefront URL Link */}
          {currentUser?.shop_slug && (
            <a
              href={`/shop/${currentUser.shop_slug}/product/101`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-[10px] font-extrabold rounded-lg flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5" />
                <span>{isRtl ? "فروشگاه عمومی شما" : "My Public Shop"}</span>
              </div>
              <ChevronLeft className="w-3 h-3" />
            </a>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOP STATUS BAR BAR */}
        <header className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
          <div className="flex items-center gap-3">
            {/* Mobile Toggle Drawer indicator */}
            <span className="md:hidden p-2 bg-sky-600 text-white rounded-lg">
              <Grid3X3 className="w-5 h-5" />
            </span>
            <h2 className="text-sm font-extrabold text-neutral-400 flex items-center gap-1.5">
              <span>{t.brand_name}</span>
              <span>/</span>
              <span className="text-sky-500 font-black">
                {activeTab === 'products' ? (isEditingProd ? t.add_product : t.back_to_products) : ''}
                {activeTab === 'matrix' ? t.matrix_editor : ''}
                {activeTab === 'size_guides' ? (isRtl ? "راهنمای سایز و ابعاد" : "Size Guides") : ''}
                {activeTab === 'compressor' ? t.image_compressor : ''}
                {activeTab === 'settings' ? t.store_settings : ''}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick stats on free tier */}
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-extrabold text-neutral-300">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRtl ? `کالاها: ${activeProductsCount} از ۳۰ (طرح رایگان)` : `Products: ${activeProductsCount} of 30 (Free Tier)`}</span>
            </span>

            {/* Language Controls */}
            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className="p-2 border rounded-lg text-xs font-semibold hover:bg-neutral-500/10 border-neutral-800 text-neutral-300"
            >
              {lang === 'fa' ? 'English' : 'فارسی'}
            </button>

            {/* Dark/Light Switch */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border rounded-lg border-neutral-800 text-neutral-300 hover:bg-neutral-800"
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>
            
            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-red-400 border border-red-500/20 hover:bg-red-500/10 rounded-lg"
              title={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTAINER CONTENT VIEWPORTS */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          
          {/* Notifications Toast panels */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3 animate-fade-in">
              <Check className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-neutral-400 font-bold">{t.loading}</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PRODUCTS MANAGER */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {isEditingProd === null ? (
                    // 1. PRODUCTS LISTING
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black">{isRtl ? "مدیریت کاتالوگ لباس‌ها" : "Garments Catalog Manager"}</h3>
                          <p className="text-xs text-neutral-400">{isRtl ? "پایه لباس‌ها را اضافه کرده و سپس ماتریس سایز-رنگ را تنظیم کنید." : "Add clothing base templates, then configure sizing matrices."}</p>
                        </div>
                        <button
                          onClick={triggerAddProductMode}
                          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-sky-600/10 flex items-center gap-2 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t.add_product}</span>
                        </button>
                      </div>

                      {/* Products visual grid / table */}
                      {products.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
                          <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                          <p className="text-sm font-bold text-neutral-400">{isRtl ? "هیچ محصولی در کاتالوگ شما وجود ندارد." : "No products available in your catalogue."}</p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {products.map(prod => (
                            <div key={prod.id} className={`rounded-xl border overflow-hidden flex flex-col justify-between ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                              
                              <div>
                                {/* Product Image */}
                                <div className="h-44 bg-neutral-950/20 relative">
                                  {prod.image ? (
                                    <img src={prod.image} alt={prod.name_fa} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col justify-center items-center text-neutral-500 bg-neutral-950/20">
                                      <Image className="w-8 h-8 opacity-40 mb-1" />
                                      <span className="text-[10px]">{isRtl ? "تصویر ثبت نشده" : "No Image Uploaded"}</span>
                                    </div>
                                  )}
                                  
                                  <span className="absolute top-3 left-3 px-2 py-1 bg-sky-600 text-white rounded-lg font-bold text-[9px]">
                                    {prod.category}
                                  </span>
                                </div>

                                {/* Title description */}
                                <div className="p-4 space-y-2">
                                  <h4 className="font-extrabold text-sm line-clamp-1">{isRtl ? prod.name_fa : prod.name_en}</h4>
                                  <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                                    {isRtl ? prod.description_fa : prod.description_en}
                                  </p>
                                  
                                  <p className="text-xs font-black text-sky-500 pt-1">
                                    {isRtl ? `${prod.base_price.toLocaleString('fa-IR')} تومان` : `$${(prod.base_price / 50000).toFixed(1)} USD`}
                                  </p>
                                </div>
                              </div>

                              {/* Footer Action Buttons */}
                              <div className="p-4 border-t border-neutral-800/40 grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => launchMatrixEditorForProduct(prod)}
                                  className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Grid3X3 className="w-3.5 h-3.5" />
                                  <span>{isRtl ? "ویرایش ماتریس" : "Edit Matrix"}</span>
                                </button>

                                <button
                                  onClick={() => launchSizeGuidesEditorForProduct(prod)}
                                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  <span>{isRtl ? "راهنمای سایز" : "Size Guide"}</span>
                                </button>
                                
                                <button
                                  onClick={() => triggerEditProductMode(prod)}
                                  className={`py-2 px-3 border text-[10px] font-black rounded-lg flex items-center justify-center gap-1.5 transition-all ${darkMode ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-neutral-300 hover:bg-neutral-100 text-neutral-700'}`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>{t.edit}</span>
                                </button>

                                {/* Public Link Preview */}
                                <a
                                  href={`/shop/${currentUser?.shop_slug || 'luxury-garments'}/product/${prod.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="col-span-2 py-1.5 border border-dashed border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[9px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition-all"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                  <span>{isRtl ? "پیش‌نمایش در فروشگاه عمومی خریداران" : "Preview in Public Storefront"}</span>
                                </a>

                                {prod.created_by !== 'system' && (
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="col-span-2 py-1.5 hover:bg-red-500/10 text-red-400 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{t.delete}</span>
                                  </button>
                                )}
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // 2. PRODUCT FORM (Add/Edit)
                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-extrabold">
                          {isEditingProd.id === 0 ? t.add_product : t.edit_product}
                        </h3>
                        <button
                          onClick={() => setIsEditingProd(null)}
                          className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={saveProductSubmit} className="space-y-4">
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.product_name_fa}</label>
                            <input
                              type="text"
                              required
                              value={prodFormNameFa}
                              onChange={(e) => setProdFormNameFa(e.target.value)}
                              placeholder="مثال: تیشرت نخی سوپر پنبه"
                              className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.product_name_en}</label>
                            <input
                              type="text"
                              required
                              value={prodFormNameEn}
                              onChange={(e) => setProdFormNameEn(e.target.value)}
                              placeholder="e.g. Combed Cotton Polo Shirt"
                              className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 text-left dir-ltr ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.desc_fa}</label>
                            <textarea
                              rows={3}
                              value={prodFormDescFa}
                              onChange={(e) => setProdFormDescFa(e.target.value)}
                              placeholder="توضیحات فارسی پیرامون الیاف، دوخت، قواره و..."
                              className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.desc_en}</label>
                            <textarea
                              rows={3}
                              value={prodFormDescEn}
                              onChange={(e) => setProdFormDescEn(e.target.value)}
                              placeholder="English details about fabric, materials, stretch, fit etc."
                              className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 text-left dir-ltr ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.base_price}</label>
                            <input
                              type="number"
                              required
                              value={prodFormBasePrice}
                              onChange={(e) => setProdFormBasePrice(Number(e.target.value))}
                              className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.category}</label>
                            <select
                              value={prodFormCategory}
                              onChange={(e) => setProdFormCategory(e.target.value)}
                              className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                            >
                              <option value="Clothing">{isRtl ? "پوشاک عمومی" : "General Clothing"}</option>
                              <option value="Tops">{isRtl ? "تیشرت و پولوشرت" : "Tops & Polo"}</option>
                              <option value="Outerwear">{isRtl ? "کاپشن و کت" : "Outerwear"}</option>
                              <option value="Pants">{isRtl ? "شلوار کتان و جین" : "Pants"}</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.image} URL</label>
                            <input
                              type="text"
                              value={prodFormImage}
                              onChange={(e) => setProdFormImage(e.target.value)}
                              placeholder="https://images.unsplash.com/..."
                              className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 text-left dir-ltr ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                            />
                            <p className="text-[10px] text-neutral-400 mt-1">{isRtl ? "می‌توانید تصویر فشرده را نیز در زبانه فشرده‌ساز آپلود کنید." : "Or upload custom image in compressor tab."}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                          <button
                            type="button"
                            onClick={() => setIsEditingProd(null)}
                            className="px-4 py-2 border border-neutral-700 rounded-lg text-xs text-neutral-400 hover:bg-neutral-800"
                          >
                            {t.cancel}
                          </button>
                          
                          <button
                            type="submit"
                            disabled={prodFormStatus === 'saving'}
                            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg"
                          >
                            {prodFormStatus === 'saving' ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              t.save
                            )}
                          </button>
                        </div>

                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: 2D INVENTORY MATRIX EDITOR */}
              {activeTab === 'matrix' && selectedProduct && (
                <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                  
                  {/* Header metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/40 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-neutral-800 rounded-lg overflow-hidden shrink-0">
                        {selectedProduct.image ? (
                          <img src={selectedProduct.image} alt={selectedProduct.name_fa} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-6 h-6 m-4 text-neutral-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-extrabold rounded">
                            {selectedProduct.category}
                          </span>
                          <span className="text-[10px] text-neutral-500">ID: {selectedProduct.id}</span>
                        </div>
                        <h3 className="text-base font-extrabold mt-1">{isRtl ? selectedProduct.name_fa : selectedProduct.name_en}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveTab('products')}
                        className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300 font-bold"
                      >
                        {t.back_to_products}
                      </button>

                      <button
                        onClick={saveMatrixSubmit}
                        disabled={savingMatrix}
                        className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-2"
                      >
                        {savingMatrix ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{t.save}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* matrix usage instruction */}
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs flex items-center gap-2.5">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                    <span>
                      {isRtl
                        ? "راهنما: سطرها معرف رنگ و ستون‌ها معرف سایز لباس هستند. با فعال‌سازی هر سلول، آن متغیر در کاتالوگ فروشگاه فعال می‌گردد."
                        : "Rows describe color options, and columns describe sizes. Enabling a cell instantiates that variant in stock."}
                    </span>
                  </div>

                  {/* 2D MATRIX CONTAINER (Scrollable) */}
                  <div className="overflow-x-auto rounded-xl border border-neutral-800">
                    <table className="w-full text-xs text-center border-collapse">
                      <thead>
                        <tr className="bg-neutral-950/40 border-b border-neutral-800">
                          {/* Top corner cell */}
                          <th className="p-4 border-r border-neutral-800 font-black text-neutral-400">{t.colors} / {t.sizes}</th>
                          
                          {/* Column headers (Sizes) */}
                          {sizes.map(sz => (
                            <th key={sz.id} className="p-4 font-black border-r border-neutral-800 text-sky-400">
                              <span className="text-sm font-bold block">{sz.name}</span>
                              <span className="text-[9px] text-neutral-500 font-normal">Order: #{sz.sort_order}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {colors.map(col => (
                          <tr key={col.id} className="border-b border-neutral-800/80 hover:bg-neutral-900/10 transition-colors">
                            
                            {/* Row Header (Color Label) */}
                            <td className="p-4 border-r border-neutral-800 text-right font-extrabold flex items-center justify-start gap-3 min-w-[150px]">
                              <span className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" style={{ backgroundColor: col.hex_code }} />
                              <div>
                                <p className="font-bold">{isRtl ? col.name_fa : col.name_en}</p>
                                <code className="text-[9px] text-neutral-500 font-mono tracking-wider uppercase">{col.hex_code}</code>
                              </div>
                            </td>

                            {/* Cells of Matrix */}
                            {sizes.map(sz => {
                              const key = `${col.id}-${sz.id}`;
                              const cell = matrixGridState[key] || { stock: 0, price: selectedProduct.base_price, enabled: false };

                              return (
                                <td key={sz.id} className={`p-3 border-r border-neutral-800 min-w-[140px] transition-all ${cell.enabled ? 'bg-sky-500/5' : 'bg-neutral-950/10 opacity-60'}`}>
                                  <div className="space-y-2 text-center">
                                    
                                    {/* Enable / Disable Checkbox */}
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={cell.enabled}
                                        onChange={(e) => handleCellChange(col.id, sz.id, 'enabled', e.target.checked)}
                                        className="rounded border-neutral-700 bg-neutral-900 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                                      />
                                      <span className="text-[10px] font-extrabold text-neutral-400">{cell.enabled ? t.in_stock : t.out_of_stock}</span>
                                    </label>

                                    {cell.enabled && (
                                      <div className="space-y-1">
                                        {/* Stock Input */}
                                        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-md px-1.5 py-1">
                                          <span className="text-[9px] text-neutral-500 shrink-0">{t.stock}:</span>
                                          <input
                                            type="number"
                                            value={cell.stock}
                                            onChange={(e) => handleCellChange(col.id, sz.id, 'stock', e.target.value)}
                                            className="w-full bg-transparent text-center focus:outline-none text-[11px] font-extrabold text-sky-400"
                                          />
                                        </div>

                                        {/* Price override Input */}
                                        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-md px-1.5 py-1">
                                          <span className="text-[9px] text-neutral-500 shrink-0">$</span>
                                          <input
                                            type="number"
                                            value={cell.price}
                                            onChange={(e) => handleCellChange(col.id, sz.id, 'price', e.target.value)}
                                            className="w-full bg-transparent text-center focus:outline-none text-[11px] font-bold"
                                            placeholder={selectedProduct.base_price.toString()}
                                          />
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                </td>
                              );
                            })}

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Save Matrix bottom drawer control */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={saveMatrixSubmit}
                      disabled={savingMatrix}
                      className="px-8 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/10 flex items-center gap-2"
                    >
                      {savingMatrix ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{isRtl ? "همگام‌سازی و ذخیره نهایی ماتریس کالا" : "Sync & Finalize Matrix Database"}</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

              {/* TAB: SIZE & GUIDE MANAGEMENT */}
              {activeTab === 'size_guides' && (
                <div className="space-y-6 animate-fade-in">
                  {!selectedSizeGuidesProduct ? (
                    // Listing view (select product)
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-black">{isRtl ? "تنظیم مشخصات و راهنمای سایز لباس‌ها" : "Size & Guide Management"}</h3>
                        <p className="text-xs text-neutral-400">{isRtl ? "یک کالا را برای تعریف بازه قد و وزن مناسب هر سایز انتخاب کنید." : "Choose a product to specify the height and weight compatibility ranges for each size."}</p>
                      </div>

                      {products.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
                          <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                          <p className="text-sm font-bold text-neutral-400">{isRtl ? "ابتدا یک محصول به کاتالوگ خود اضافه کنید." : "Please add a product to your catalog first."}</p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {products.map(prod => (
                            <div key={prod.id} className={`rounded-xl border p-4 space-y-4 flex flex-col justify-between ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-neutral-950/20 overflow-hidden shrink-0">
                                  {prod.image ? (
                                    <img src={prod.image} alt={prod.name_fa} className="w-full h-full object-cover" />
                                  ) : (
                                    <Image className="w-6 h-6 m-3 text-neutral-500" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-extrabold text-xs truncate">{isRtl ? prod.name_fa : prod.name_en}</h4>
                                  <span className="text-[10px] text-neutral-500 px-1.5 py-0.5 bg-neutral-950/40 rounded mt-1 inline-block">
                                    {prod.category}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => launchSizeGuidesEditorForProduct(prod)}
                                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                              >
                                <Sliders className="w-4 h-4" />
                                <span>{isRtl ? "تنظیم راهنمای سایز" : "Configure Sizing Guide"}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Detail editor view for the selected product
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/60">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-neutral-950/40 border border-neutral-800 rounded-lg overflow-hidden shrink-0">
                            {selectedSizeGuidesProduct.image ? (
                              <img src={selectedSizeGuidesProduct.image} alt={selectedSizeGuidesProduct.name_fa} className="w-full h-full object-cover" />
                            ) : (
                              <Image className="w-6 h-6 m-4 text-neutral-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-extrabold rounded">
                                {selectedSizeGuidesProduct.category}
                              </span>
                              <span className="text-[10px] text-neutral-500">ID: {selectedSizeGuidesProduct.id}</span>
                            </div>
                            <h3 className="text-sm font-extrabold mt-1">{isRtl ? selectedSizeGuidesProduct.name_fa : selectedSizeGuidesProduct.name_en}</h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedSizeGuidesProduct(null)}
                            className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300 font-bold"
                          >
                            {isRtl ? "بازگشت به لیست کالاها" : "Back to List"}
                          </button>

                          <button
                            onClick={saveSizeGuidesSubmit}
                            disabled={savingSizeGuides}
                            className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-2"
                          >
                            {savingSizeGuides ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span>{t.save}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* SIZE GUIDE ROWS */}
                      <div className="space-y-4">
                        {sizes.map(sz => {
                          const cell = sizeGuidesFormState[sz.id] || {
                            enabled: false,
                            min_height: 150,
                            max_height: 180,
                            min_weight: 50,
                            max_weight: 80,
                            shapes: { slim: true, athletic: true, heavy: false }
                          };

                          return (
                            <div
                              key={sz.id}
                              className={`p-5 rounded-2xl border transition-all ${
                                cell.enabled 
                                  ? 'bg-sky-500/5 border-sky-500/20' 
                                  : 'bg-neutral-900/20 border-neutral-800 opacity-60'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                {/* Size Identifier Title & Enable Checkbox */}
                                <div className="flex items-center gap-4 shrink-0 min-w-[150px]">
                                  <div className="w-10 h-10 rounded-xl bg-sky-600/10 text-sky-400 font-extrabold text-sm flex items-center justify-center border border-sky-500/20">
                                    {sz.name}
                                  </div>
                                  <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={cell.enabled}
                                        onChange={(e) => handleSizeGuideCellChange(sz.id, 'enabled', null, e.target.checked)}
                                        className="rounded border-neutral-700 bg-neutral-900 text-sky-600 focus:ring-sky-500 w-4 h-4"
                                      />
                                      <span className="text-xs font-black text-neutral-300">
                                        {cell.enabled ? (isRtl ? "فعال شده" : "Active Guide") : (isRtl ? "غیرفعال" : "Disabled")}
                                      </span>
                                    </label>
                                  </div>
                                </div>

                                {/* Slider inputs / values for enabled sizing */}
                                {cell.enabled ? (
                                  <div className="flex-1 grid sm:grid-cols-3 gap-6">
                                    {/* Height Range */}
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold text-neutral-400 block">
                                        {isRtl ? "محدوده قد (سانتی‌متر):" : "Height Compatibility (cm):"}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={cell.min_height}
                                          onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_height', null, Number(e.target.value))}
                                          className="w-1/2 px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-bold"
                                          placeholder="Min"
                                        />
                                        <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                        <input
                                          type="number"
                                          value={cell.max_height}
                                          onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_height', null, Number(e.target.value))}
                                          className="w-1/2 px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-bold"
                                          placeholder="Max"
                                        />
                                      </div>
                                    </div>

                                    {/* Weight Range */}
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold text-neutral-400 block">
                                        {isRtl ? "محدوده وزن (کیلوگرم):" : "Weight Compatibility (kg):"}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={cell.min_weight}
                                          onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_weight', null, Number(e.target.value))}
                                          className="w-1/2 px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-indigo-400 font-bold"
                                          placeholder="Min"
                                        />
                                        <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                        <input
                                          type="number"
                                          value={cell.max_weight}
                                          onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_weight', null, Number(e.target.value))}
                                          className="w-1/2 px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-indigo-400 font-bold"
                                          placeholder="Max"
                                        />
                                      </div>
                                    </div>

                                    {/* Shape selections */}
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold text-neutral-400 block">
                                        {isRtl ? "فرم‌های بدنی مجاز:" : "Compatible Body Shapes:"}
                                      </span>
                                      <div className="flex flex-wrap gap-2 pt-1">
                                        {/* Slim Shape */}
                                        <label className={`px-2.5 py-1 rounded-lg border text-[10px] font-black cursor-pointer flex items-center gap-1.5 transition-all ${
                                          cell.shapes.slim
                                            ? 'bg-sky-600/10 border-sky-500 text-sky-400'
                                            : 'border-neutral-800 text-neutral-500 hover:text-neutral-300'
                                        }`}>
                                          <input
                                            type="checkbox"
                                            checked={cell.shapes.slim}
                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'shapes', 'slim', e.target.checked)}
                                            className="hidden"
                                          />
                                          <span>{isRtl ? "لاغر" : "Slim"}</span>
                                        </label>

                                        {/* Athletic Shape */}
                                        <label className={`px-2.5 py-1 rounded-lg border text-[10px] font-black cursor-pointer flex items-center gap-1.5 transition-all ${
                                          cell.shapes.athletic
                                            ? 'bg-sky-600/10 border-sky-500 text-sky-400'
                                            : 'border-neutral-800 text-neutral-500 hover:text-neutral-300'
                                        }`}>
                                          <input
                                            type="checkbox"
                                            checked={cell.shapes.athletic}
                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'shapes', 'athletic', e.target.checked)}
                                            className="hidden"
                                          />
                                          <span>{isRtl ? "ورزشکار" : "Athletic"}</span>
                                        </label>

                                        {/* Heavy Shape */}
                                        <label className={`px-2.5 py-1 rounded-lg border text-[10px] font-black cursor-pointer flex items-center gap-1.5 transition-all ${
                                          cell.shapes.heavy
                                            ? 'bg-sky-600/10 border-sky-500 text-sky-400'
                                            : 'border-neutral-800 text-neutral-500 hover:text-neutral-300'
                                        }`}>
                                          <input
                                            type="checkbox"
                                            checked={cell.shapes.heavy}
                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'shapes', 'heavy', e.target.checked)}
                                            className="hidden"
                                          />
                                          <span>{isRtl ? "تنومند" : "Heavy"}</span>
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 text-right text-[11px] text-neutral-500 font-semibold italic">
                                    {isRtl ? "مشخصات ابعادی برای این سایز تنظیم نشده است." : "No dimensional constraints configured for this size."}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={saveSizeGuidesSubmit}
                          disabled={savingSizeGuides}
                          className="px-8 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/10 flex items-center gap-2"
                        >
                          {savingSizeGuides ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>{isRtl ? "ذخیره و همگام‌سازی مشخصات سایزبندی" : "Save and Sync Sizing Guide"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CLIENT-SIDE IMAGE COMPRESSOR */}
              {activeTab === 'compressor' && (
                <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                  <div>
                    <h3 className="text-lg font-black">{t.image_compressor}</h3>
                    <p className="text-xs text-neutral-400">{isRtl ? "کاهش بارگذاری دیتابیس با فشرده‌سازی عکس‌ها در مرورگر با استفاده از بستر HTML5 Canvas." : "Utilize client-side HTML5 canvas technology to downsample photos, avoiding bandwidth bloat."}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    
                    {/* Upload File Select Form */}
                    <div className="space-y-4">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-neutral-800 hover:border-sky-500/50 bg-neutral-900/10 hover:bg-sky-500/5 py-12 px-6 rounded-2xl text-center cursor-pointer transition-all flex flex-col justify-center items-center gap-3"
                      >
                        <Upload className="w-10 h-10 text-neutral-500" />
                        <p className="text-xs font-extrabold">{t.drag_drop_image}</p>
                        <span className="text-[10px] text-neutral-500">{isRtl ? "پشتیبانی از فرمت‌های JPG و PNG" : "Supports high-res JPG, PNG"}</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCompressorFileChange}
                          className="hidden"
                        />
                      </div>

                      {compressorFile && (
                        <div className="p-4 bg-neutral-950/40 rounded-xl border border-neutral-800 space-y-3">
                          <h4 className="text-xs font-bold text-neutral-300 truncate">File: {compressorFile.name}</h4>
                          
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-2.5 bg-neutral-900 rounded-lg">
                              <p className="text-[10px] text-neutral-500">{t.original_size}</p>
                              <p className="text-sm font-black text-red-400">{compressorOriginalSize} KB</p>
                            </div>
                            
                            <div className="p-2.5 bg-neutral-900 rounded-lg">
                              <p className="text-[10px] text-neutral-500">{t.compressed_size}</p>
                              <p className="text-sm font-black text-emerald-400">{compressorCompressedSize} KB</p>
                            </div>
                          </div>

                          {/* Compression ratio savings indicator */}
                          <div className="text-center py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-lg">
                            {isRtl ? "صرفه‌جویی در فضا:" : "Bandwidth Savings:"} {Math.round((1 - (compressorCompressedSize / compressorOriginalSize)) * 100)}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image Preview & Apply to Product */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-neutral-400">{isRtl ? "پیش‌نمایش تصویر فشرده" : "Compressed Preview"}</h4>
                      
                      {compressorPreview ? (
                        <div className="space-y-4">
                          <div className="h-60 bg-neutral-950/40 border border-neutral-800 rounded-xl overflow-hidden relative">
                            <img src={compressorPreview} alt="compressed preview" className="w-full h-full object-contain" />
                          </div>

                          <div>
                            <label className="block text-xs font-extrabold mb-1.5 text-neutral-400">{isRtl ? "این تصویر به کدام کالا اعمال شود؟" : "Apply compressed photo to which product?"}</label>
                            
                            {products.length === 0 ? (
                              <p className="text-xs text-amber-400 font-bold">{isRtl ? "ابتدا یک محصول اضافه کنید." : "Please add a product first."}</p>
                            ) : (
                              <div className="space-y-2">
                                {products.map(prod => (
                                  <div key={prod.id} className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/30 transition-all">
                                    <div className="flex items-center gap-2">
                                      <span className="w-3.5 h-3.5 rounded bg-sky-500/20 text-sky-400 font-mono text-[9px] flex items-center justify-center">ID</span>
                                      <span className="text-xs font-bold truncate max-w-[200px]">{isRtl ? prod.name_fa : prod.name_en}</span>
                                    </div>
                                    
                                    <button
                                      type="button"
                                      disabled={compressorUploading}
                                      onClick={() => uploadAndApplyToProduct(prod)}
                                      className="py-1 px-3 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black rounded transition-all"
                                    >
                                      {compressorUploading ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <span>{isRtl ? "انتخاب و اعمال" : "Select & Apply"}</span>
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-60 bg-neutral-950/20 border border-neutral-800 border-dashed rounded-xl flex items-center justify-center text-neutral-500 text-xs">
                          {isRtl ? "عکسی را برای پیش‌نمایش و اعمال انتخاب کنید." : "No photo selected for compilation."}
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: STORE SETTINGS */}
              {activeTab === 'settings' && (
                <div className={`p-6 rounded-2xl border max-w-2xl mx-auto space-y-6 ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                  <div>
                    <h3 className="text-lg font-black">{t.store_settings}</h3>
                    <p className="text-xs text-neutral-400">{isRtl ? "تنظیمات آدرس‌دهی و هویت تجاری فروشگاه پوشاک شما." : "Change slug routing URLs and branding details."}</p>
                  </div>

                  <form onSubmit={handleSettingsSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.shop_name}</label>
                      <input
                        type="text"
                        required
                        value={settingsShopName}
                        onChange={(e) => setSettingsShopName(e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.shop_slug}</label>
                      <input
                        type="text"
                        required
                        value={settingsShopSlug}
                        onChange={(e) => setSettingsShopSlug(e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 text-left dir-ltr ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full py-2.5 mt-2 bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-extrabold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      {savingSettings ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>{t.save}</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

            </>
          )}

        </div>
      </main>

    </div>
  );
}
