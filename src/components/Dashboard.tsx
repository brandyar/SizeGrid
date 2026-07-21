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
  Moon,
  Search,
  Warehouse,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  lang: 'fa' | 'en';
  setLang: (lang: 'fa' | 'en') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

type ActiveTab = 'products' | 'warehouse' | 'compressor' | 'settings';
type EditSubTab = 'general' | 'guides' | 'matrix';

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
  const [warehouseInventory, setWarehouseInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Panel/Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');

  // Products CRUD State
  const [isEditingProd, setIsEditingProd] = useState<Product | null>(null); // null = listing, Product = unified edit page
  const [editTab, setEditTab] = useState<EditSubTab>('general');

  // Product Form states
  const [prodFormNameFa, setProdFormNameFa] = useState('');
  const [prodFormNameEn, setProdFormNameEn] = useState('');
  const [prodFormDescFa, setProdFormDescFa] = useState('');
  const [prodFormDescEn, setProdFormDescEn] = useState('');
  const [prodFormBasePrice, setProdFormBasePrice] = useState(500000);
  const [prodFormCategory, setProdFormCategory] = useState('Clothing');
  const [prodFormImage, setProdFormImage] = useState('');
  const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
  const [prodFormStatus, setProdFormStatus] = useState<'idle' | 'saving'>('idle');

  // Matrix Editor State within Edit Form
  const [matrixGridState, setMatrixGridState] = useState<Record<string, { stock: number; price: number; enabled: boolean }>>({});
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Size Guides state within Edit Form
  const [sizeGuidesList, setSizeGuidesList] = useState<any[]>([]);
  const [sizeGuidesFormState, setSizeGuidesFormState] = useState<Record<string, { enabled: boolean; min_height: number; max_height: number; min_weight: number; max_weight: number; shapes: { slim: boolean; athletic: boolean; heavy: boolean } }>>({});
  const [savingSizeGuides, setSavingSizeGuides] = useState(false);

  // Warehouse Search and Quick Update State
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [updatingWarehouseId, setUpdatingWarehouseId] = useState<number | null>(null);
  const [localStockEdits, setLocalStockEdits] = useState<Record<number, number>>({});
  const [localPriceEdits, setLocalPriceEdits] = useState<Record<number, number>>({});

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

  // Load baseline resources
  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [prodsList, colorsList, sizesList, allInv] = await Promise.all([
        DirectusAPI.getProducts(),
        DirectusAPI.getColors(),
        DirectusAPI.getSizes(),
        DirectusAPI.getAllInventory()
      ]);
      setProducts(prodsList);
      setColors(colorsList);
      setSizes(sizesList.sort((a, b) => a.sort_order - b.sort_order));
      setWarehouseInventory(allInv);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      const errMsg = err?.message || String(err);
      setError(isRtl ? `خطا در بارگذاری اطلاعات: ${errMsg}` : `Failed to load dashboard resources: ${errMsg}`);
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

  // Toggle selection lists
  const toggleColorSelect = (id: number) => {
    setSelectedColorIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleSizeSelect = (id: number) => {
    setSelectedSizeIds(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  // --- PRODUCTS CRUD LOGIC ---
  const triggerAddProductMode = () => {
    const merchantOwnedCount = products.filter(p => p.created_by === currentUser?.id).length;
    if (merchantOwnedCount >= 30) {
      setError(t.free_tier_warning);
      return;
    }
    setError('');
    setEditTab('general');
    setIsEditingProd({ id: 0, name_fa: '', name_en: '', base_price: 500000 });
    setProdFormNameFa('');
    setProdFormNameEn('');
    setProdFormDescFa('');
    setProdFormDescEn('');
    setProdFormBasePrice(500000);
    setProdFormCategory('Clothing');
    setProdFormImage('');
    // Pre-select first 3 colors and sizes as a helper
    setSelectedColorIds(colors.slice(0, 3).map(c => c.id));
    setSelectedSizeIds(sizes.slice(0, 3).map(s => s.id));

    // Initialize clean Matrix Grid State
    const gridState: Record<string, { stock: number; price: number; enabled: boolean }> = {};
    colors.forEach(col => {
      sizes.forEach(sz => {
        const key = `${col.id}-${sz.id}`;
        gridState[key] = { stock: 10, price: 500000, enabled: false };
      });
    });
    setMatrixGridState(gridState);

    // Initialize clean guides
    const formState: Record<string, any> = {};
    sizes.forEach(sz => {
      formState[sz.id] = {
        enabled: false,
        min_height: 150,
        max_height: 180,
        min_weight: 50,
        max_weight: 80,
        shapes: { slim: true, athletic: true, heavy: false }
      };
    });
    setSizeGuidesFormState(formState);
  };

  const triggerEditProductMode = async (prod: Product) => {
    setError('');
    setEditTab('general');
    setIsEditingProd(prod);
    setProdFormNameFa(prod.name_fa);
    setProdFormNameEn(prod.name_en);
    setProdFormDescFa(prod.description_fa || '');
    setProdFormDescEn(prod.description_en || '');
    setProdFormBasePrice(prod.base_price);
    setProdFormCategory(prod.category || 'Clothing');
    setProdFormImage(prod.image || '');

    try {
      // Fetch current inventory configuration
      const inv = await DirectusAPI.getInventoryForProduct(prod.id);
      
      const activeColors = Array.from(new Set(inv.map(i => i.color_id)));
      const activeSizes = Array.from(new Set(inv.map(i => i.size_id)));

      // If no inventory exists, default to empty or first 3
      setSelectedColorIds(activeColors.length > 0 ? activeColors : colors.slice(0, 3).map(c => c.id));
      setSelectedSizeIds(activeSizes.length > 0 ? activeSizes : sizes.slice(0, 3).map(s => s.id));

      // Build grid state from inventory
      const gridState: Record<string, { stock: number; price: number; enabled: boolean }> = {};
      colors.forEach(col => {
        sizes.forEach(sz => {
          const key = `${col.id}-${sz.id}`;
          const matched = inv.find(i => i.color_id === col.id && i.size_id === sz.id);
          gridState[key] = {
            stock: matched ? matched.stock : 0,
            price: matched ? matched.price : prod.base_price,
            enabled: !!matched
          };
        });
      });
      setMatrixGridState(gridState);

      // Fetch Sizing guides
      const guides = await DirectusAPI.getSizeGuidesForProduct(prod.id);
      setSizeGuidesList(guides);

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
      setError(isRtl ? "خطا در دریافت جزئیات ابعادی کالا." : "Failed to load product dimensional configs.");
    }
  };

  const saveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingProd) return;

    if (selectedColorIds.length === 0 || selectedSizeIds.length === 0) {
      setError(isRtl 
        ? "لطفاً حداقل یک رنگ و یک سایز را برای ایجاد ماتریس متغیرها انتخاب کنید." 
        : "Please select at least one color and one size to generate stock variants."
      );
      return;
    }

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
      let savedProduct: Product;
      if (isEditingProd.id === 0) {
        // Add new
        savedProduct = await DirectusAPI.addProduct(payload);
        setSuccess(isRtl ? "محصول با موفقیت ثبت شد. متغیرهای انبار اکنون خودکار ساخته شدند." : "Product registered. Stock variants created automatically.");
      } else {
        // Edit existing
        savedProduct = await DirectusAPI.updateProduct(isEditingProd.id, payload);
        setSuccess(isRtl ? "اطلاعات کلی محصول با موفقیت به‌روزرسانی شد." : "Product profile updated successfully.");
      }

      // Automatically sync inventory combinations (N x M)
      // Retrieve current database inventory to check what already exists
      const existingInventory = await DirectusAPI.getInventoryForProduct(savedProduct.id);
      const targetCombinations: Array<Omit<InventoryItem, 'id'>> = [];

      selectedColorIds.forEach(colId => {
        selectedSizeIds.forEach(szId => {
          const matched = existingInventory.find(i => i.color_id === colId && i.size_id === szId);
          targetCombinations.push({
            product_id: savedProduct.id,
            color_id: colId,
            size_id: szId,
            stock: matched ? matched.stock : 0, // Preserve stock level if it exists, default to 0
            price: matched ? matched.price : Number(prodFormBasePrice) // Preserve price override, default to product base
          });
        });
      });

      // Synchronize database records
      await DirectusAPI.syncInventory(savedProduct.id, targetCombinations);

      // Refresh listings
      await loadDashboardData();

      // Automatically transition editor to editing the saved product instance so sub-tabs are fully available!
      await triggerEditProductMode(savedProduct);

      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      if (err.message === "FREE_TIER_LIMIT_REACHED") {
        setError(t.free_tier_warning);
      } else {
        setError(isRtl ? "خطا در ثبت اطلاعات و همگام‌سازی انبار." : "Failed to record product and sync inventory grid.");
      }
    } finally {
      setProdFormStatus('idle');
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

  // --- MATRIX COMPONENT MANAGEMENT ---
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

  const saveProductMatrix = async () => {
    if (!isEditingProd || isEditingProd.id === 0) return;
    setSavingMatrix(true);
    setError('');

    // Transform active enabling matrix cells to match InventoryItem payload
    const updatedPayload: Array<Omit<InventoryItem, 'id'>> = [];
    
    selectedColorIds.forEach(colId => {
      selectedSizeIds.forEach(szId => {
        const key = `${colId}-${szId}`;
        const cell = matrixGridState[key];
        if (cell && cell.enabled) {
          updatedPayload.push({
            product_id: isEditingProd.id,
            color_id: colId,
            size_id: szId,
            stock: cell.stock,
            price: cell.price
          });
        }
      });
    });

    try {
      await DirectusAPI.syncInventory(isEditingProd.id, updatedPayload);
      setSuccess(isRtl ? "ماتریس موجودی محصول با موفقیت ذخیره شد." : "Product inventory matrix synced successfully.");
      setTimeout(() => setSuccess(''), 3000);
      
      // Reload states
      await triggerEditProductMode(isEditingProd);
    } catch (e) {
      setError(isRtl ? "خطا در ثبت ماتریس موجودی کالا." : "Failed to save inventory matrix.");
    } finally {
      setSavingMatrix(false);
    }
  };

  // --- SIZE GUIDES STATE HANDLER ---
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

  const saveProductSizeGuides = async () => {
    if (!isEditingProd || isEditingProd.id === 0) return;
    setSavingSizeGuides(true);
    setError('');

    try {
      // Walk through only the chosen sizes of this product
      for (const szId of selectedSizeIds) {
        const formCell = sizeGuidesFormState[szId];
        const existingGuide = sizeGuidesList.find(g => g.size_id === szId);

        if (formCell && formCell.enabled) {
          const measurements = {
            min_height: Number(formCell.min_height),
            max_height: Number(formCell.max_height),
            min_weight: Number(formCell.min_weight),
            max_weight: Number(formCell.max_weight),
            shapes: formCell.shapes
          };
          await DirectusAPI.saveSizeGuide(
            isEditingProd.id,
            szId,
            measurements,
            existingGuide?.id
          );
        } else {
          if (existingGuide) {
            await DirectusAPI.deleteSizeGuide(existingGuide.id);
          }
        }
      }

      setSuccess(isRtl ? "راهنمای ابعادی سایز با موفقیت ثبت شد." : "Size guides compiled successfully.");
      setTimeout(() => setSuccess(''), 3000);
      await triggerEditProductMode(isEditingProd);
    } catch (e) {
      setError(isRtl ? "خطا در ذخیره‌سازی جزئیات راهنمای سایز." : "Failed to sync size guide tables.");
    } finally {
      setSavingSizeGuides(false);
    }
  };

  // --- WAREHOUSE QUICK UPDATE ---
  const handleWarehouseQuickSave = async (invItem: InventoryItem) => {
    setUpdatingWarehouseId(invItem.id);
    setError('');

    const targetStock = localStockEdits[invItem.id] !== undefined ? localStockEdits[invItem.id] : invItem.stock;
    const targetPrice = localPriceEdits[invItem.id] !== undefined ? localPriceEdits[invItem.id] : invItem.price;

    try {
      await DirectusAPI.updateInventoryItem(invItem.id, {
        stock: Number(targetStock),
        price: Number(targetPrice)
      });
      setSuccess(isRtl ? "موجودی با موفقیت به‌روزرسانی شد." : "Stock item updated successfully.");
      setTimeout(() => setSuccess(''), 3000);

      // Refresh database records
      const allInv = await DirectusAPI.getAllInventory();
      setWarehouseInventory(allInv);
    } catch (e) {
      setError(isRtl ? "خطا در ذخیره‌سازی اطلاعات تغییر یافته." : "Failed to update item values.");
    } finally {
      setUpdatingWarehouseId(null);
    }
  };

  const handleWarehouseLocalChange = (itemId: number, field: 'stock' | 'price', value: string) => {
    const valNum = Math.max(0, parseInt(value) || 0);
    if (field === 'stock') {
      setLocalStockEdits(prev => ({ ...prev, [itemId]: valNum }));
    } else {
      setLocalPriceEdits(prev => ({ ...prev, [itemId]: valNum }));
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

  // Filter products owned by user
  const userProducts = products.filter(p => p.created_by === currentUser?.id);
  const activeProductsCount = userProducts.length;

  // Filter warehouse records matching the search query
  const filteredWarehouseItems = warehouseInventory.filter(item => {
    const matchedProd = products.find(p => p.id === item.product_id);
    if (!matchedProd) return false;

    // Search matches product names
    const searchString = warehouseSearch.trim().toLowerCase();
    if (!searchString) return true;

    return (
      matchedProd.name_fa.toLowerCase().includes(searchString) ||
      matchedProd.name_en.toLowerCase().includes(searchString) ||
      matchedProd.category?.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* SIDEBAR NAVIGATION - Desktop */}
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
              onClick={() => { setActiveTab('products'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${activeTab === 'products' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'}`}
            >
              <Package className="w-4 h-4" />
              <span>{isRtl ? "مدیریت کالاها" : "Products Manager"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('warehouse'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${activeTab === 'warehouse' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'}`}
            >
              <Warehouse className="w-4 h-4" />
              <span>{isRtl ? "انبار و موجودی" : "Warehouse & Stock"}</span>
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
        
        {/* TOP STATUS BAR */}
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
                onClick={() => { setActiveTab('warehouse'); setIsEditingProd(null); }}
                className={`p-1.5 rounded-md ${activeTab === 'warehouse' ? 'bg-sky-600 text-white' : 'text-neutral-400'}`}
                title={isRtl ? "انبار" : "Warehouse"}
              >
                <Warehouse className="w-4 h-4" />
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
                {activeTab === 'warehouse' ? (isRtl ? "مدیریت انبار" : "Warehouse") : ''}
                {activeTab === 'compressor' ? t.image_compressor : ''}
                {activeTab === 'settings' ? t.store_settings : ''}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-extrabold text-neutral-300">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRtl ? `کالاها: ${activeProductsCount} از ۳۰ (طرح رایگان)` : `Products: ${activeProductsCount} of 30 (Free Tier)`}</span>
            </span>

            {/* Language Controls */}
            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className="px-2.5 py-1.5 border rounded-lg text-xs font-semibold hover:bg-neutral-500/10 border-neutral-800 text-neutral-300"
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
          </div>
        </header>

        {/* CONTAINER CONTENT VIEWPORTS */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          
          {/* Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
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
                    // A. PRODUCT LISTING
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-black">{isRtl ? "کاتالوگ لباس‌های شما" : "Garments Catalog"}</h3>
                          <p className="text-[11px] sm:text-xs text-neutral-400">{isRtl ? "محصولات خود را تعریف کرده و جدول سایز و تنوع رنگ آن را مشخص کنید." : "Add garments, and configure size/color variations grid."}</p>
                        </div>
                        <button
                          onClick={triggerAddProductMode}
                          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-sky-600/10 flex items-center gap-2 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t.add_product}</span>
                        </button>
                      </div>

                      {products.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
                          <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                          <p className="text-sm font-bold text-neutral-400">{isRtl ? "هیچ محصولی ثبت نشده است." : "No products available."}</p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {products.map(prod => (
                            <div key={prod.id} className={`rounded-xl border overflow-hidden flex flex-col justify-between ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                              <div>
                                <div className="h-40 bg-neutral-950/20 relative">
                                  {prod.image ? (
                                    <img src={prod.image} alt={prod.name_fa} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col justify-center items-center text-neutral-500 bg-neutral-950/20">
                                      <Image className="w-8 h-8 opacity-40 mb-1" />
                                      <span className="text-[10px]">{isRtl ? "فاقد تصویر کالا" : "No Image"}</span>
                                    </div>
                                  )}
                                  <span className="absolute top-3 left-3 px-2 py-1 bg-sky-600 text-white rounded-lg font-bold text-[9px]">
                                    {prod.category}
                                  </span>
                                </div>

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

                              <div className="p-4 border-t border-neutral-800/40 grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => triggerEditProductMode(prod)}
                                  className="col-span-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black rounded-lg flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>{isRtl ? "ویرایش و تنظیمات کالا" : "Edit & Configure Product"}</span>
                                </button>

                                <a
                                  href={`/shop/${currentUser?.shop_slug || 'shop'}/product/${prod.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="col-span-2 py-1.5 border border-dashed border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition-all"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                  <span>{isRtl ? "پیش‌نمایش فروشگاه خریدار" : "Public Shop Preview"}</span>
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
                    // B. UNIFIED EDIT SHEET (CONSOLIDATED FORM IN RESPONSIVE TABS)
                    <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                      
                      {/* Product header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/40 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-neutral-950/20 border border-neutral-800 rounded-lg overflow-hidden shrink-0">
                            {prodFormImage ? (
                              <img src={prodFormImage} alt="Product logo" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-sky-400">
                              {isEditingProd.id === 0 ? (isRtl ? "ایجاد محصول جدید" : "Create New Product") : (isRtl ? "تنظیمات همه‌جانبه کالا" : "Configure Product Suite")}
                            </h3>
                            <p className="text-xs font-bold text-neutral-400 mt-0.5">
                              {isEditingProd.id === 0 
                                ? (isRtl ? "اطلاعات محصول را ثبت کنید" : "Define general options") 
                                : (isRtl ? `در حال ویرایش: ${isEditingProd.name_fa}` : `Editing: ${isEditingProd.name_en}`)
                              }
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsEditingProd(null)}
                          className="px-3 py-1.5 border border-neutral-700 hover:bg-neutral-800 text-neutral-400 text-xs rounded-lg font-bold flex items-center gap-1"
                        >
                          <ChevronRight className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
                          <span>{isRtl ? "بازگشت به لیست کاتالوگ" : "Back to Catalog"}</span>
                        </button>
                      </div>

                      {/* CONSOLIDATED EDIT TABS */}
                      <div className="flex border-b border-neutral-800/60 mb-6 overflow-x-auto gap-2">
                        <button
                          type="button"
                          onClick={() => setEditTab('general')}
                          className={`py-2 px-4 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap ${editTab === 'general' ? 'border-sky-500 text-sky-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                        >
                          <span>{isRtl ? "۱. مشخصات عمومی، رنگ و سایز" : "1. General & Attribute Selection"}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingProd.id === 0) {
                              setError(isRtl ? "ابتدا مشخصات عمومی را ذخیره کنید تا این بخش فعال شود." : "Save general configuration first to enable Sizing guides.");
                              return;
                            }
                            setEditTab('guides');
                          }}
                          className={`py-2 px-4 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap ${isEditingProd.id === 0 ? 'opacity-40 cursor-not-allowed' : ''} ${editTab === 'guides' ? 'border-sky-500 text-sky-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                        >
                          <span>{isRtl ? "۲. راهنمای علمی سایز مشتری" : "2. Sizing Advisor Rules"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingProd.id === 0) {
                              setError(isRtl ? "ابتدا مشخصات عمومی را ذخیره کنید تا این بخش فعال شود." : "Save general configuration first to enable Stock matrix.");
                              return;
                            }
                            setEditTab('matrix');
                          }}
                          className={`py-2 px-4 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap ${isEditingProd.id === 0 ? 'opacity-40 cursor-not-allowed' : ''} ${editTab === 'matrix' ? 'border-sky-500 text-sky-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                        >
                          <span>{isRtl ? "۳. ماتریس ۲ بعدی انبار محصول" : "3. 2D Stock Matrix Grid"}</span>
                        </button>
                      </div>

                      {/* SUBTAB 1: GENERAL INFO */}
                      {editTab === 'general' && (
                        <form onSubmit={saveProductSubmit} className="space-y-6">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.product_name_fa}</label>
                              <input
                                type="text"
                                required
                                value={prodFormNameFa}
                                onChange={(e) => setProdFormNameFa(e.target.value)}
                                placeholder="مثال: هودی نخی کلاه‌دار"
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
                                placeholder="e.g. Cotton Hooded Sweatshirt"
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
                                placeholder="شرح الیاف، قواره و شرایط شستشو..."
                                className={`w-full px-3 py-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold mb-1.5 text-neutral-400">{t.desc_en}</label>
                              <textarea
                                rows={3}
                                value={prodFormDescEn}
                                onChange={(e) => setProdFormDescEn(e.target.value)}
                                placeholder="English material specifications, style details..."
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
                            </div>
                          </div>

                          {/* BRAND COLOR MULTI-SELECT CHIPS */}
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-xs font-extrabold text-neutral-400">{isRtl ? "رنگ‌های موجود برای این کالا (رنگ‌ها را انتخاب کنید)" : "Available Garment Colors (Multi-Select)"}</h4>
                              <p className="text-[10px] text-neutral-500 mt-1">{isRtl ? "رنگ‌های مربوط به کالا را کلیک و تیک بزنید." : "Toggle active colors of this product layout."}</p>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {colors.map(col => {
                                const isSelected = selectedColorIds.includes(col.id);
                                return (
                                  <button
                                    key={col.id}
                                    type="button"
                                    onClick={() => toggleColorSelect(col.id)}
                                    className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${isSelected ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-md shadow-sky-600/5' : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200'}`}
                                  >
                                    <span className="w-3.5 h-3.5 rounded-full border border-neutral-800 shrink-0" style={{ backgroundColor: col.hex_code }} />
                                    <span>{isRtl ? col.name_fa : col.name_en}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 ml-1" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* BRAND SIZE MULTI-SELECT CHIPS */}
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-xs font-extrabold text-neutral-400">{isRtl ? "سایزهای موجود برای این کالا (سایزها را انتخاب کنید)" : "Available Garment Sizes (Multi-Select)"}</h4>
                              <p className="text-[10px] text-neutral-500 mt-1">{isRtl ? "سایزهای تولیدی و آماده ارسال این کالا را انتخاب کنید." : "Toggle active sizes of this garment."}</p>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {sizes.map(sz => {
                                const isSelected = selectedSizeIds.includes(sz.id);
                                return (
                                  <button
                                    key={sz.id}
                                    type="button"
                                    onClick={() => toggleSizeSelect(sz.id)}
                                    className={`px-4 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${isSelected ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200'}`}
                                  >
                                    <span className="w-6 h-6 rounded-lg bg-neutral-950/60 flex items-center justify-center text-[10px] text-sky-400 font-bold border border-neutral-800">{sz.name}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 ml-1" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* INVENTORY HELPER CARD */}
                          <div className="p-4 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl text-xs space-y-1">
                            <p className="font-extrabold">{isRtl ? "💡 سیستم تولید خودکار انبار هوشمند" : "💡 Auto Stock-Matrix Compiler"}</p>
                            <p className="leading-relaxed opacity-90">
                              {isRtl 
                                ? `با ذخیره این محصول، سیستم انبار متقاطع را چک می‌کند. برای تعداد (${selectedColorIds.length} رنگ × ${selectedSizeIds.length} سایز) به طور دقیق و خودکار ${selectedColorIds.length * selectedSizeIds.length} آیتم انبار با موجودی‌های منحصربه‌فرد ثبت خواهد شد تا به صورت دقیق به ویجت پیشنهاد سایز متصل شوند.`
                                : `By completing the save, the matrix syncs instantly. For (${selectedColorIds.length} colors × ${selectedSizeIds.length} sizes), exactly ${selectedColorIds.length * selectedSizeIds.length} database combinations are generated with default base price of $${(prodFormBasePrice / 50000).toFixed(1)}.`}
                            </p>
                          </div>

                          {/* Form save footer */}
                          <div className="flex justify-end pt-4 border-t border-neutral-800/40 gap-3">
                            <button
                              type="button"
                              onClick={() => setIsEditingProd(null)}
                              className="px-4 py-2.5 border border-neutral-700 hover:bg-neutral-800 rounded-lg text-xs text-neutral-400 font-bold"
                            >
                              {t.cancel}
                            </button>

                            <button
                              type="submit"
                              disabled={prodFormStatus === 'saving'}
                              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-2"
                            >
                              {prodFormStatus === 'saving' ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>{isEditingProd.id === 0 ? (isRtl ? "ایجاد محصول و همگام‌سازی انبار" : "Create Product & Generate Matrix") : (isRtl ? "ذخیره و همگام‌سازی تنوع لباس" : "Save Changes & Update Inventory")}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* SUBTAB 2: SIZE GUIDES EDITOR FOR THE CHOSEN SIZES */}
                      {editTab === 'guides' && isEditingProd.id > 0 && (
                        <div className="space-y-6">
                          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs flex items-center gap-2.5">
                            <Info className="w-4 h-4 text-indigo-400" />
                            <span>
                              {isRtl
                                ? "راهنما: مشخص کنید هر سایز لباس برای خریداران با چه حدود قد و وزنی طراحی شده است تا ویجت هوشمند بتواند سایز مناسب را به آنها پیشنهاد دهد."
                                : "Specify the physical parameters for each selected size of this garment to run the advisor calculator."}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {sizes
                              .filter(sz => selectedSizeIds.includes(sz.id))
                              .map(sz => {
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
                                    className={`p-4 rounded-xl border transition-all ${
                                      cell.enabled 
                                        ? 'bg-sky-500/5 border-sky-500/20' 
                                        : 'bg-neutral-900/10 border-neutral-800 opacity-60'
                                    }`}
                                  >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                      {/* Identifier / Title */}
                                      <div className="flex items-center gap-4 shrink-0 min-w-[150px]">
                                        <div className="w-10 h-10 rounded-xl bg-sky-600/10 text-sky-400 font-extrabold text-xs flex items-center justify-center border border-sky-500/20">
                                          {sz.name}
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={cell.enabled}
                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'enabled', null, e.target.checked)}
                                            className="rounded border-neutral-700 bg-neutral-900 text-sky-600 focus:ring-sky-500 w-4 h-4"
                                          />
                                          <span className="text-xs font-black text-neutral-300">
                                            {cell.enabled ? (isRtl ? "راهنما فعال است" : "Active Guide") : (isRtl ? "فاقد بازه علمی" : "No rules")}
                                          </span>
                                        </label>
                                      </div>

                                      {cell.enabled ? (
                                        <div className="flex-1 grid sm:grid-cols-3 gap-6">
                                          {/* Height bounds */}
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "حدود قد مناسب (سانتی‌متر):" : "Height Range (cm):"}</span>
                                            <div className="flex items-center gap-1.5">
                                              <input
                                                type="number"
                                                value={cell.min_height}
                                                onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_height', null, Number(e.target.value))}
                                                className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                              />
                                              <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                              <input
                                                type="number"
                                                value={cell.max_height}
                                                onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_height', null, Number(e.target.value))}
                                                className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                              />
                                            </div>
                                          </div>

                                          {/* Weight bounds */}
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "حدود وزن مناسب (کیلوگرم):" : "Weight Range (kg):"}</span>
                                            <div className="flex items-center gap-1.5">
                                              <input
                                                type="number"
                                                value={cell.min_weight}
                                                onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_weight', null, Number(e.target.value))}
                                                className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-indigo-400 font-extrabold"
                                              />
                                              <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                              <input
                                                type="number"
                                                value={cell.max_weight}
                                                onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_weight', null, Number(e.target.value))}
                                                className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-indigo-400 font-extrabold"
                                              />
                                            </div>
                                          </div>

                                          {/* Body shapes */}
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "سازگاری با ساختار بدنی:" : "Compatible Body Shapes:"}</span>
                                            <div className="flex flex-wrap gap-1.5">
                                              {/* Slim */}
                                              <label className={`px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
                                                cell.shapes.slim ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'border-neutral-800 text-neutral-500'
                                              }`}>
                                                <input
                                                  type="checkbox"
                                                  checked={cell.shapes.slim}
                                                  onChange={(e) => handleSizeGuideCellChange(sz.id, 'shapes', 'slim', e.target.checked)}
                                                  className="hidden"
                                                />
                                                <span>{isRtl ? "لاغر" : "Slim"}</span>
                                              </label>

                                              {/* Athletic */}
                                              <label className={`px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
                                                cell.shapes.athletic ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'border-neutral-800 text-neutral-500'
                                              }`}>
                                                <input
                                                  type="checkbox"
                                                  checked={cell.shapes.athletic}
                                                  onChange={(e) => handleSizeGuideCellChange(sz.id, 'shapes', 'athletic', e.target.checked)}
                                                  className="hidden"
                                                />
                                                <span>{isRtl ? "ورزشکار" : "Athletic"}</span>
                                              </label>

                                              {/* Heavy */}
                                              <label className={`px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
                                                cell.shapes.heavy ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'border-neutral-800 text-neutral-500'
                                              }`}>
                                                <input
                                                  type="checkbox"
                                                  checked={cell.shapes.heavy}
                                                  onChange={(e) => handleSizeGuideCellChange(sz.id, 'shapes', 'heavy', e.target.checked)}
                                                  className="hidden"
                                                />
                                                <span>{isRtl ? "توپر" : "Heavy"}</span>
                                              </label>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex-1 text-right text-[10px] text-neutral-500 font-semibold italic">
                                          {isRtl ? "راهنمای ابعادی برای این سایز لباس تعریف نشده است." : "No sizing guides mapped for this size option."}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          <div className="flex justify-end pt-4 border-t border-neutral-800/40">
                            <button
                              onClick={saveProductSizeGuides}
                              disabled={savingSizeGuides}
                              className="px-8 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
                            >
                              {savingSizeGuides ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>{isRtl ? "ذخیره نهایی راهنمای ابعادی" : "Save Sizing Advisor Rules"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SUBTAB 3: 2D STOCK MATRIX GRID */}
                      {editTab === 'matrix' && isEditingProd.id > 0 && (
                        <div className="space-y-6">
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2.5">
                            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                            <span>
                              {isRtl
                                ? "راهنما: جدول متقاطع زیر شامل متغیرهای فعال کالا است. موجودی و قیمت اختصاصی هر رنگ-سایز را در زیر ویرایش کرده و ذخیره کنید."
                                : "Adjust individual stock levels and price overrides for each active color-size intersection below."}
                            </span>
                          </div>

                          {/* 2D Grid Representation for Chosen Items */}
                          <div className="overflow-x-auto rounded-xl border border-neutral-800">
                            <table className="w-full text-xs text-center border-collapse">
                              <thead>
                                <tr className="bg-neutral-950/40 border-b border-neutral-800">
                                  <th className="p-4 border-r border-neutral-800 font-black text-neutral-400">{t.colors} / {t.sizes}</th>
                                  {sizes
                                    .filter(sz => selectedSizeIds.includes(sz.id))
                                    .map(sz => (
                                      <th key={sz.id} className="p-4 font-black border-r border-neutral-800 text-sky-400">
                                        <span className="text-sm font-bold block">{sz.name}</span>
                                      </th>
                                    ))}
                                </tr>
                              </thead>
                              <tbody>
                                {colors
                                  .filter(col => selectedColorIds.includes(col.id))
                                  .map(col => (
                                    <tr key={col.id} className="border-b border-neutral-800/80 hover:bg-neutral-900/10 transition-colors">
                                      <td className="p-4 border-r border-neutral-800 text-right font-extrabold flex items-center gap-3 min-w-[150px]">
                                        <span className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" style={{ backgroundColor: col.hex_code }} />
                                        <div>
                                          <p className="font-bold">{isRtl ? col.name_fa : col.name_en}</p>
                                          <code className="text-[9px] text-neutral-500 font-mono tracking-wider uppercase">{col.hex_code}</code>
                                        </div>
                                      </td>

                                      {sizes
                                        .filter(sz => selectedSizeIds.includes(sz.id))
                                        .map(sz => {
                                          const key = `${col.id}-${sz.id}`;
                                          const cell = matrixGridState[key] || { stock: 0, price: isEditingProd.base_price, enabled: false };

                                          return (
                                            <td key={sz.id} className={`p-3 border-r border-neutral-800 min-w-[140px] transition-all ${cell.enabled ? 'bg-sky-500/5' : 'bg-neutral-950/10 opacity-60'}`}>
                                              <div className="space-y-2 text-center">
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
                                                    <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-md px-1.5 py-1">
                                                      <span className="text-[9px] text-neutral-500 shrink-0">{t.stock}:</span>
                                                      <input
                                                        type="number"
                                                        value={cell.stock}
                                                        onChange={(e) => handleCellChange(col.id, sz.id, 'stock', e.target.value)}
                                                        className="w-full bg-transparent text-center focus:outline-none text-[11px] font-extrabold text-sky-400"
                                                      />
                                                    </div>

                                                    <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-md px-1.5 py-1">
                                                      <span className="text-[9px] text-neutral-500 shrink-0">$</span>
                                                      <input
                                                        type="number"
                                                        value={cell.price}
                                                        onChange={(e) => handleCellChange(col.id, sz.id, 'price', e.target.value)}
                                                        className="w-full bg-transparent text-center focus:outline-none text-[11px] font-bold"
                                                        placeholder={isEditingProd.base_price.toString()}
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

                          <div className="flex justify-end pt-4 border-t border-neutral-800/40">
                            <button
                              onClick={saveProductMatrix}
                              disabled={savingMatrix}
                              className="px-8 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
                            >
                              {savingMatrix ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>{isRtl ? "به‌روزرسانی و همگام‌سازی ماتریس" : "Save Active Matrix"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: GENERAL WAREHOUSE MANAGER (انبار) */}
              {activeTab === 'warehouse' && (
                <div className="space-y-6">
                  {/* Title & Stats */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black">{isRtl ? "مدیریت مرکزی انبار پوشاک" : "Warehouse Stock Manager"}</h3>
                      <p className="text-xs text-neutral-400">
                        {isRtl 
                          ? "لیست جامع تمام تنوع‌های لباس موجود در فروشگاه شما. موجودی و قیمت هر کدام را فوراً تغییر دهید." 
                          : "A complete directory of all color/size clothing inventory combinations in your database."}
                      </p>
                    </div>

                    {/* Search Field */}
                    <div className="relative max-w-sm w-full">
                      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={warehouseSearch}
                        onChange={(e) => setWarehouseSearch(e.target.value)}
                        placeholder={isRtl ? "جستجوی کالا بر اساس نام..." : "Search warehouse by product name..."}
                        className={`w-full pr-10 pl-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'}`}
                      />
                    </div>
                  </div>

                  {/* Table Inventory Grid */}
                  {filteredWarehouseItems.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
                      <Warehouse className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-sm font-bold text-neutral-400">
                        {isRtl ? "هیچ متغیر انبار منطبقی یافت نشد." : "No matching inventory records found."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/10">
                      {/* Desktop Table View */}
                      <table className="w-full text-xs text-center border-collapse hidden sm:table">
                        <thead>
                          <tr className="bg-neutral-950/40 border-b border-neutral-800">
                            <th className="p-4 text-right text-neutral-400 font-bold">{isRtl ? "کالای پوشاک" : "Garment Profile"}</th>
                            <th className="p-4 font-bold text-neutral-400">{isRtl ? "رنگ" : "Color"}</th>
                            <th className="p-4 font-bold text-neutral-400">{isRtl ? "سایز" : "Size"}</th>
                            <th className="p-4 font-bold text-neutral-400">{isRtl ? "موجودی انبار" : "Stock level"}</th>
                            <th className="p-4 font-bold text-neutral-400">{isRtl ? "قیمت تنوع (تومان)" : "Override Price"}</th>
                            <th className="p-4 font-bold text-neutral-400">{isRtl ? "عملیات سریع" : "Action"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWarehouseItems.map(item => {
                            const matchedProd = products.find(p => p.id === item.product_id);
                            const matchedCol = colors.find(c => c.id === item.color_id);
                            const matchedSize = sizes.find(s => s.id === item.size_id);

                            if (!matchedProd) return null;

                            // Local edits override
                            const currentLocalStock = localStockEdits[item.id] !== undefined ? localStockEdits[item.id] : item.stock;
                            const currentLocalPrice = localPriceEdits[item.id] !== undefined ? localPriceEdits[item.id] : item.price;

                            const isModified = currentLocalStock !== item.stock || currentLocalPrice !== item.price;

                            return (
                              <tr key={item.id} className="border-b border-neutral-800/60 hover:bg-neutral-900/10 transition-colors">
                                {/* Product name & photo */}
                                <td className="p-3 text-right">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-neutral-950/20 rounded-lg overflow-hidden shrink-0">
                                      {matchedProd.image ? (
                                        <img src={matchedProd.image} alt="Thumbnail" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                          <Package className="w-4 h-4" />
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-neutral-200">{isRtl ? matchedProd.name_fa : matchedProd.name_en}</p>
                                      <span className="text-[9px] text-neutral-500 px-1 py-0.2 bg-neutral-950/30 rounded inline-block mt-0.5">{matchedProd.category}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Color column */}
                                <td className="p-3">
                                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-neutral-900/30 border border-neutral-800 text-[10px] font-bold">
                                    <span className="w-3 h-3 rounded-full border border-neutral-800" style={{ backgroundColor: matchedCol?.hex_code }} />
                                    <span>{isRtl ? matchedCol?.name_fa : matchedCol?.name_en}</span>
                                  </div>
                                </td>

                                {/* Size column */}
                                <td className="p-3">
                                  <span className="px-3 py-1 bg-sky-600/10 text-sky-400 font-extrabold border border-sky-500/20 rounded-lg text-xs">
                                    {matchedSize?.name}
                                  </span>
                                </td>

                                {/* Stock edit inline */}
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-1.5 max-w-[120px] mx-auto">
                                    <input
                                      type="number"
                                      value={currentLocalStock}
                                      onChange={(e) => handleWarehouseLocalChange(item.id, 'stock', e.target.value)}
                                      className={`w-16 px-2 py-1 text-center font-extrabold text-xs rounded border bg-neutral-950 border-neutral-800 focus:outline-none focus:ring-1 focus:ring-sky-500 ${isModified ? 'text-sky-400' : 'text-neutral-300'}`}
                                    />
                                    <span className="text-[9px] text-neutral-500">{isRtl ? "عدد" : "pcs"}</span>
                                  </div>
                                </td>

                                {/* Price edit inline */}
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-1.5 max-w-[160px] mx-auto">
                                    <input
                                      type="number"
                                      value={currentLocalPrice}
                                      onChange={(e) => handleWarehouseLocalChange(item.id, 'price', e.target.value)}
                                      className={`w-28 px-2 py-1 text-center font-bold text-xs rounded border bg-neutral-950 border-neutral-800 focus:outline-none focus:ring-1 focus:ring-sky-500 ${isModified ? 'text-indigo-400' : 'text-neutral-300'}`}
                                    />
                                  </div>
                                </td>

                                {/* Save action */}
                                <td className="p-3">
                                  <button
                                    onClick={() => handleWarehouseQuickSave(item)}
                                    disabled={updatingWarehouseId === item.id}
                                    className={`py-1.5 px-3.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 mx-auto ${
                                      isModified 
                                        ? 'bg-sky-600 hover:bg-sky-500 text-white shadow shadow-sky-600/10' 
                                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/40'
                                    }`}
                                  >
                                    {updatingWarehouseId === item.id ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{isRtl ? "ذخیره" : "Save"}</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Responsive Mobile Card View */}
                      <div className="sm:hidden divide-y divide-neutral-800 p-2 space-y-4">
                        {filteredWarehouseItems.map(item => {
                          const matchedProd = products.find(p => p.id === item.product_id);
                          const matchedCol = colors.find(c => c.id === item.color_id);
                          const matchedSize = sizes.find(s => s.id === item.size_id);

                          if (!matchedProd) return null;

                          const currentLocalStock = localStockEdits[item.id] !== undefined ? localStockEdits[item.id] : item.stock;
                          const currentLocalPrice = localPriceEdits[item.id] !== undefined ? localPriceEdits[item.id] : item.price;
                          const isModified = currentLocalStock !== item.stock || currentLocalPrice !== item.price;

                          return (
                            <div key={item.id} className="pt-4 first:pt-0 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-neutral-950/20 rounded-lg overflow-hidden shrink-0">
                                  {matchedProd.image && <img src={matchedProd.image} alt="Garment" className="w-full h-full object-cover" />}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-extrabold text-xs text-neutral-200 truncate">{isRtl ? matchedProd.name_fa : matchedProd.name_en}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="w-2.5 h-2.5 rounded-full border border-neutral-700 shrink-0" style={{ backgroundColor: matchedCol?.hex_code }} />
                                    <span className="text-[10px] text-neutral-400">{isRtl ? matchedCol?.name_fa : matchedCol?.name_en} • سایز {matchedSize?.name}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 bg-neutral-950/20 p-2.5 rounded-xl border border-neutral-800">
                                <div className="space-y-1">
                                  <span className="text-[9px] text-neutral-500 font-bold block">{isRtl ? "موجودی انبار" : "Stock"}</span>
                                  <input
                                    type="number"
                                    value={currentLocalStock}
                                    onChange={(e) => handleWarehouseLocalChange(item.id, 'stock', e.target.value)}
                                    className="w-full px-2 py-1 text-center font-extrabold text-xs rounded border bg-neutral-950 border-neutral-800 text-sky-400 focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[9px] text-neutral-500 font-bold block">{isRtl ? "قیمت (تومان)" : "Price"}</span>
                                  <input
                                    type="number"
                                    value={currentLocalPrice}
                                    onChange={(e) => handleWarehouseLocalChange(item.id, 'price', e.target.value)}
                                    className="w-full px-2 py-1 text-center font-bold text-xs rounded border bg-neutral-950 border-neutral-800 text-indigo-400 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => handleWarehouseQuickSave(item)}
                                disabled={!isModified || updatingWarehouseId === item.id}
                                className={`w-full py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                                  isModified 
                                    ? 'bg-sky-600 hover:bg-sky-500 text-white' 
                                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/30'
                                }`}
                              >
                                {updatingWarehouseId === item.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" />
                                    <span>{isRtl ? "ذخیره تغییرات متغیر" : "Save Stock changes"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
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
