import React, { useState, useEffect, useRef } from 'react';
import { locales } from '../locales';
import { DirectusAPI } from '../directus';
import { storageManager, SyncStats } from '../storage';
import { useRouter } from './Router';
import { Product, InventoryItem, Color, Size, SizeGuideTemplate, SizeGuideTemplateItem, ClothingTypeSlug } from '../types';
import { AppUpdateWidget } from './AppUpdateWidget';
import { BarcodeGenerator } from './BarcodeGenerator';
import { isDesktopEnv } from '../utils/desktop';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { ProductMatrixEditor } from './dashboard/ProductMatrixEditor';
import { WarehouseTable } from './dashboard/WarehouseTable';
import { OrdersManager } from './dashboard/OrdersManager';
import { SettingsModal } from './dashboard/SettingsModal';
import { useDashboardStore } from '../store/useDashboardStore';
import {
  ShoppingCart,
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
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  FolderUp,
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
  List,
  Grid,
  Warehouse,
  CheckCircle2,
  RefreshCw,
  Ruler,
  Loader2,
  Cloud,
  CloudOff,
  Database,
  Crown,
  Wifi,
  WifiOff,
  Globe,
  Barcode as BarcodeIcon,
} from 'lucide-react';

const getDefaultMeasurementsForSize = (sizeName: string) => {
  const name = sizeName.toUpperCase().trim();
  if (name.includes('XS') || name === '36' || name === '۳۶') {
    return {
      min_height: 145, max_height: 165,
      min_weight: 40, max_weight: 55,
      min_chest: 80, max_chest: 88,
      min_waist: 65, max_waist: 73,
      min_hip: 82, max_hip: 90,
      min_shoulder: 36, max_shoulder: 39,
      min_sleeve: 52, max_sleeve: 56,
      min_length: 60, max_length: 66,
    };
  }
  if (name.includes('XXXL') || name === '46' || name === '۴۶') {
    return {
      min_height: 180, max_height: 205,
      min_weight: 95, max_weight: 120,
      min_chest: 114, max_chest: 124,
      min_waist: 102, max_waist: 112,
      min_hip: 116, max_hip: 126,
      min_shoulder: 48, max_shoulder: 52,
      min_sleeve: 64, max_sleeve: 68,
      min_length: 78, max_length: 84,
    };
  }
  if (name.includes('XXL') || name === '44' || name === '۴۴') {
    return {
      min_height: 175, max_height: 195,
      min_weight: 85, max_weight: 100,
      min_chest: 108, max_chest: 116,
      min_waist: 96, max_waist: 104,
      min_hip: 110, max_hip: 118,
      min_shoulder: 46, max_shoulder: 49,
      min_sleeve: 62, max_sleeve: 65,
      min_length: 76, max_length: 81,
    };
  }
  if (name.includes('XL') || name === '42' || name === '۴۲') {
    return {
      min_height: 172, max_height: 188,
      min_weight: 75, max_weight: 90,
      min_chest: 102, max_chest: 110,
      min_waist: 90, max_waist: 98,
      min_hip: 104, max_hip: 112,
      min_shoulder: 44, max_shoulder: 47,
      min_sleeve: 60, max_sleeve: 63,
      min_length: 73, max_length: 78,
    };
  }
  if (name.includes('L') || name === '40' || name === '۴۰') {
    return {
      min_height: 168, max_height: 182,
      min_weight: 65, max_weight: 80,
      min_chest: 96, max_chest: 104,
      min_waist: 84, max_waist: 92,
      min_hip: 98, max_hip: 106,
      min_shoulder: 42, max_shoulder: 45,
      min_sleeve: 58, max_sleeve: 61,
      min_length: 70, max_length: 75,
    };
  }
  if (name.includes('M') || name === '38' || name === '۳۸') {
    return {
      min_height: 160, max_height: 176,
      min_weight: 55, max_weight: 70,
      min_chest: 90, max_chest: 98,
      min_waist: 78, max_waist: 86,
      min_hip: 92, max_hip: 100,
      min_shoulder: 40, max_shoulder: 43,
      min_sleeve: 56, max_sleeve: 59,
      min_length: 67, max_length: 72,
    };
  }
  if (name.includes('S') || name === '37' || name === '۳۷') {
    return {
      min_height: 152, max_height: 168,
      min_weight: 48, max_weight: 60,
      min_chest: 84, max_chest: 92,
      min_waist: 72, max_waist: 80,
      min_hip: 86, max_hip: 94,
      min_shoulder: 38, max_shoulder: 41,
      min_sleeve: 54, max_sleeve: 57,
      min_length: 64, max_length: 69,
    };
  }
  return {
    min_height: 150, max_height: 180,
    min_weight: 50, max_weight: 80,
    min_chest: 85, max_chest: 105,
    min_waist: 75, max_waist: 95,
    min_hip: 85, max_hip: 105,
    min_shoulder: 38, max_shoulder: 46,
    min_sleeve: 55, max_sleeve: 63,
    min_length: 65, max_length: 75,
    min_foot_length: 24.5, max_foot_length: 26.5
  };
};

export const getClothingTypeFromCategory = (catNameOrIdOrSlug?: string | number, categories?: any[]): ClothingTypeSlug => {
  if (!catNameOrIdOrSlug) return 'tops';
  const searchStr = String(catNameOrIdOrSlug).trim();

  if (categories && categories.length > 0) {
    const matched = categories.find(c => 
      String(c.id) === searchStr || 
      c.name === searchStr || 
      c.name_fa === searchStr || 
      c.slug === searchStr
    );
    if (matched) {
      if (matched.clothing_type_slug) return matched.clothing_type_slug as ClothingTypeSlug;
      if (matched.system_type) {
        const sysMap: Record<number, ClothingTypeSlug> = {
          1: 'tops',
          2: 'bottoms',
          3: 'footwear',
          4: 'one_piece',
          5: 'accessories',
          7: 'footwear',
          8: 'one_piece',
          9: 'accessories'
        };
        if (sysMap[Number(matched.system_type)]) {
          return sysMap[Number(matched.system_type)];
        }
      }
    }
  }

  const lower = searchStr.toLowerCase();
  if (lower.includes('کفش') || lower.includes('کتانی') || lower.includes('footwear') || lower.includes('shoe') || lower.includes('boots') || lower.includes('sneaker')) return 'footwear';
  if (lower.includes('شلوار') || lower.includes('شلوارک') || lower.includes('جین') || lower.includes('bottom') || lower.includes('pant') || lower.includes('jean') || lower.includes('shorts')) return 'bottoms';
  if (lower.includes('سرهمی') || lower.includes('اورال') || lower.includes('one_piece') || lower.includes('overall') || lower.includes('dress') || lower.includes('suit')) return 'one_piece';
  if (lower.includes('کلاه') || lower.includes('کیف') || lower.includes('اکسسوری') || lower.includes('accessory') || lower.includes('hat') || lower.includes('bag')) return 'accessories';
  return 'tops';
};

interface DashboardProps {
  lang: 'fa' | 'en';
  setLang: (lang: 'fa' | 'en') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

type ActiveTab = 'products' | 'orders' | 'warehouse' | 'barcodes' | 'categories' | 'templates' | 'sizes' | 'compressor' | 'settings';
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

  // Storage Adapter & Offline/Cloud Sync state
  const [syncStats, setSyncStats] = useState<SyncStats>(storageManager.getSyncStats());
  const [syncingCloud, setSyncingCloud] = useState(false);

  useEffect(() => {
    const unsubscribe = storageManager.subscribe((stats) => {
      setSyncStats(stats);
      loadDashboardData();
    });

    const handleFocus = () => {
      loadDashboardData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  const handleManualSync = async () => {
    setSyncingCloud(true);
    setError('');
    setSuccess('');
    const res = await storageManager.syncLocalToCloud();
    setSyncingCloud(false);
    if (res.success) {
      setSuccess(isRtl ? `همگام‌سازی با موفقیت انجام شد (${res.syncedCount} تغییر بروز شد).` : `Cloud sync completed (${res.syncedCount} changes synced).`);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(res.error || (isRtl ? "خطا در همگام‌سازی با سرور ابری." : "Error syncing to cloud server."));
    }
  };

  // Dashboard Store State Management
  const {
    warehouseInventory,
    setWarehouseInventory,
    warehouseSearch,
    setWarehouseSearch,
    updatingWarehouseId,
    setUpdatingWarehouseId,
    localStockEdits,
    localPriceEdits,
    localSkuEdits,
    setWarehouseLocalChange,
    matrixGridState,
    setMatrixGridState,
  } = useDashboardStore();

  // Global Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reusable Size Guide Templates
  const [templatesList, setTemplatesList] = useState<SizeGuideTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<SizeGuideTemplate | null>(null);
  const [templateFormName, setTemplateFormName] = useState('');
  const [templateFormClothingType, setTemplateFormClothingType] = useState<ClothingTypeSlug>('tops');
  const [templateFormState, setTemplateFormState] = useState<Record<string, {
    enabled: boolean;
    min_height: number;
    max_height: number;
    min_weight: number;
    max_weight: number;
    min_chest?: number;
    max_chest?: number;
    min_waist?: number;
    max_waist?: number;
    min_hip?: number;
    max_hip?: number;
    min_shoulder?: number;
    max_shoulder?: number;
    min_sleeve?: number;
    max_sleeve?: number;
    min_length?: number;
    max_length?: number;
    min_foot_length?: number;
    max_foot_length?: number;
    shapes: { slim: boolean; regular?: boolean; athletic: boolean; heavy: boolean }
  }>>({});
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Custom Sizes State
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeSortOrder, setNewSizeSortOrder] = useState(10);
  const [creatingSize, setCreatingSize] = useState(false);

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

  // Product Form Sizing Architecture states
  const [prodFormTemplateOption, setProdFormTemplateOption] = useState<'template' | 'new_template' | 'custom'>('custom');
  const [prodFormTemplateId, setProdFormTemplateId] = useState<number | string | 'custom' | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Matrix Editor Saving State
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Size Guides state within Edit Form
  const [sizeGuidesList, setSizeGuidesList] = useState<any[]>([]);
  const [sizeGuidesFormState, setSizeGuidesFormState] = useState<Record<string, {
    enabled: boolean;
    min_height: number;
    max_height: number;
    min_weight: number;
    max_weight: number;
    min_chest?: number;
    max_chest?: number;
    min_waist?: number;
    max_waist?: number;
    min_hip?: number;
    max_hip?: number;
    min_shoulder?: number;
    max_shoulder?: number;
    min_sleeve?: number;
    max_sleeve?: number;
    min_length?: number;
    max_length?: number;
    min_foot_length?: number;
    max_foot_length?: number;
    shapes: { slim: boolean; regular?: boolean; athletic: boolean; heavy: boolean }
  }>>({});
  const [savingSizeGuides, setSavingSizeGuides] = useState(false);

  // Settings Form State
  const [settingsShopName, setSettingsShopName] = useState(currentUser?.shop_name || '');
  const [settingsShopSlug, setSettingsShopSlug] = useState(currentUser?.shop_slug || '');
  const [savingSettings, setSavingSettings] = useState(false);

  // Dynamic categories list
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Category management state
  const [newCatName, setNewCatName] = useState('');
  const [newCatSystemType, setNewCatSystemType] = useState<number>(1);
  const [newCatClothingTypeSlug, setNewCatClothingTypeSlug] = useState<ClothingTypeSlug>('tops');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) {
      setError(isRtl ? "نام دسته‌بندی الزامی است." : "Category name is required.");
      return;
    }
    setCreatingCategory(true);
    setError('');
    setSuccess('');
    try {
      const created = await storageManager.saveCategory(newCatName.trim(), Number(newCatSystemType), newCatClothingTypeSlug);
      setSuccess(isRtl ? "دسته‌بندی جدید با موفقیت اضافه شد." : "New category added successfully.");
      setNewCatName('');
      setShowAddCategoryModal(false);
      const cats = await storageManager.getCategories();
      setCategoriesList(cats);
      setProdFormCategory(created.name);
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: any) {
      setError(err?.message || "Error creating category.");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(isRtl ? `آیا از حذف دسته‌بندی "${name}" اطمینان دارید؟` : `Are you sure you want to delete category "${name}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await storageManager.deleteCategory(id);
      setSuccess(isRtl ? "دسته‌بندی با موفقیت حذف شد." : "Category deleted successfully.");
      const cats = await storageManager.getCategories();
      setCategoriesList(cats);
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: any) {
      setError(err?.message || "Error deleting category.");
    }
  };

  // Products listing UX states
  const [productSearch, setProductSearch] = useState('');
  const [productView, setProductView] = useState<'grid' | 'list'>('list');

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
      const [prodsList, colorsList, sizesList, allInv, templates, catsList] = await Promise.all([
        storageManager.getProducts(),
        storageManager.getColors(),
        storageManager.getSizes(),
        storageManager.getInventory(),
        storageManager.getSizeGuideTemplates(),
        storageManager.getCategories()
      ]);
      setProducts(prodsList);
      setColors(colorsList);
      setSizes(sizesList.sort((a, b) => a.sort_order - b.sort_order));
      setWarehouseInventory(allInv);
      setTemplatesList(templates);
      setCategoriesList(catsList);
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

  const isMyCustomSize = (s: Size) => {
    if (!currentUser) return false;
    if (!s.user_created) return false;
    if (typeof s.user_created === 'string') {
      return s.user_created === currentUser.id;
    }
    if (typeof s.user_created === 'object') {
      return (s.user_created as any).id === currentUser.id;
    }
    return false;
  };

  const isSystemSize = (s: Size) => {
    return !s.user_created;
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
      const defaults = getDefaultMeasurementsForSize(sz.name);
      formState[sz.id] = {
        enabled: false,
        min_height: defaults.min_height,
        max_height: defaults.max_height,
        min_weight: defaults.min_weight,
        max_weight: defaults.max_weight,
        min_chest: defaults.min_chest,
        max_chest: defaults.max_chest,
        min_waist: defaults.min_waist,
        max_waist: defaults.max_waist,
        min_hip: defaults.min_hip,
        max_hip: defaults.max_hip,
        min_shoulder: defaults.min_shoulder,
        max_shoulder: defaults.max_shoulder,
        min_sleeve: defaults.min_sleeve,
        max_sleeve: defaults.max_sleeve,
        min_length: defaults.min_length,
        max_length: defaults.max_length,
        shapes: { slim: true, athletic: true, heavy: false }
      };
    });
    setSizeGuidesFormState(formState);
    setProdFormTemplateOption('custom');
    setProdFormTemplateId(null);
    setNewTemplateName('');
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
      const inv = await storageManager.getInventory(prod.id);
      
      const activeColors = Array.from(new Set(inv.map(i => i.color_id)));
      const activeSizes = Array.from(new Set(inv.map(i => i.size_id)));

      // If no inventory exists, default to empty or first 3
      setSelectedColorIds(activeColors.length > 0 ? activeColors : colors.slice(0, 3).map(c => c.id));
      setSelectedSizeIds(activeSizes.length > 0 ? activeSizes : sizes.slice(0, 3).map(s => s.id));

      // Build grid state from inventory
      const gridState: Record<string, { stock: number; price: number; sku?: string; enabled: boolean }> = {};
      colors.forEach(col => {
        sizes.forEach(sz => {
          const key = `${col.id}-${sz.id}`;
          const matched = inv.find(i => i.color_id === col.id && i.size_id === sz.id);
          gridState[key] = {
            stock: matched ? matched.stock : 0,
            price: matched ? matched.price : prod.base_price,
            sku: matched ? (matched.sku || '') : '',
            enabled: !!matched
          };
        });
      });
      setMatrixGridState(gridState);

      // Fetch Sizing guides
      let guides: any[] = [];
      try {
        guides = await DirectusAPI.getSizeGuidesForProduct(prod.id);
      } catch (err) {
        guides = [];
      }
      setSizeGuidesList(guides);

      const formState: Record<string, any> = {};
      sizes.forEach(sz => {
        const matchedGuide = guides.find(g => g.size_id === sz.id);
        const defaults = getDefaultMeasurementsForSize(sz.name);
        let measurements = {
          min_height: defaults.min_height,
          max_height: defaults.max_height,
          min_weight: defaults.min_weight,
          max_weight: defaults.max_weight,
          min_chest: defaults.min_chest,
          max_chest: defaults.max_chest,
          min_waist: defaults.min_waist,
          max_waist: defaults.max_waist,
          min_hip: defaults.min_hip,
          max_hip: defaults.max_hip,
          min_shoulder: defaults.min_shoulder,
          max_shoulder: defaults.max_shoulder,
          min_sleeve: defaults.min_sleeve,
          max_sleeve: defaults.max_sleeve,
          min_length: defaults.min_length,
          max_length: defaults.max_length,
          shapes: { slim: true, athletic: true, heavy: false }
        };

        if (matchedGuide) {
          const rawMeas = typeof matchedGuide.measurements === 'string'
            ? JSON.parse(matchedGuide.measurements)
            : matchedGuide.measurements;

          measurements = {
            min_height: Number(rawMeas?.min_height ?? defaults.min_height),
            max_height: Number(rawMeas?.max_height ?? defaults.max_height),
            min_weight: Number(rawMeas?.min_weight ?? defaults.min_weight),
            max_weight: Number(rawMeas?.max_weight ?? defaults.max_weight),
            min_chest: rawMeas?.min_chest !== undefined ? Number(rawMeas.min_chest) : defaults.min_chest,
            max_chest: rawMeas?.max_chest !== undefined ? Number(rawMeas.max_chest) : defaults.max_chest,
            min_waist: rawMeas?.min_waist !== undefined ? Number(rawMeas.min_waist) : defaults.min_waist,
            max_waist: rawMeas?.max_waist !== undefined ? Number(rawMeas.max_waist) : defaults.max_waist,
            min_hip: rawMeas?.min_hip !== undefined ? Number(rawMeas.min_hip) : defaults.min_hip,
            max_hip: rawMeas?.max_hip !== undefined ? Number(rawMeas.max_hip) : defaults.max_hip,
            min_shoulder: rawMeas?.min_shoulder !== undefined ? Number(rawMeas.min_shoulder) : defaults.min_shoulder,
            max_shoulder: rawMeas?.max_shoulder !== undefined ? Number(rawMeas.max_shoulder) : defaults.max_shoulder,
            min_sleeve: rawMeas?.min_sleeve !== undefined ? Number(rawMeas.min_sleeve) : defaults.min_sleeve,
            max_sleeve: rawMeas?.max_sleeve !== undefined ? Number(rawMeas.max_sleeve) : defaults.max_sleeve,
            min_length: rawMeas?.min_length !== undefined ? Number(rawMeas.min_length) : defaults.min_length,
            max_length: rawMeas?.max_length !== undefined ? Number(rawMeas.max_length) : defaults.max_length,
            shapes: {
              slim: rawMeas?.shapes?.slim !== undefined ? !!rawMeas.shapes.slim : true,
              athletic: rawMeas?.shapes?.athletic !== undefined ? !!rawMeas.shapes.athletic : true,
              heavy: rawMeas?.shapes?.heavy !== undefined ? !!rawMeas.shapes.heavy : false,
            }
          };
        }

        formState[sz.id] = {
          enabled: !!matchedGuide,
          min_height: measurements.min_height,
          max_height: measurements.max_height,
          min_weight: measurements.min_weight,
          max_weight: measurements.max_weight,
          min_chest: measurements.min_chest,
          max_chest: measurements.max_chest,
          min_waist: measurements.min_waist,
          max_waist: measurements.max_waist,
          min_hip: measurements.min_hip,
          max_hip: measurements.max_hip,
          min_shoulder: measurements.min_shoulder,
          max_shoulder: measurements.max_shoulder,
          min_sleeve: measurements.min_sleeve,
          max_sleeve: measurements.max_sleeve,
          min_length: measurements.min_length,
          max_length: measurements.max_length,
          shapes: measurements.shapes
        };
      });
      setSizeGuidesFormState(formState);

      if (prod.size_guide_template_id) {
        setProdFormTemplateOption('template');
        setProdFormTemplateId(prod.size_guide_template_id);
      } else {
        setProdFormTemplateOption('custom');
        setProdFormTemplateId(null);
      }
      setNewTemplateName('');

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

    const matchedCat = categoriesList.find(c => 
      c.name === prodFormCategory || 
      c.name_fa === prodFormCategory || 
      c.slug === prodFormCategory || 
      String(c.id) === String(prodFormCategory)
    );

    const payload = {
      name_fa: prodFormNameFa,
      name_en: prodFormNameEn,
      description_fa: prodFormDescFa,
      description_en: prodFormDescEn,
      base_price: Number(prodFormBasePrice),
      category: matchedCat ? matchedCat.name : prodFormCategory,
      category_id: matchedCat ? matchedCat.id : undefined,
      image: prodFormImage,
      size_guide_template_id: prodFormTemplateId && prodFormTemplateId !== 'custom' ? Number(prodFormTemplateId) : null
    };

    try {
      let savedProduct: Product;
      if (isEditingProd.id === 0) {
        // Add new
        savedProduct = await storageManager.saveProduct(payload);
        setSuccess(isRtl ? "محصول با موفقیت ثبت شد. متغیرهای انبار اکنون خودکار ساخته شدند." : "Product registered. Stock variants created automatically.");
      } else {
        // Edit existing
        savedProduct = await storageManager.saveProduct({ id: isEditingProd.id, ...payload });
        setSuccess(isRtl ? "اطلاعات کلی محصول با موفقیت به‌روزرسانی شد." : "Product profile updated successfully.");
      }

      // Automatically sync inventory combinations (N x M)
      // Retrieve current database inventory to check what already exists
      const existingInventory = await storageManager.getInventory(savedProduct.id);
      const targetCombinations: InventoryItem[] = [];

      selectedColorIds.forEach(colId => {
        selectedSizeIds.forEach(szId => {
          const matched = existingInventory.find(i => i.color_id === colId && i.size_id === szId);
          targetCombinations.push({
            id: matched ? matched.id : 0,
            product_id: savedProduct.id,
            color_id: colId,
            size_id: szId,
            stock: matched ? matched.stock : 0, // Preserve stock level if it exists, default to 0
            price: matched ? matched.price : Number(prodFormBasePrice) // Preserve price override, default to product base
          });
        });
      });

      // Synchronize database records
      await storageManager.updateInventory(targetCombinations);

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
      await storageManager.deleteProduct(id);
      await loadDashboardData();
      setSuccess(isRtl ? "محصول با موفقیت حذف شد." : "Product deleted successfully.");
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(isRtl ? "حذف با خطا مواجه شد." : "Deletion failed.");
    }
  };

  // --- PRODUCT IMPORT / EXPORT HANDLERS ---
  const productImportFileInputRef = useRef<HTMLInputElement>(null);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);

  const handleExportJSON = () => {
    if (products.length === 0) {
      setError(isRtl ? "محصولی در کاتالوگ برای خروجی گرفتن وجود ندارد." : "No products available to export.");
      return;
    }
    const exportData = products.map(p => ({
      name_fa: p.name_fa || '',
      name_en: p.name_en || '',
      category: p.category || 'Clothing',
      base_price: p.base_price || 0,
      description_fa: p.description_fa || '',
      description_en: p.description_en || '',
      image: p.image || ''
    }));

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tankhor_products_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setSuccess(isRtl ? `فایل JSON محصولات با موفقیت دریافت شد (${products.length} کالا).` : `Exported JSON (${products.length} products).`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      setError(isRtl ? "محصولی در کاتالوگ برای خروجی گرفتن وجود ندارد." : "No products available to export.");
      return;
    }
    const headers = ['name_fa', 'name_en', 'category', 'base_price', 'description_fa', 'description_en', 'image'];
    const csvRows = [headers.join(',')];

    products.forEach(p => {
      const row = [
        `"${(p.name_fa || '').replace(/"/g, '""')}"`,
        `"${(p.name_en || '').replace(/"/g, '""')}"`,
        `"${(p.category || 'Clothing').replace(/"/g, '""')}"`,
        p.base_price || 0,
        `"${(p.description_fa || '').replace(/"/g, '""')}"`,
        `"${(p.description_en || '').replace(/"/g, '""')}"`,
        `"${(p.image || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tankhor_products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setSuccess(isRtl ? `فایل CSV محصولات با موفقیت دریافت شد (${products.length} کالا).` : `Exported CSV (${products.length} products).`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleDownloadSampleTemplate = (type: 'json' | 'csv') => {
    const sampleData = [
      {
        name_fa: "پیراهن مردانه کتان کلاسیک",
        name_en: "Men Classic Cotton Shirt",
        category: "Clothing",
        base_price: 680000,
        description_fa: "پیراهن ۱۰۰٪ کتان خنک و سبک مناسب فصل",
        description_en: "100% Cotton breathable casual shirt",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80"
      },
      {
        name_fa: "شلوار جین اسلیم فیت دودی",
        name_en: "Slim Fit Charcoal Jeans",
        category: "Pants",
        base_price: 850000,
        description_fa: "شلوار جین با پارچه کشسان درجه یک",
        description_en: "Stretch denim slim fit trousers",
        image: "https://images.unsplash.com/photo-1542272604-780c36856842?auto=format&fit=crop&w=600&q=80"
      }
    ];

    if (type === 'json') {
      const jsonStr = JSON.stringify(sampleData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tankhor_products_sample.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['name_fa', 'name_en', 'category', 'base_price', 'description_fa', 'description_en', 'image'];
      const rows = [headers.join(',')];
      sampleData.forEach(p => {
        rows.push([
          `"${p.name_fa}"`,
          `"${p.name_en}"`,
          `"${p.category}"`,
          p.base_price,
          `"${p.description_fa}"`,
          `"${p.description_en}"`,
          `"${p.image}"`
        ].join(','));
      });
      const csvContent = '\uFEFF' + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tankhor_products_sample.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setImportingProducts(true);
    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      let importedList: any[] = [];

      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text);
        importedList = Array.isArray(parsed) ? parsed : [parsed];
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
            const matches: string[] = [];
            let match;
            while ((match = regex.exec(lines[i])) !== null) {
              if (match[1] !== undefined) matches.push(match[1]);
              else if (match[2] !== undefined) matches.push(match[2]);
            }
            if (matches.length > 0) {
              const item: any = {};
              headers.forEach((h, idx) => {
                item[h] = matches[idx] || '';
              });
              importedList.push(item);
            }
          }
        }
      } else {
        throw new Error(isRtl ? "فرمت فایل نامعتبر است. لطفاً فایل JSON یا CSV انتخاب کنید." : "Invalid file format. Please upload JSON or CSV.");
      }

      if (importedList.length === 0) {
        throw new Error(isRtl ? "هیچ محتوای معتبری در فایل پیدا نشد." : "No valid product rows found in file.");
      }

      let successCount = 0;
      for (const item of importedList) {
        const nameFa = (item.name_fa || item.name_en || item.title || item.name || '').trim();
        if (!nameFa) continue;
        const basePrice = Math.max(0, parseInt(item.base_price || item.price || 500000) || 500000);

        await storageManager.saveProduct({
          name_fa: nameFa,
          name_en: (item.name_en || nameFa).trim(),
          category: (item.category || 'Clothing').trim(),
          base_price: basePrice,
          description_fa: (item.description_fa || '').trim(),
          description_en: (item.description_en || '').trim(),
          image: (item.image || '').trim()
        });
        successCount++;
      }

      await loadDashboardData();
      setShowImportExportModal(false);
      setSuccess(isRtl ? `تعداد ${successCount} محصول جدید با موفقیت به کاتالوگ اضافه شد.` : `Successfully imported ${successCount} products.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || (isRtl ? "خطا در پردازش و ورود فایل محصولات." : "Failed to import products file."));
    } finally {
      setImportingProducts(false);
      if (productImportFileInputRef.current) {
        productImportFileInputRef.current.value = '';
      }
    }
  };

  // --- MATRIX COMPONENT MANAGEMENT ---
  const handleCellChange = (colorId: number, sizeId: number, field: 'stock' | 'price' | 'sku' | 'enabled', value: any) => {
    const key = `${colorId}-${sizeId}`;
    setMatrixGridState(prev => {
      const updated = { ...prev[key] };
      if (field === 'stock') updated.stock = Math.max(0, parseInt(value) || 0);
      else if (field === 'price') updated.price = Math.max(0, parseInt(value) || 0);
      else if (field === 'sku') updated.sku = String(value || '');
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
    const updatedPayload: InventoryItem[] = [];
    
    selectedColorIds.forEach(colId => {
      selectedSizeIds.forEach(szId => {
        const key = `${colId}-${szId}`;
        const cell = matrixGridState[key];
        if (cell && cell.enabled) {
          updatedPayload.push({
            id: 0,
            product_id: isEditingProd.id,
            color_id: colId,
            size_id: szId,
            stock: cell.stock,
            price: cell.price,
            sku: cell.sku || ''
          });
        }
      });
    });

    try {
      await storageManager.updateInventory(updatedPayload);
      setSuccess(isRtl ? "ماتریس موجودی محصول با موفقیت ذخیره شد." : "Product inventory matrix synced successfully.");
      setTimeout(() => setSuccess(''), 3000);
      
      // Reload states
      await loadDashboardData();
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
      if (prodFormTemplateOption === 'template') {
        if (!prodFormTemplateId) {
          throw new Error(isRtl ? "لطفاً ابتدا قالب مورد نظر را انتخاب کنید." : "Please choose a template first.");
        }
        // Save template ID on product
        await storageManager.saveProduct({
          ...isEditingProd,
          size_guide_template_id: Number(prodFormTemplateId)
        });
        
        // Delete product specific size guides to avoid duplicate results
        for (const szId of selectedSizeIds) {
          const existingGuide = sizeGuidesList.find(g => g.size_id === szId);
          if (existingGuide) {
            await DirectusAPI.deleteSizeGuide(existingGuide.id).catch(() => {});
          }
        }
        
        setSuccess(isRtl ? "قالب سایزبندی با موفقیت به این کالا تخصیص یافت." : "Sizing template assigned successfully.");
      } 
      else if (prodFormTemplateOption === 'new_template') {
        if (!newTemplateName.trim()) {
          throw new Error(isRtl ? "لطفاً نام قالب را وارد کنید." : "Template name is required.");
        }
        
        // Assemble measurements
        const clothingType = getClothingTypeFromCategory(prodFormCategory, categoriesList);
        const measurements: SizeGuideTemplateItem[] = [];
        sizes.forEach(sz => {
          const cell = sizeGuidesFormState[sz.id];
          if (cell && cell.enabled) {
            measurements.push({
              size_id: sz.id,
              min_height: Number(cell.min_height),
              max_height: Number(cell.max_height),
              min_weight: Number(cell.min_weight),
              max_weight: Number(cell.max_weight),
              min_chest: cell.min_chest !== undefined ? Number(cell.min_chest) : undefined,
              max_chest: cell.max_chest !== undefined ? Number(cell.max_chest) : undefined,
              min_waist: cell.min_waist !== undefined ? Number(cell.min_waist) : undefined,
              max_waist: cell.max_waist !== undefined ? Number(cell.max_waist) : undefined,
              min_hip: cell.min_hip !== undefined ? Number(cell.min_hip) : undefined,
              max_hip: cell.max_hip !== undefined ? Number(cell.max_hip) : undefined,
              min_shoulder: cell.min_shoulder !== undefined ? Number(cell.min_shoulder) : undefined,
              max_shoulder: cell.max_shoulder !== undefined ? Number(cell.max_shoulder) : undefined,
              min_sleeve: cell.min_sleeve !== undefined ? Number(cell.min_sleeve) : undefined,
              max_sleeve: cell.max_sleeve !== undefined ? Number(cell.max_sleeve) : undefined,
              min_length: cell.min_length !== undefined ? Number(cell.min_length) : undefined,
              max_length: cell.max_length !== undefined ? Number(cell.max_length) : undefined,
              min_foot_length: cell.min_foot_length !== undefined ? Number(cell.min_foot_length) : undefined,
              max_foot_length: cell.max_foot_length !== undefined ? Number(cell.max_foot_length) : undefined,
              shapes: cell.shapes
            });
          }
        });

        if (measurements.length === 0) {
          throw new Error(isRtl ? "لطفاً حداقل برای یک سایز، راهنمای ابعادی را تکمیل کنید." : "At least one sizing rule must be configured.");
        }

        // Create new template
        const newTpl = await storageManager.saveSizeGuideTemplate({ name: newTemplateName, measurements, clothing_type_slug: clothingType });
        
        // Save template ID on product
        await storageManager.saveProduct({
          ...isEditingProd,
          size_guide_template_id: newTpl.id
        });

        // Delete any local guides to avoid duplicate results
        for (const szId of selectedSizeIds) {
          const existingGuide = sizeGuidesList.find(g => g.size_id === szId);
          if (existingGuide) {
            await DirectusAPI.deleteSizeGuide(existingGuide.id).catch(() => {});
          }
        }

        // Reload templates list
        const tpls = await storageManager.getSizeGuideTemplates();
        setTemplatesList(tpls);

        setSuccess(isRtl ? "قالب سایزبندی جدید ساخته و با موفقیت به کالا تخصیص یافت." : "New sizing template registered and assigned successfully.");
      }
      else {
        // 'custom' overrides
        // 1. Remove size template mapping from product
        await storageManager.saveProduct({
          ...isEditingProd,
          size_guide_template_id: undefined as any
        });

        // 2. Save custom rows in size_guides collection
        for (const szId of selectedSizeIds) {
          const formCell = sizeGuidesFormState[szId];
          const existingGuide = sizeGuidesList.find(g => g.size_id === szId);

          if (formCell && formCell.enabled) {
            const measurements = {
              min_height: Number(formCell.min_height),
              max_height: Number(formCell.max_height),
              min_weight: Number(formCell.min_weight),
              max_weight: Number(formCell.max_weight),
              min_chest: formCell.min_chest !== undefined ? Number(formCell.min_chest) : undefined,
              max_chest: formCell.max_chest !== undefined ? Number(formCell.max_chest) : undefined,
              min_waist: formCell.min_waist !== undefined ? Number(formCell.min_waist) : undefined,
              max_waist: formCell.max_waist !== undefined ? Number(formCell.max_waist) : undefined,
              min_hip: formCell.min_hip !== undefined ? Number(formCell.min_hip) : undefined,
              max_hip: formCell.max_hip !== undefined ? Number(formCell.max_hip) : undefined,
              min_shoulder: formCell.min_shoulder !== undefined ? Number(formCell.min_shoulder) : undefined,
              max_shoulder: formCell.max_shoulder !== undefined ? Number(formCell.max_shoulder) : undefined,
              min_sleeve: formCell.min_sleeve !== undefined ? Number(formCell.min_sleeve) : undefined,
              max_sleeve: formCell.max_sleeve !== undefined ? Number(formCell.max_sleeve) : undefined,
              min_length: formCell.min_length !== undefined ? Number(formCell.min_length) : undefined,
              max_length: formCell.max_length !== undefined ? Number(formCell.max_length) : undefined,
              min_foot_length: formCell.min_foot_length !== undefined ? Number(formCell.min_foot_length) : undefined,
              max_foot_length: formCell.max_foot_length !== undefined ? Number(formCell.max_foot_length) : undefined,
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

        setSuccess(isRtl ? "راهنمای ابعادی اختصاصی با موفقیت ثبت شد." : "Custom sizing guides synced successfully.");
      }

      setTimeout(() => setSuccess(''), 3000);
      await triggerEditProductMode(isEditingProd);
    } catch (e: any) {
      console.error(e);
      setError(e.message || (isRtl ? "خطا در ذخیره‌سازی جزئیات راهنمای سایز." : "Failed to sync size guide tables."));
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
    const targetSku = localSkuEdits[invItem.id] !== undefined ? localSkuEdits[invItem.id] : (invItem.sku || '');

    try {
      await storageManager.updateInventory([{
        ...invItem,
        stock: Number(targetStock),
        price: Number(targetPrice),
        sku: targetSku
      }]);
      setSuccess(isRtl ? "موجودی با موفقیت به‌روزرسانی شد." : "Stock item updated successfully.");
      setTimeout(() => setSuccess(''), 3000);

      // Refresh database records
      const allInv = await storageManager.getInventory();
      setWarehouseInventory(allInv);
    } catch (e) {
      setError(isRtl ? "خطا در ذخیره‌سازی اطلاعات تغییر یافته." : "Failed to update item values.");
    } finally {
      setUpdatingWarehouseId(null);
    }
  };

  const handleWarehouseLocalChange = (itemId: number, field: 'stock' | 'price' | 'sku', value: string) => {
    setWarehouseLocalChange(itemId, field, value);
  };

  // --- WAREHOUSE EXPORT FUNCTIONS ---
  const handleExportWarehouseCSV = () => {
    if (warehouseInventory.length === 0) {
      setError(isRtl ? "هیچ داده‌ای در انبار برای خروجی گرفتن وجود ندارد." : "No inventory data to export.");
      return;
    }

    const headers = [
      "کد متغیر (Inventory ID)",
      "کد کالا (Product ID)",
      "شناسه کالا (SKU)",
      "نام کالا (فارسی)",
      "نام کالا (انگلیسی)",
      "دسته‌بندی",
      "رنگ",
      "کد رنگ (Hex)",
      "سایز",
      "موجودی انبار (Stock)",
      "قیمت متغیر (تومان)"
    ];

    const rows = warehouseInventory.map(item => {
      const p = products.find(prod => prod.id === item.product_id);
      const c = colors.find(col => col.id === item.color_id);
      const s = sizes.find(sz => sz.id === item.size_id);
      return [
        item.id,
        item.product_id,
        `"${(item.sku || '').replace(/"/g, '""')}"`,
        `"${(p?.name_fa || '').replace(/"/g, '""')}"`,
        `"${(p?.name_en || '').replace(/"/g, '""')}"`,
        `"${(p?.category || '').replace(/"/g, '""')}"`,
        `"${(c?.name_fa || '').replace(/"/g, '""')}"`,
        `"${(c?.hex_code || '').replace(/"/g, '""')}"`,
        `"${(s?.name || '').replace(/"/g, '""')}"`,
        item.stock,
        item.price
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tankhor_warehouse_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess(isRtl ? "گزارش موجودی انبار با فرمت CSV دانلود شد." : "Warehouse inventory exported as CSV.");
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleExportWarehouseJSON = () => {
    if (warehouseInventory.length === 0) {
      setError(isRtl ? "هیچ داده‌ای در انبار برای خروجی گرفتن وجود ندارد." : "No inventory data to export.");
      return;
    }

    const exportData = warehouseInventory.map(item => {
      const p = products.find(prod => prod.id === item.product_id);
      const c = colors.find(col => col.id === item.color_id);
      const s = sizes.find(sz => sz.id === item.size_id);
      return {
        id: item.id,
        product_id: item.product_id,
        sku: item.sku || '',
        product_name_fa: p?.name_fa || '',
        product_name_en: p?.name_en || '',
        category: p?.category || '',
        color_id: item.color_id,
        color_name_fa: c?.name_fa || '',
        color_hex: c?.hex_code || '',
        size_id: item.size_id,
        size_name: s?.name || '',
        stock: item.stock,
        price: item.price
      };
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tankhor_warehouse_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess(isRtl ? "فایل JSON موجودی انبار دانلود شد." : "Warehouse inventory exported as JSON.");
    setTimeout(() => setSuccess(''), 3000);
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
      await storageManager.saveProduct({ ...product, image: finalURL });
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

  // --- SIZE CRUD FUNCTIONS ---
  const handleCreateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSizeName.trim()) {
      setError(isRtl ? "نام سایز الزامی است" : "Size name is required.");
      return;
    }
    setCreatingSize(true);
    setError('');
    setSuccess('');
    try {
      await storageManager.saveSize(newSizeName.trim(), Number(newSizeSortOrder));
      setSuccess(isRtl ? "سایز جدید با موفقیت اضافه شد." : "New custom size added successfully.");
      setNewSizeName('');
      setNewSizeSortOrder(prev => prev + 2);
      // Reload sizes list
      const sizesList = await storageManager.getSizes();
      setSizes(sizesList.sort((a, b) => a.sort_order - b.sort_order));
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: any) {
      setError(err?.message || "Error creating size.");
    } finally {
      setCreatingSize(false);
    }
  };

  const handleDeleteSize = async (id: number, name: string) => {
    if (!confirm(isRtl ? `آیا از حذف سایز "${name}" اطمینان دارید؟` : `Are you sure you want to delete size "${name}"?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await storageManager.deleteSize(id);
      setSuccess(isRtl ? "سایز با موفقیت حذف شد." : "Custom size deleted successfully.");
      // Reload sizes list
      const sizesList = await storageManager.getSizes();
      setSizes(sizesList.sort((a, b) => a.sort_order - b.sort_order));
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: any) {
      setError(err?.message || "Error deleting size.");
    }
  };

  // Filter products owned by user
  const userProducts = products.filter(p => p.created_by === currentUser?.id);
  const activeProductsCount = userProducts.length;

  // Filter warehouse records matching the search query
  const filteredWarehouseItems = warehouseInventory.filter(item => {
    const matchedProd = products.find(p => p.id === item.product_id);
    if (!matchedProd) return false;

    // Search matches product names, category, or SKU
    const searchString = warehouseSearch.trim().toLowerCase();
    if (!searchString) return true;

    return (
      matchedProd.name_fa.toLowerCase().includes(searchString) ||
      matchedProd.name_en.toLowerCase().includes(searchString) ||
      matchedProd.category?.toLowerCase().includes(searchString) ||
      (item.sku && item.sku.toLowerCase().includes(searchString))
    );
  });

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'} transition-colors duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* SIDEBAR NAVIGATION - Desktop (Clean SaaS Style) */}
      <aside className={`w-64 border-r shrink-0 hidden md:flex flex-col justify-between ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
        <div>
          {/* Brand header */}
          <div className={`p-4 border-b flex items-center gap-3 ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <img 
              src={darkMode ? "/logo-light.png" : "/logo-dark.png"} 
              alt="Tankhor" 
              className="h-9 w-auto object-contain shrink-0" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="font-black text-sm tracking-tight text-sky-500">
                {isRtl ? "مدیریت تن‌خور" : "Tankhor Admin"}
              </h1>
              <p className="text-[10px] text-neutral-500 font-bold">{t.store_settings}</p>
            </div>
          </div>

          {/* User & Store Badge */}
          <div className={`p-3.5 mx-3 my-3 border rounded-xl flex items-center gap-3 ${darkMode ? 'bg-neutral-800/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 font-extrabold flex items-center justify-center border border-sky-500/20 shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className={`text-xs font-black truncate ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>{currentUser?.shop_name || 'My Shop'}</p>
              <p className="text-[10px] text-neutral-400 truncate text-left font-semibold">@{currentUser?.shop_slug || 'slug'}</p>
            </div>
          </div>

          {/* Storage & Hybrid Sync Status Card */}
          <div className={`mx-3 mb-4 p-3 rounded-xl border text-xs space-y-2 ${darkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-sky-50/50 border-sky-100'}`}>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-500" />
                <span>{isRtl ? "دیتابیس:" : "Database:"}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                syncStats.mode === 'cloud_synced' 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                {syncStats.mode === 'cloud_synced' ? (isRtl ? 'همگام ابری' : 'Cloud Synced') : (isRtl ? 'آفلاین محلی' : 'Local Offline')}
              </span>
            </div>

            {syncStats.pendingCount > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-neutral-800/20 text-[10px]">
                <span className="text-amber-500 font-bold">{isRtl ? `${syncStats.pendingCount} تغییر معوق` : `${syncStats.pendingCount} pending`}</span>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncingCloud}
                  className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold transition-all cursor-pointer"
                >
                  {syncingCloud ? '...' : (isRtl ? 'ارسال' : 'Push')}
                </button>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="px-3 space-y-1">
            <button
              onClick={() => { setActiveTab('products'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'products' ? 'bg-sky-600 text-white shadow-sm' : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}`}
            >
              <Package className="w-4 h-4" />
              <span>{isRtl ? "مدیریت کالاها" : "Products Manager"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'orders' ? 'bg-sky-600 text-white shadow-sm' : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isRtl ? "مدیریت سفارشات" : "Orders & POS"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('warehouse'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'warehouse' ? 'bg-sky-600 text-white shadow-sm' : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}`}
            >
              <Warehouse className="w-4 h-4" />
              <span>{isRtl ? "مدیریت انبار" : "Warehouse Stock"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('barcodes'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'barcodes' ? 'bg-sky-600 text-white shadow-sm' : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}`}
            >
              <BarcodeIcon className="w-4 h-4" />
              <span>{isRtl ? "چاپ بارکد" : "Barcode Labels"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('categories'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'categories' ? 'bg-sky-600 text-white shadow-sm' : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}`}
            >
              <Layers className="w-4 h-4" />
              <span>{isRtl ? "دسته‌بندی کالا" : "Category Manager"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('templates'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'templates' ? 'bg-sky-600 text-white shadow-sm' : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}`}
            >
              <Ruler className="w-4 h-4" />
              <span>{isRtl ? "قالب‌های سایز" : "Size Templates"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('sizes'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'sizes' ? 'bg-sky-600 text-white shadow-sm' : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}`}
            >
              <Sliders className="w-4 h-4" />
              <span>{isRtl ? "مدیریت سایزها" : "Size Management"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('compressor'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'compressor' ? 'bg-sky-600 text-white shadow-sm' : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}`}
            >
              <FileImage className="w-4 h-4" />
              <span>{isRtl ? "بهینه‌ساز تصویر" : "Image Compressor"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'settings' ? 'bg-sky-600 text-white shadow-sm' : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100')}`}
            >
              <Settings className="w-4 h-4" />
              <span>{isRtl ? "تنظیمات فروشگاه" : "Store Settings"}</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Action */}
        <div className={`p-4 border-t space-y-2 ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
          {currentUser?.shop_slug && (
            <a
              href={`/shop/${currentUser.shop_slug}/product/101`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 text-sky-500 text-[11px] font-bold rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5" />
                <span>{isRtl ? "دیدن ویترین عمومی" : "Public Showcase"}</span>
              </div>
              <ChevronLeft className="w-3 h-3" />
            </a>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isRtl ? "خروج حساب" : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOP STATUS BAR */}
        <DashboardHeader
          t={t}
          isRtl={isRtl}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          lang={lang}
          setLang={setLang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isEditingProd={isEditingProd}
          setIsEditingProd={setIsEditingProd}
          activeProductsCount={activeProductsCount}
          syncStats={syncStats}
          syncingCloud={syncingCloud}
          handleManualSync={handleManualSync}
        />

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
              {/* TAB: ORDERS & POS */}
              {activeTab === 'orders' && (
                <OrdersManager
                  t={(key: string) => t[key] || key}
                  lang={lang}
                  darkMode={darkMode}
                />
              )}

              {/* TAB 1: PRODUCTS MANAGER */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {isEditingProd === null ? (
                    // A. PRODUCT LISTING
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-black">{isRtl ? "کاتالوگ لباس‌های شما" : "Garments Catalog"}</h3>
                          <p className={`text-[11px] sm:text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{isRtl ? "محصولات خود را تعریف کرده و جدول سایز و تنوع رنگ آن را مشخص کنید." : "Add garments, and configure size/color variations grid."}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowImportExportModal(true)}
                            className={`px-3.5 py-2.5 text-xs font-bold rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${darkMode ? 'bg-neutral-800/80 border-neutral-700 hover:bg-neutral-700 text-neutral-200' : 'bg-white border-neutral-300 hover:bg-neutral-50 text-neutral-700 shadow-sm'}`}
                            title={isRtl ? "ورود و خروجی فایل محصولات (JSON / CSV)" : "Import & Export Products"}
                          >
                            <FolderUp className="w-4 h-4 text-emerald-500" />
                            <span>{isRtl ? "ایمپورت / اکسپورت" : "Import & Export"}</span>
                          </button>

                          <button
                            onClick={triggerAddProductMode}
                            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-sky-600/10 flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{t.add_product}</span>
                          </button>
                        </div>
                      </div>

                      {/* Search & View Toggle Controls */}
                      <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-xl border backdrop-blur-md ${darkMode ? 'bg-neutral-900/40 border-white/10' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <div className="relative w-full sm:max-w-md">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder={isRtl ? "جستجوی کالا بر اساس نام، شناسه یا دسته‌بندی..." : "Search by title, SKU, category..."}
                            className={`w-full pr-10 pl-4 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-500 font-sans' : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400 font-sans'}`}
                          />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className={`text-xs font-bold ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "حالت نمایش:" : "View Mode:"}</span>
                          <div className={`flex p-0.5 rounded-lg border ${darkMode ? 'bg-neutral-950 border-white/10' : 'bg-neutral-100 border-neutral-200'}`}>
                            <button
                              type="button"
                              onClick={() => setProductView('grid')}
                              className={`p-1.5 rounded-md transition-all cursor-pointer ${productView === 'grid' ? 'bg-sky-600 text-white' : (darkMode ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800')}`}
                              title={isRtl ? "نمایش شبکه‌ای" : "Grid View"}
                            >
                              <Grid className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductView('list')}
                              className={`p-1.5 rounded-md transition-all cursor-pointer ${productView === 'list' ? 'bg-sky-600 text-white' : (darkMode ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800')}`}
                              title={isRtl ? "نمایش جدولی" : "List/Table View"}
                            >
                              <List className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {products.length === 0 ? (
                        <div className={`text-center py-20 border border-dashed rounded-2xl ${darkMode ? 'border-neutral-800 bg-neutral-900/10' : 'border-neutral-200 bg-white'}`}>
                          <Package className="w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50" />
                          <p className={`text-sm font-bold ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "هیچ محصولی ثبت نشده است." : "No products available."}</p>
                        </div>
                      ) : (
                        <>
                          {productView === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                              {products
                                .filter(prod => {
                                  const title = (isRtl ? prod.name_fa : prod.name_en) || '';
                                  const desc = (isRtl ? prod.description_fa : prod.description_en) || '';
                                  const cat = prod.category || '';
                                  const sku = `SG-PROD-${prod.id}`;
                                  const searchLower = productSearch.toLowerCase();
                                  return title.toLowerCase().includes(searchLower) ||
                                         desc.toLowerCase().includes(searchLower) ||
                                         cat.toLowerCase().includes(searchLower) ||
                                         sku.toLowerCase().includes(searchLower);
                                })
                                .map(prod => (
                                  <div key={prod.id} className={`rounded-xl border overflow-hidden flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${darkMode ? 'bg-neutral-900/40 border-white/10' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <div>
                                      <div className={`h-36 sm:h-40 relative ${darkMode ? 'bg-neutral-950/20' : 'bg-neutral-100'}`}>
                                        {prod.image ? (
                                          <img src={prod.image} alt={prod.name_fa} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex flex-col justify-center items-center text-neutral-400">
                                            <Image className="w-8 h-8 opacity-40 mb-1" />
                                            <span className="text-[10px]">{isRtl ? "فاقد تصویر کالا" : "No Image"}</span>
                                          </div>
                                        )}
                                        <span className="absolute top-2.5 right-2.5 max-w-[75%] px-2 py-0.5 bg-sky-600/90 backdrop-blur-sm text-white rounded-md font-bold text-[10px] shadow-sm truncate whitespace-nowrap">
                                          {prod.category}
                                        </span>
                                      </div>

                                      <div className="p-3.5 space-y-1.5">
                                        <h4 className={`font-extrabold text-xs sm:text-sm truncate ${darkMode ? 'text-white' : 'text-neutral-900'}`}>{isRtl ? prod.name_fa : prod.name_en}</h4>
                                        <p className={`text-[10px] line-clamp-1 leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                          {isRtl ? prod.description_fa : prod.description_en}
                                        </p>
                                        <p className="text-xs font-black text-sky-400 pt-0.5 whitespace-nowrap">
                                          {isRtl ? `${prod.base_price.toLocaleString('fa-IR')} تومان` : `$${(prod.base_price / 50000).toFixed(1)} USD`}
                                        </p>
                                      </div>
                                    </div>

                                    <div className={`p-3 border-t grid grid-cols-2 gap-2 ${darkMode ? 'border-neutral-800/40' : 'border-neutral-100 bg-neutral-50/50'}`}>
                                      <button
                                        onClick={() => triggerEditProductMode(prod)}
                                        className="col-span-2 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap truncate"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{isRtl ? "ویرایش و تنظیمات کالا" : "Edit & Configure Product"}</span>
                                      </button>

                                      <a
                                        href={`/shop/${currentUser?.shop_slug || 'shop'}/product/${prod.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="col-span-2 py-1 px-2 border border-dashed border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition-all whitespace-nowrap truncate"
                                      >
                                        <Compass className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{isRtl ? "پیش‌نمایش فروشگاه خریدار" : "Public Shop Preview"}</span>
                                      </a>

                                      {prod.created_by !== 'system' && (
                                        <button
                                          onClick={() => handleDeleteProduct(prod.id)}
                                          className="col-span-2 py-1 px-2 hover:bg-red-500/10 text-red-400 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap truncate"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                          <span className="truncate">{t.delete}</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-white/10 bg-neutral-900/40 backdrop-blur-md' : 'border-neutral-200 bg-white shadow-sm'}`}>
                              <table className="w-full text-right text-xs">
                                <thead className={`font-black border-b ${darkMode ? 'bg-neutral-950/60 text-neutral-400 border-white/10' : 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
                                  <tr>
                                    <th className="p-4 text-center w-16">{isRtl ? "تصویر" : "Image"}</th>
                                    <th className="p-4">{isRtl ? "نام کالا / جزئیات" : "Product Details"}</th>
                                    <th className="p-4">{isRtl ? "شناسه کالا" : "SKU"}</th>
                                    <th className="p-4">{isRtl ? "دسته‌بندی" : "Category"}</th>
                                    <th className="p-4">{isRtl ? "قیمت پایه" : "Base Price"}</th>
                                    <th className="p-4 text-center w-40">{isRtl ? "عملیات" : "Actions"}</th>
                                  </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-neutral-100'}`}>
                                  {products
                                    .filter(prod => {
                                      const title = (isRtl ? prod.name_fa : prod.name_en) || '';
                                      const desc = (isRtl ? prod.description_fa : prod.description_en) || '';
                                      const cat = prod.category || '';
                                      const sku = `SG-PROD-${prod.id}`;
                                      const searchLower = productSearch.toLowerCase();
                                      return title.toLowerCase().includes(searchLower) ||
                                             desc.toLowerCase().includes(searchLower) ||
                                             cat.toLowerCase().includes(searchLower) ||
                                             sku.toLowerCase().includes(searchLower);
                                    })
                                    .map(prod => (
                                      <tr key={prod.id} className={`transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-neutral-50'}`}>
                                        <td className="p-4 text-center">
                                          <div className={`w-10 h-10 rounded-lg overflow-hidden border flex items-center justify-center mx-auto ${darkMode ? 'bg-neutral-950/40 border-white/10' : 'bg-neutral-100 border-neutral-200'}`}>
                                            {prod.image ? (
                                              <img src={prod.image} alt={prod.name_fa} className="w-full h-full object-cover" />
                                            ) : (
                                              <Image className="w-4 h-4 text-neutral-400 opacity-40" />
                                            )}
                                          </div>
                                        </td>
                                        <td className={`p-4 font-extrabold ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>
                                          <div>
                                            <p>{isRtl ? prod.name_fa : prod.name_en}</p>
                                            <p className={`text-[10px] line-clamp-1 font-normal mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                              {isRtl ? prod.description_fa : prod.description_en}
                                            </p>
                                          </div>
                                        </td>
                                        <td className={`p-4 font-mono text-[10px] ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                          SG-PROD-{prod.id}
                                        </td>
                                        <td className="p-4">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                            {prod.category}
                                          </span>
                                        </td>
                                        <td className="p-4 font-black text-sky-400">
                                          {isRtl ? `${prod.base_price.toLocaleString('fa-IR')} تومان` : `$${(prod.base_price / 50000).toFixed(1)} USD`}
                                        </td>
                                        <td className="p-4">
                                          <div className="flex items-center justify-center gap-2">
                                            <button
                                              onClick={() => triggerEditProductMode(prod)}
                                              className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg border border-indigo-500/30 transition-all cursor-pointer"
                                              title={isRtl ? "ویرایش و تنظیمات کالا" : "Edit & Configure Product"}
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            
                                            <a
                                              href={`/shop/${currentUser?.shop_slug || 'shop'}/product/${prod.id}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/30 transition-all"
                                              title={isRtl ? "پیش‌نمایش خریدار" : "Public Shop Preview"}
                                            >
                                              <Compass className="w-3.5 h-3.5" />
                                            </a>

                                            {prod.created_by !== 'system' && (
                                              <button
                                                onClick={() => handleDeleteProduct(prod.id)}
                                                className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-500/30 transition-all cursor-pointer"
                                                title={t.delete}
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    // B. UNIFIED EDIT SHEET (CONSOLIDATED FORM IN RESPONSIVE TABS)
                    <div className={`p-4 sm:p-6 rounded-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                      
                      {/* Product header */}
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-6 ${darkMode ? 'border-neutral-800/40' : 'border-neutral-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 border rounded-lg overflow-hidden shrink-0 ${darkMode ? 'bg-neutral-950/20 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                            {prodFormImage ? (
                              <img src={prodFormImage} alt="Product logo" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-sky-400">
                              {isEditingProd.id === 0 ? (isRtl ? "ایجاد محصول جدید" : "Create New Product") : (isRtl ? "تنظیمات همه‌جانبه کالا" : "Configure Product Suite")}
                            </h3>
                            <p className={`text-xs font-bold mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                              {isEditingProd.id === 0 
                                ? (isRtl ? "اطلاعات محصول را ثبت کنید" : "Define general options") 
                                : (isRtl ? `در حال ویرایش: ${isEditingProd.name_fa}` : `Editing: ${isEditingProd.name_en}`)
                              }
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsEditingProd(null)}
                          className={`px-3 py-1.5 border text-xs rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all ${darkMode ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-neutral-200 hover:bg-neutral-100 text-neutral-600'}`}
                        >
                          <ChevronRight className={`w-4 h-4 ${isRtl ? '' : 'rotate-180'}`} />
                          <span>{isRtl ? "بازگشت به لیست کاتالوگ" : "Back to Catalog"}</span>
                        </button>
                      </div>

                      {/* CONSOLIDATED EDIT TABS */}
                      <div className={`flex flex-wrap sm:flex-nowrap p-1.5 rounded-2xl mb-6 gap-1.5 border transition-all ${darkMode ? 'bg-neutral-950/60 border-neutral-800/80' : 'bg-neutral-100/80 border-neutral-200'}`}>
                        <button
                          type="button"
                          onClick={() => setEditTab('general')}
                          className={`flex-1 min-w-[130px] py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            editTab === 'general'
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                              : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50')
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isRtl ? "مشخصات عمومی" : "General Info"}</span>
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
                          className={`flex-1 min-w-[130px] py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isEditingProd.id === 0 ? 'opacity-40 cursor-not-allowed' : ''
                          } ${
                            editTab === 'guides'
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                              : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50')
                          }`}
                        >
                          <Ruler className="w-3.5 h-3.5" />
                          <span>{isRtl ? "راهنمای سایز" : "Size Guide"}</span>
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
                          className={`flex-1 min-w-[130px] py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isEditingProd.id === 0 ? 'opacity-40 cursor-not-allowed' : ''
                          } ${
                            editTab === 'matrix'
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                              : (darkMode ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50')
                          }`}
                        >
                          <Warehouse className="w-3.5 h-3.5" />
                          <span>{isRtl ? "مدیریت انبار" : "Stock Matrix"}</span>
                        </button>
                      </div>

                      {/* SUBTAB 1: GENERAL INFO */}
                      {editTab === 'general' && (
                        <form onSubmit={saveProductSubmit} className="space-y-6">
                          {/* PRODUCT NAME & BASE PRICE (Synced with Directus title & base_price) */}
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                              <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                {isRtl ? "نام محصول" : "Product Name"}
                              </label>
                              <input
                                type="text"
                                required
                                value={prodFormNameFa}
                                onChange={(e) => {
                                  setProdFormNameFa(e.target.value);
                                  setProdFormNameEn(e.target.value);
                                }}
                                placeholder={isRtl ? "مثال: هودی نخی کلاه‌دار زمستانه" : "e.g. Winter Cotton Hooded Sweatshirt"}
                                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600' : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400'}`}
                              />
                            </div>

                            <div>
                              <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                {isRtl ? "قیمت پایه (تومان)" : "Base Price"}
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={prodFormBasePrice}
                                onChange={(e) => setProdFormBasePrice(Number(e.target.value))}
                                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'}`}
                              />
                            </div>
                          </div>

                          {/* PRODUCT DESCRIPTION & CATEGORY (Synced with Directus description & category_id) */}
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                              <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                {isRtl ? "توضیحات و مشخصات محصول" : "Product Description"}
                              </label>
                              <textarea
                                rows={3}
                                value={prodFormDescFa}
                                onChange={(e) => {
                                  setProdFormDescFa(e.target.value);
                                  setProdFormDescEn(e.target.value);
                                }}
                                placeholder={isRtl ? "شرح الیاف و جنس پارچه، قواره، ویژگی‌های طراحی و شرایط شستشو..." : "Detailed fabric composition, fit, care instructions..."}
                                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600' : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400'}`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className={`text-xs font-bold ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                  {isRtl ? "دسته‌بندی محصول" : "Category"}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setShowAddCategoryModal(true)}
                                  className="text-[10px] font-extrabold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>{isRtl ? "افزودن دسته" : "Add New"}</span>
                                </button>
                              </div>
                              <select
                                value={prodFormCategory}
                                onChange={(e) => setProdFormCategory(e.target.value)}
                                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-300 text-neutral-900'}`}
                              >
                                {categoriesList.map(cat => (
                                  <option key={cat.id} value={cat.name}>
                                    {isRtl ? (cat.name_fa || cat.name) : cat.name} ({cat.clothing_type_slug || 'tops'})
                                  </option>
                                ))}
                                {categoriesList.length === 0 && (
                                  <>
                                    <option value="Clothing">{isRtl ? "پوشاک عمومی" : "General Clothing"}</option>
                                    <option value="Tops">{isRtl ? "تیشرت و پولوشرت" : "Tops & Polo"}</option>
                                    <option value="Outerwear">{isRtl ? "کاپشن و کت" : "Outerwear"}</option>
                                    <option value="Pants">{isRtl ? "شلوار کتان و جین" : "Pants"}</option>
                                  </>
                                )}
                              </select>
                            </div>
                          </div>

                          {/* PRODUCT IMAGE & UPLOAD */}
                          <div className="space-y-2">
                            <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                              {isRtl ? "تصویر کالا (آپلود تصویر یا آدرس مستقیم)" : "Product Image (Upload or Direct URL)"}
                            </label>
                            
                            <div className="space-y-3">
                              {prodFormImage ? (
                                <div className={`relative group rounded-2xl overflow-hidden border aspect-video flex items-center justify-center ${darkMode ? 'border-white/10 bg-neutral-950/40' : 'border-neutral-200 bg-neutral-100'}`}>
                                  <img src={prodFormImage} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-neutral-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all duration-200">
                                    <button
                                      type="button"
                                      onClick={() => setProdFormImage('')}
                                      className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>{isRtl ? "حذف تصویر" : "Delete Image"}</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-5 transition-all cursor-pointer text-center group ${
                                    prodFormStatus === 'saving' 
                                      ? 'border-sky-500 bg-sky-500/10' 
                                      : (darkMode ? 'border-neutral-800 hover:border-sky-500/50 bg-neutral-950/20 hover:bg-sky-500/5' : 'border-neutral-300 hover:border-sky-500/50 bg-neutral-50 hover:bg-sky-50/50')
                                  }`}>
                                    {prodFormStatus === 'saving' ? (
                                      <div className="flex flex-col items-center gap-2 py-2">
                                        <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
                                        <span className="text-xs font-bold text-sky-400">
                                          {isRtl ? "در حال فشرده‌سازی و آپلود..." : "Compressing & Uploading..."}
                                        </span>
                                      </div>
                                    ) : (
                                      <>
                                        <Upload className="w-7 h-7 text-neutral-400 group-hover:text-sky-500 group-hover:scale-110 transition-all mb-1.5" />
                                        <span className={`text-xs font-extrabold group-hover:text-sky-500 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                          {isRtl ? "انتخاب تصویر برای فشرده‌سازی و آپلود" : "Click to Compress & Upload Image"}
                                        </span>
                                        <span className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                                          {isRtl ? "تصویر به‌صورت خودکار فشرده و در دیتابیس آپلود می‌شود" : "Compressed in-browser via canvas for fast uploads"}
                                        </span>
                                      </>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      disabled={prodFormStatus === 'saving'}
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            setProdFormStatus('saving');
                                            setError('');
                                            const url = await DirectusAPI.uploadProductImage(file);
                                            setProdFormImage(url);
                                          } catch (err: any) {
                                            setError(err.message || (isRtl ? "خطا در آپلود تصویر" : "Error uploading image"));
                                          } finally {
                                            setProdFormStatus('idle');
                                            e.target.value = '';
                                          }
                                        }
                                      }}
                                    />
                                  </label>

                                  <div className="relative flex items-center gap-2 pt-1">
                                    <input
                                      type="url"
                                      placeholder={isRtl ? "یا آدرس لینک مستقیم تصویر را وارد کنید (https://...)" : "Or paste image URL (https://...)"}
                                      value={prodFormImage}
                                      onChange={(e) => setProdFormImage(e.target.value)}
                                      className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600' : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400'}`}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* BRAND COLOR MULTI-SELECT CHIPS */}
                          <div className="space-y-3">
                            <div>
                              <h4 className={`text-xs font-extrabold ${darkMode ? 'text-neutral-400' : 'text-neutral-700'}`}>{isRtl ? "رنگ‌های موجود برای این کالا (رنگ‌ها را انتخاب کنید)" : "Available Garment Colors (Multi-Select)"}</h4>
                              <p className={`text-[10px] mt-1 ${darkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>{isRtl ? "رنگ‌های مربوط به کالا را کلیک و تیک بزنید." : "Toggle active colors of this product layout."}</p>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {colors.map(col => {
                                const isSelected = selectedColorIds.includes(col.id);
                                return (
                                  <button
                                    key={col.id}
                                    type="button"
                                    onClick={() => toggleColorSelect(col.id)}
                                    className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                                      isSelected 
                                        ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-md shadow-sky-600/5' 
                                        : (darkMode ? 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200' : 'border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200')
                                    }`}
                                  >
                                    <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" style={{ backgroundColor: col.hex_code }} />
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
                              <h4 className={`text-xs font-extrabold ${darkMode ? 'text-neutral-400' : 'text-neutral-700'}`}>{isRtl ? "سایزهای موجود برای این کالا (سایزها را انتخاب کنید)" : "Available Garment Sizes (Multi-Select)"}</h4>
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
                                    className={`px-4 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                                      isSelected 
                                        ? 'border-sky-500 bg-sky-500/10 text-sky-400' 
                                        : (darkMode ? 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200' : 'border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200')
                                    }`}
                                  >
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border ${darkMode ? 'bg-neutral-950/60 border-neutral-800 text-sky-400' : 'bg-white border-neutral-300 text-sky-600'}`}>{sz.name}</span>
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
                          <div className={`flex justify-end pt-4 border-t gap-3 ${darkMode ? 'border-neutral-800/40' : 'border-neutral-200'}`}>
                            <button
                              type="button"
                              onClick={() => setIsEditingProd(null)}
                              className={`px-4 py-2.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${darkMode ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-400' : 'border-neutral-200 hover:bg-neutral-100 text-neutral-600'}`}
                            >
                              {t.cancel}
                            </button>

                            <button
                              type="submit"
                              disabled={prodFormStatus === 'saving'}
                              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-2 cursor-pointer transition-all"
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
                          {/* Sizing Architecture Choice */}
                          <div className={`p-4 rounded-xl space-y-4 border ${darkMode ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                            <div className={`text-xs font-bold ${darkMode ? 'text-neutral-400' : 'text-neutral-700'}`}>{isRtl ? "۱. تعیین شیوه مدیریت سایزبندی و قوانین هوشمند:" : "1. Sizing Strategy & Intelligent Rules:"}</div>
                            <div className="grid sm:grid-cols-3 gap-3">
                              <button
                                type="button"
                                onClick={() => setProdFormTemplateOption('template')}
                                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                  prodFormTemplateOption === 'template'
                                    ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-extrabold shadow-md'
                                    : (darkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900/60' : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100')
                                }`}
                              >
                                <div className="text-xs font-black">{isRtl ? "استفاده از قالب‌های آماده" : "Select Existing Template"}</div>
                                <div className="text-[10px] opacity-60 mt-0.5">{isRtl ? "انتخاب الگوهای اندازه‌گیری عمومی" : "Assign reusable guidelines"}</div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setProdFormTemplateOption('new_template')}
                                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                  prodFormTemplateOption === 'new_template'
                                    ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-extrabold shadow-md'
                                    : (darkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900/60' : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100')
                                }`}
                              >
                                <div className="text-xs font-black">{isRtl ? "ساخت و تخصیص قالب جدید" : "Create & Assign Template"}</div>
                                <div className="text-[10px] opacity-60 mt-0.5">{isRtl ? "ساخت الگوی عمومی مجدد مصرف" : "Register new reusable preset"}</div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setProdFormTemplateOption('custom')}
                                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                  prodFormTemplateOption === 'custom'
                                    ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-extrabold shadow-md'
                                    : (darkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900/60' : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100')
                                }`}
                              >
                                <div className="text-xs font-black">{isRtl ? "مقادیر اختصاصی محصول" : "Custom rules for item"}</div>
                                <div className="text-[10px] opacity-60 mt-0.5">{isRtl ? "تنظیم قوانین جداگانه مستقل" : "Configure direct boundaries"}</div>
                              </button>
                            </div>

                            {prodFormTemplateOption === 'template' && (
                              <div className="space-y-3 pt-2">
                                <label className={`block text-xs font-bold ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>{isRtl ? "الگوی سایزبندی آماده را انتخاب کنید:" : "Choose a template profile:"}</label>
                                <select
                                  value={prodFormTemplateId || ''}
                                  onChange={(e) => setProdFormTemplateId(e.target.value)}
                                  className={`w-full px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 border ${darkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-900'}`}
                                >
                                  <option value="">{isRtl ? "-- انتخاب قالب --" : "-- Choose Sizing Template --"}</option>
                                  {templatesList.map(tpl => (
                                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                                  ))}
                                </select>

                                {prodFormTemplateId && (
                                  <div className={`p-4 rounded-xl border space-y-3 ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <div className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                                      <Ruler className="w-3.5 h-3.5" />
                                      <span>{isRtl ? "قوانین اندازه‌گیری پیش‌نمایش قالب:" : "Preview of template rules:"}</span>
                                    </div>
                                    <div className="grid gap-2">
                                      {(() => {
                                        const selectedTpl = templatesList.find(t => String(t.id) === String(prodFormTemplateId));
                                        if (!selectedTpl) return <p className="text-[10px] text-neutral-500 italic">{isRtl ? "قالب پیدا نشد" : "Template not found"}</p>;
                                        if (!selectedTpl.measurements || selectedTpl.measurements.length === 0) {
                                          return <p className="text-[10px] text-neutral-500 italic">{isRtl ? "این قالب فاقد هرگونه قانون اندازه‌گیری است." : "No parameters configured in this template."}</p>;
                                        }
                                        return selectedTpl.measurements.map((m, idx) => {
                                          const sizeName = sizes.find(s => s.id === m.size_id)?.name || `Size ID: ${m.size_id}`;
                                          return (
                                            <div key={idx} className={`flex items-center justify-between text-[11px] p-2 rounded-lg border ${darkMode ? 'bg-neutral-900 border-neutral-800/60' : 'bg-neutral-50 border-neutral-200'}`}>
                                              <span className="font-bold text-sky-400 bg-sky-600/10 px-2.5 py-0.5 rounded-md border border-sky-500/15">{sizeName}</span>
                                              <span className={`font-extrabold ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                {isRtl ? `قد: ${m.min_height} تا ${m.max_height} سم` : `Height: ${m.min_height} - ${m.max_height} cm`} | 
                                                {isRtl ? ` وزن: ${m.min_weight} تا ${m.max_weight} کگ` : ` Weight: ${m.min_weight} - ${m.max_weight} kg`}
                                              </span>
                                              <span className="text-neutral-500 text-[10px] font-semibold">
                                                {m.shapes.slim ? (isRtl ? "لاغر " : "Slim ") : ""}{m.shapes.athletic ? (isRtl ? "ورزشکار " : "Athletic ") : ""}{m.shapes.heavy ? (isRtl ? "توپر" : "Heavy") : ""}
                                              </span>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {prodFormTemplateOption === 'new_template' && (
                              <div className={`space-y-3 pt-2 border-t ${darkMode ? 'border-neutral-800/40' : 'border-neutral-200'}`}>
                                <label className={`block text-xs font-bold ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>{isRtl ? "نام قالب سایزبندی جدید عمومی:" : "New Sizing Template Profile Name:"}</label>
                                <input
                                  type="text"
                                  placeholder={isRtl ? "مثلا: استاندارد تی‌شرت لش" : "e.g., Standard Oversized Tees"}
                                  value={newTemplateName}
                                  onChange={(e) => setNewTemplateName(e.target.value)}
                                  className={`w-full px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 border ${darkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-900'}`}
                                />
                              </div>
                            )}
                          </div>

                          {/* Manual Input Grid (Required for custom overrides or defining new template parameters) */}
                          {(prodFormTemplateOption === 'custom' || prodFormTemplateOption === 'new_template') && (
                            <div className="space-y-4">
                              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs flex items-center gap-2.5">
                                <Info className="w-4 h-4 text-indigo-400" />
                                <span>
                                  {isRtl
                                    ? "راهنما: محدوده ابعادی خریدار (قد و وزن و ساختار بدنی) هر سایز را تعریف کنید. این اطلاعات برای تخمین هوشمند سایز خریداران اعمال می‌شود."
                                    : "Configure height & weight thresholds and body shape bounds for active size choices to empower the sizing engine."}
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
                                            : (darkMode ? 'bg-neutral-900/10 border-neutral-800 opacity-60' : 'bg-neutral-100 border-neutral-200 opacity-60')
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
                                                className={`rounded text-sky-600 focus:ring-sky-500 w-4 h-4 ${darkMode ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-300 bg-white'}`}
                                              />
                                              <span className={`text-xs font-black ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                {cell.enabled ? (isRtl ? "راهنما فعال است" : "Active Guide") : (isRtl ? "فاقد بازه علمی" : "No rules")}
                                              </span>
                                            </label>
                                          </div>

                                          {cell.enabled ? (
                                            <div className="flex-1 grid grid-cols-1 gap-4">
                                              <div className="grid sm:grid-cols-3 gap-6">
                                                {/* Height bounds */}
                                                <div className="space-y-1.5">
                                                  <span className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "حدود قد مناسب (سانتی‌متر):" : "Height Range (cm):"}</span>
                                                <div className="flex items-center gap-1.5">
                                                  <input
                                                    type="number"
                                                    value={cell.min_height}
                                                    onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_height', null, Number(e.target.value))}
                                                    className={`w-1/2 px-2 py-1 rounded text-center text-xs font-extrabold text-sky-400 border ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                  />
                                                  <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                                  <input
                                                    type="number"
                                                    value={cell.max_height}
                                                    onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_height', null, Number(e.target.value))}
                                                    className={`w-1/2 px-2 py-1 rounded text-center text-xs font-extrabold text-sky-400 border ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                  />
                                                </div>
                                              </div>

                                              {/* Weight bounds */}
                                              <div className="space-y-1.5">
                                                <span className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "حدود وزن مناسب (کیلوگرم):" : "Weight Range (kg):"}</span>
                                                <div className="flex items-center gap-1.5">
                                                  <input
                                                    type="number"
                                                    value={cell.min_weight}
                                                    onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_weight', null, Number(e.target.value))}
                                                    className={`w-1/2 px-2 py-1 rounded text-center text-xs font-extrabold text-indigo-400 border ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                  />
                                                  <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                                  <input
                                                    type="number"
                                                    value={cell.max_weight}
                                                    onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_weight', null, Number(e.target.value))}
                                                    className={`w-1/2 px-2 py-1 rounded text-center text-xs font-extrabold text-indigo-400 border ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                  />
                                                </div>
                                              </div>

                                              {/* Body shapes */}
                                              <div className="space-y-1.5">
                                                <span className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "سازگاری با ساختار بدنی:" : "Compatible Body Shapes:"}</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                  {/* Slim */}
                                                  <label className={`px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
                                                    cell.shapes.slim ? 'bg-sky-600/20 border-sky-500 text-sky-400' : (darkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-300 text-neutral-600')
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
                                                    cell.shapes.athletic ? 'bg-sky-600/20 border-sky-500 text-sky-400' : (darkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-300 text-neutral-600')
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
                                                    cell.shapes.heavy ? 'bg-sky-600/20 border-sky-500 text-sky-400' : (darkMode ? 'border-neutral-800 text-neutral-500' : 'border-neutral-300 text-neutral-600')
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

                                              {/* Precise clothing / footwear body-part measurements based on category */}
                                              {(() => {
                                                const prodType = getClothingTypeFromCategory(prodFormCategory, categoriesList);
                                                if (prodType === 'footwear') {
                                                  return (
                                                    <div className={`border-t pt-3 mt-1 grid grid-cols-1 md:grid-cols-2 gap-3 ${darkMode ? 'border-white/5' : 'border-neutral-200'}`}>
                                                      {/* Foot Length */}
                                                      <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-sky-400 block">{isRtl ? "طول پا (سانتی‌متر):" : "Foot Length (cm):"}</span>
                                                        <div className="flex items-center gap-1.5">
                                                          <input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Min"
                                                            value={cell.min_foot_length ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_foot_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-2 py-1 border border-sky-500/30 rounded text-center text-xs text-sky-400 font-extrabold focus:outline-none focus:ring-1 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950' : 'bg-white'}`}
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                                          <input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Max"
                                                            value={cell.max_foot_length ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_foot_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-2 py-1 border border-sky-500/30 rounded text-center text-xs text-sky-400 font-extrabold focus:outline-none focus:ring-1 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950' : 'bg-white'}`}
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                }

                                                if (prodType === 'accessories') {
                                                  return (
                                                    <div className={`border-t pt-3 mt-1 text-[10px] italic ${darkMode ? 'border-white/5 text-neutral-500' : 'border-neutral-200 text-neutral-500'}`}>
                                                      {isRtl ? "اکسسوری‌ها تک‌سایز یا فری‌سایز هستند و نیازی به ابعاد دقیق بدنی ندارند." : "Accessories do not require specific body dimensions."}
                                                    </div>
                                                  );
                                                }

                                                return (
                                                  <div className={`border-t pt-3 mt-1 grid grid-cols-2 md:grid-cols-6 gap-3 ${darkMode ? 'border-white/5' : 'border-neutral-200'}`}>
                                                    {/* Chest (Tops, One-Piece) */}
                                                    {(prodType === 'tops' || prodType === 'one_piece') && (
                                                      <div className="space-y-1">
                                                        <span className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "دور سینه:" : "Chest:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_chest ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_chest', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_chest ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_chest', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Waist (Bottoms, One-Piece) */}
                                                    {(prodType === 'bottoms' || prodType === 'one_piece') && (
                                                      <div className="space-y-1">
                                                        <span className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "دور کمر:" : "Waist:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_waist ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_waist', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_waist ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_waist', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Hip (Bottoms, One-Piece) */}
                                                    {(prodType === 'bottoms' || prodType === 'one_piece') && (
                                                      <div className="space-y-1">
                                                        <span className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "دور باسن:" : "Hips:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_hip ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_hip', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_hip ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_hip', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Shoulder (Tops) */}
                                                    {prodType === 'tops' && (
                                                      <div className="space-y-1">
                                                        <span className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "سرشانه:" : "Shoulder:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_shoulder ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_shoulder', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_shoulder ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_shoulder', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Sleeve (Tops) */}
                                                    {prodType === 'tops' && (
                                                      <div className="space-y-1">
                                                        <span className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "قد آستین:" : "Sleeve:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_sleeve ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_sleeve', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_sleeve ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_sleeve', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Length (Tops, Bottoms, One-Piece) */}
                                                    {(prodType === 'tops' || prodType === 'bottoms' || prodType === 'one_piece') && (
                                                      <div className="space-y-1">
                                                        <span className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? (prodType === 'bottoms' ? "قد شلوار:" : "قد لباس:") : "Length:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_length ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_length ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className={`w-1/2 px-1 py-0.5 border rounded text-center text-xs text-sky-400 font-extrabold ${darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                                          />
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          ) : (
                                            <div className="flex-1 text-right text-[10px] text-neutral-500 font-semibold italic">
                                              {isRtl ? "راهنمای ابعادی برای این سایز لباس تعریف نشده است." : "No sizing parameters specified for this size option."}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          <div className={`flex justify-end pt-4 border-t ${darkMode ? 'border-neutral-800/40' : 'border-neutral-200'}`}>
                            <button
                              onClick={saveProductSizeGuides}
                              disabled={savingSizeGuides}
                              className="px-8 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
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
                      {editTab === 'matrix' && (
                        isEditingProd.id > 0 ? (
                          <ProductMatrixEditor
                            t={t}
                            isRtl={isRtl}
                            darkMode={darkMode}
                            sizes={sizes}
                            colors={colors}
                            selectedSizeIds={selectedSizeIds}
                            selectedColorIds={selectedColorIds}
                            product={isEditingProd}
                            matrixGridState={matrixGridState}
                            onCellChange={handleCellChange}
                            onSaveMatrix={saveProductMatrix}
                            savingMatrix={savingMatrix}
                          />
                        ) : (
                          <div className={`p-8 rounded-2xl border text-center space-y-4 ${darkMode ? 'bg-neutral-950/40 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                              <Warehouse className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                                {isRtl ? "ابتدا مشخصات عمومی را ثبت کنید" : "Save General Info First"}
                              </h3>
                              <p className="text-xs max-w-md mx-auto leading-relaxed">
                                {isRtl 
                                  ? "برای دسترسی به ماتریس مدیریت انبار و متغیرهای رنگ و سایز، ابتدا دکمه «ایجاد محصول» را در تب مشخصات عمومی بزنید تا کالا ذخیره شود."
                                  : "To configure the stock matrix and variants, please first save the product in the General Info tab."}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditTab('general')}
                              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-600/10"
                            >
                              <FileText className="w-4 h-4" />
                              <span>{isRtl ? "بازگشت به مشخصات عمومی" : "Back to General Info"}</span>
                            </button>
                          </div>
                        )
                      )}

                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: GENERAL WAREHOUSE MANAGER (انبار) */}
              {activeTab === 'warehouse' && (
                <WarehouseTable
                  isRtl={isRtl}
                  darkMode={darkMode}
                  warehouseSearch={warehouseSearch}
                  setWarehouseSearch={setWarehouseSearch}
                  onNavigateBarcodes={() => setActiveTab('barcodes')}
                  onExportCSV={handleExportWarehouseCSV}
                  onExportJSON={handleExportWarehouseJSON}
                  inventory={warehouseInventory}
                  products={products}
                  colors={colors}
                  sizes={sizes}
                  localStockEdits={localStockEdits}
                  localPriceEdits={localPriceEdits}
                  localSkuEdits={localSkuEdits}
                  onLocalChange={handleWarehouseLocalChange}
                  onQuickSave={handleWarehouseQuickSave}
                  updatingWarehouseId={updatingWarehouseId}
                />
              )}

              {/* TAB 2.2: BARCODE & LABEL GENERATOR */}
              {activeTab === 'barcodes' && (
                <BarcodeGenerator
                  products={products}
                  inventory={warehouseInventory}
                  colors={colors}
                  sizes={sizes}
                  categories={categoriesList}
                  lang={lang}
                  shopName={settingsShopName || currentUser?.shop_name || 'تن‌خور'}
                  onUpdateInventorySku={async (updatedInventoryItem) => {
                    try {
                      await storageManager.updateInventory(updatedInventoryItem);
                      const fullInv = await storageManager.getInventory();
                      setWarehouseInventory(fullInv);
                      setSuccess(isRtl ? "کد شناسه SKU و اطلاعات بارکد با موفقیت بروزرسانی شد." : "Inventory SKU updated successfully.");
                      setTimeout(() => setSuccess(''), 3000);
                    } catch (err: any) {
                      setError(err.message || (isRtl ? "خطا در به‌روزرسانی کد SKU." : "Failed to update SKU."));
                      setTimeout(() => setError(''), 4000);
                    }
                  }}
                />
              )}

              {/* TAB 2.5: SIZE GUIDE TEMPLATES CRUD MANAGER */}
              {activeTab === 'templates' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black">{isRtl ? "قالب‌های سایزبندی عمومی" : "Size Guide Templates"}</h3>
                      <p className="text-xs text-neutral-400">
                        {isRtl 
                          ? "الگوها و جدول‌های اندازه‌گیری تکرارپذیر بسازید تا بدون نیاز به مقداردهی دستی کالاها، آنها را سریعاً به پوشاک تخصیص دهید." 
                          : "Create reusable measurement charts and link them to any product instead of copy-pasting rules manually."}
                      </p>
                    </div>

                    {!editingTemplate && (
                      <button
                        onClick={() => {
                          setEditingTemplate({ id: 0, name: '', measurements: [] });
                          setTemplateFormName('');
                          const formState: Record<string, any> = {};
                          sizes.forEach(sz => {
                            const defaults = getDefaultMeasurementsForSize(sz.name);
                            formState[sz.id] = {
                              enabled: false,
                              min_height: defaults.min_height,
                              max_height: defaults.max_height,
                              min_weight: defaults.min_weight,
                              max_weight: defaults.max_weight,
                              min_chest: defaults.min_chest,
                              max_chest: defaults.max_chest,
                              min_waist: defaults.min_waist,
                              max_waist: defaults.max_waist,
                              min_hip: defaults.min_hip,
                              max_hip: defaults.max_hip,
                              min_shoulder: defaults.min_shoulder,
                              max_shoulder: defaults.max_shoulder,
                              min_sleeve: defaults.min_sleeve,
                              max_sleeve: defaults.max_sleeve,
                              min_length: defaults.min_length,
                              max_length: defaults.max_length,
                              shapes: { slim: true, athletic: true, heavy: false }
                            };
                          });
                          setTemplateFormState(formState);
                        }}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isRtl ? "ایجاد قالب جدید" : "Create New Template"}</span>
                      </button>
                    )}
                  </div>

                  {editingTemplate ? (
                    <div className={`p-6 border rounded-2xl space-y-6 ${darkMode ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-neutral-200 shadow-md'}`}>
                      <div className={`flex items-center justify-between border-b pb-4 ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <h4 className="text-sm font-extrabold text-sky-400 flex items-center gap-2">
                          <Ruler className="w-4 h-4" />
                          <span>
                            {editingTemplate.id === 0 
                              ? (isRtl ? "ایجاد قالب سایزبندی جدید" : "Create New Sizing Template")
                              : (isRtl ? `ویرایش قالب: ${editingTemplate.name}` : `Edit Template: ${editingTemplate.name}`)}
                          </span>
                        </h4>
                        <button
                          onClick={() => setEditingTemplate(null)}
                          className={`p-1 ${darkMode ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-800'}`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "نام قالب (مثلا: هودی لش قواره بزرگ)" : "Template Name:"}</label>
                            <input
                              type="text"
                              required
                              placeholder={isRtl ? "نام توصیفی قالب" : "Descriptive template name"}
                              value={templateFormName}
                              onChange={(e) => setTemplateFormName(e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border border-neutral-800 text-neutral-300' : 'bg-white border border-neutral-300 text-neutral-900'}`}
                            />
                          </div>

                          <div>
                            <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{isRtl ? "نوع پوشاک / دسته‌بندی اصلی:" : "Clothing Type / Main Category:"}</label>
                            <select
                              value={templateFormClothingType}
                              onChange={(e) => setTemplateFormClothingType(e.target.value as any)}
                              className={`w-full px-3 py-2 rounded-lg text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border border-neutral-800 text-neutral-300' : 'bg-white border border-neutral-300 text-neutral-900'}`}
                            >
                              <option value="tops">{isRtl ? "بالاتنه (تیشرت، هودی، پیراهن، کت)" : "Tops (T-shirt, Hoodie, Shirt, Jacket)"}</option>
                              <option value="bottoms">{isRtl ? "پایین‌تنه (شلوار، شلوارک، جین، لگ)" : "Bottoms (Pants, Shorts, Jeans, Leggings)"}</option>
                              <option value="footwear">{isRtl ? "کفش (کتانی، بوت، صندل)" : "Footwear (Sneakers, Boots, Sandals)"}</option>
                              <option value="one_piece">{isRtl ? "سرهمی (اورال، کت‌وشلوار، پیراهن یکسره)" : "One-piece (Overalls, Suits, Dresses)"}</option>
                              <option value="accessories">{isRtl ? "اکسسوری (کلاه، شال، دستکش)" : "Accessories (Hat, Scarf, Gloves)"}</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-3 pt-3">
                          <div className="text-xs font-bold text-neutral-400">{isRtl ? "تنظیم بازه‌های ابعادی سایزها:" : "Configure Size-by-Size Sizing Rules:"}</div>
                          <div className="grid gap-3">
                            {sizes.map(sz => {
                              const cell = templateFormState[sz.id] || {
                                enabled: false,
                                min_height: 150,
                                max_height: 180,
                                min_weight: 50,
                                max_weight: 80,
                                shapes: { slim: true, athletic: true, heavy: false }
                              };

                              const handleTplCellChange = (field: string, subfield: string | null, value: any) => {
                                setTemplateFormState(prev => {
                                  const updated = { ...prev[sz.id] };
                                  if (subfield) {
                                    updated[field] = { ...updated[field], [subfield]: value };
                                  } else {
                                    updated[field] = value;
                                  }
                                  return { ...prev, [sz.id]: updated };
                                });
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
                                    <div className="flex items-center gap-4 shrink-0 min-w-[150px]">
                                      <div className="w-10 h-10 rounded-xl bg-sky-600/10 text-sky-400 font-extrabold text-xs flex items-center justify-center border border-sky-500/20">
                                        {sz.name}
                                      </div>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={cell.enabled}
                                          onChange={(e) => handleTplCellChange('enabled', null, e.target.checked)}
                                          className="rounded border-neutral-700 bg-neutral-900 text-sky-600 focus:ring-sky-500 w-4 h-4"
                                        />
                                        <span className="text-xs font-black text-neutral-300">
                                          {cell.enabled ? (isRtl ? "فعال در قالب" : "Active") : (isRtl ? "غیرفعال" : "Disabled")}
                                        </span>
                                      </label>
                                    </div>

                                    {cell.enabled ? (
                                      <div className="flex-1 grid grid-cols-1 gap-4">
                                        <div className="grid sm:grid-cols-3 gap-6">
                                        {/* Height */}
                                        <div className="space-y-1.5">
                                          <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "قد مناسب (سانتی‌متر):" : "Height Range (cm):"}</span>
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              type="number"
                                              value={cell.min_height}
                                              onChange={(e) => handleTplCellChange('min_height', null, Number(e.target.value))}
                                              className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                            />
                                            <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                            <input
                                              type="number"
                                              value={cell.max_height}
                                              onChange={(e) => handleTplCellChange('max_height', null, Number(e.target.value))}
                                              className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                            />
                                          </div>
                                        </div>

                                        {/* Weight */}
                                        <div className="space-y-1.5">
                                          <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "وزن مناسب (کیلوگرم):" : "Weight Range (kg):"}</span>
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              type="number"
                                              value={cell.min_weight}
                                              onChange={(e) => handleTplCellChange('min_weight', null, Number(e.target.value))}
                                              className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-indigo-400 font-extrabold"
                                            />
                                            <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                            <input
                                              type="number"
                                              value={cell.max_weight}
                                              onChange={(e) => handleTplCellChange('max_weight', null, Number(e.target.value))}
                                              className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-indigo-400 font-extrabold"
                                            />
                                          </div>
                                        </div>

                                        {/* Shapes */}
                                        <div className="space-y-1.5">
                                          <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "ساختار بدنی خریدار:" : "Body Shapes:"}</span>
                                          <div className="flex flex-wrap gap-1.5">
                                            <label className={`px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
                                              cell.shapes.slim ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'border-neutral-800 text-neutral-500'
                                            }`}>
                                              <input
                                                type="checkbox"
                                                checked={cell.shapes.slim}
                                                onChange={(e) => handleTplCellChange('shapes', 'slim', e.target.checked)}
                                                className="hidden"
                                              />
                                              <span>{isRtl ? "لاغر" : "Slim"}</span>
                                            </label>

                                            <label className={`px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
                                              cell.shapes.athletic ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'border-neutral-800 text-neutral-500'
                                            }`}>
                                              <input
                                                type="checkbox"
                                                checked={cell.shapes.athletic}
                                                onChange={(e) => handleTplCellChange('shapes', 'athletic', e.target.checked)}
                                                className="hidden"
                                              />
                                              <span>{isRtl ? "ورزشکار" : "Athletic"}</span>
                                            </label>

                                            <label className={`px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
                                              cell.shapes.heavy ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'border-neutral-800 text-neutral-500'
                                            }`}>
                                              <input
                                                type="checkbox"
                                                checked={cell.shapes.heavy}
                                                onChange={(e) => handleTplCellChange('shapes', 'heavy', e.target.checked)}
                                                className="hidden"
                                              />
                                              <span>{isRtl ? "توپر" : "Heavy"}</span>
                                            </label>
                                          </div>
                                        </div>

                                        </div>

                                        {/* Precise clothing body-part measurements based on clothing type */}
                                        {templateFormClothingType === 'footwear' ? (
                                          <div className="border-t border-white/5 pt-3 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                              <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "طول پا مناسب (سانتی‌متر):" : "Foot Length (cm):"}</span>
                                              <div className="flex items-center gap-1">
                                                <input
                                                  type="number"
                                                  step="0.5"
                                                  placeholder="Min"
                                                  value={cell.min_foot_length ?? ''}
                                                  onChange={(e) => handleTplCellChange('min_foot_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                  className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                />
                                                <span className="text-neutral-500 text-[10px]">-</span>
                                                <input
                                                  type="number"
                                                  step="0.5"
                                                  placeholder="Max"
                                                  value={cell.max_foot_length ?? ''}
                                                  onChange={(e) => handleTplCellChange('max_foot_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                  className="w-1/2 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ) : templateFormClothingType === 'accessories' ? (
                                          <div className="border-t border-white/5 pt-3 mt-1 text-xs text-neutral-500 font-medium italic">
                                            {isRtl ? "اکسسوری‌ها نیازی به فیلدهای ابعاد بدنی ندارند." : "Accessories do not require specific body measurements."}
                                          </div>
                                        ) : (
                                          <div className="border-t border-white/5 pt-3 mt-1 grid grid-cols-2 md:grid-cols-6 gap-3">
                                            {/* Chest */}
                                            {(templateFormClothingType === 'tops' || templateFormClothingType === 'one_piece') && (
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "دور سینه:" : "Chest:"}</span>
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={cell.min_chest ?? ''}
                                                    onChange={(e) => handleTplCellChange('min_chest', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                  <span className="text-neutral-500 text-[10px]">-</span>
                                                  <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={cell.max_chest ?? ''}
                                                    onChange={(e) => handleTplCellChange('max_chest', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {/* Waist */}
                                            {(templateFormClothingType === 'bottoms' || templateFormClothingType === 'one_piece') && (
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "دور کمر:" : "Waist:"}</span>
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={cell.min_waist ?? ''}
                                                    onChange={(e) => handleTplCellChange('min_waist', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                  <span className="text-neutral-500 text-[10px]">-</span>
                                                  <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={cell.max_waist ?? ''}
                                                    onChange={(e) => handleTplCellChange('max_waist', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {/* Hip */}
                                            {(templateFormClothingType === 'bottoms' || templateFormClothingType === 'one_piece') && (
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "دور باسن:" : "Hips:"}</span>
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={cell.min_hip ?? ''}
                                                    onChange={(e) => handleTplCellChange('min_hip', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                  <span className="text-neutral-500 text-[10px]">-</span>
                                                  <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={cell.max_hip ?? ''}
                                                    onChange={(e) => handleTplCellChange('max_hip', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {/* Shoulder */}
                                            {(templateFormClothingType === 'tops' || templateFormClothingType === 'one_piece') && (
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "سرشانه:" : "Shoulder:"}</span>
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={cell.min_shoulder ?? ''}
                                                    onChange={(e) => handleTplCellChange('min_shoulder', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                  <span className="text-neutral-500 text-[10px]">-</span>
                                                  <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={cell.max_shoulder ?? ''}
                                                    onChange={(e) => handleTplCellChange('max_shoulder', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {/* Sleeve */}
                                            {(templateFormClothingType === 'tops' || templateFormClothingType === 'one_piece') && (
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "قد آستین:" : "Sleeve:"}</span>
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={cell.min_sleeve ?? ''}
                                                    onChange={(e) => handleTplCellChange('min_sleeve', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                  <span className="text-neutral-500 text-[10px]">-</span>
                                                  <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={cell.max_sleeve ?? ''}
                                                    onChange={(e) => handleTplCellChange('max_sleeve', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {/* Length */}
                                            {(templateFormClothingType === 'tops' || templateFormClothingType === 'bottoms' || templateFormClothingType === 'one_piece') && (
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? (templateFormClothingType === 'bottoms' ? "قد شلوار:" : "قد لباس:") : "Length:"}</span>
                                                <div className="flex items-center gap-1">
                                                  <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={cell.min_length ?? ''}
                                                    onChange={(e) => handleTplCellChange('min_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                  <span className="text-neutral-500 text-[10px]">-</span>
                                                  <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={cell.max_length ?? ''}
                                                    onChange={(e) => handleTplCellChange('max_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                  />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex-1 text-right text-[10px] text-neutral-500 italic">
                                        {isRtl ? "سایز فاقد مقادیر اندازه‌گیری در این قالب" : "Size unmapped in this template profile"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setEditingTemplate(null)}
                          className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 rounded-xl text-xs font-black text-neutral-300"
                        >
                          {isRtl ? "انصراف" : "Cancel"}
                        </button>
                        <button
                          type="button"
                          disabled={savingTemplate}
                          onClick={async () => {
                            if (!templateFormName.trim()) {
                              setError(isRtl ? "نام قالب الزامی است." : "Template name is required.");
                              return;
                            }
                            setSavingTemplate(true);
                            setError('');
                            try {
                              const list: SizeGuideTemplateItem[] = [];
                              sizes.forEach(sz => {
                                const val = templateFormState[sz.id];
                                if (val && val.enabled) {
                                  list.push({
                                    size_id: sz.id,
                                    min_height: Number(val.min_height || 0),
                                    max_height: Number(val.max_height || 0),
                                    min_weight: Number(val.min_weight || 0),
                                    max_weight: Number(val.max_weight || 0),
                                    min_chest: val.min_chest !== undefined ? Number(val.min_chest) : undefined,
                                    max_chest: val.max_chest !== undefined ? Number(val.max_chest) : undefined,
                                    min_waist: val.min_waist !== undefined ? Number(val.min_waist) : undefined,
                                    max_waist: val.max_waist !== undefined ? Number(val.max_waist) : undefined,
                                    min_hip: val.min_hip !== undefined ? Number(val.min_hip) : undefined,
                                    max_hip: val.max_hip !== undefined ? Number(val.max_hip) : undefined,
                                    min_shoulder: val.min_shoulder !== undefined ? Number(val.min_shoulder) : undefined,
                                    max_shoulder: val.max_shoulder !== undefined ? Number(val.max_shoulder) : undefined,
                                    min_sleeve: val.min_sleeve !== undefined ? Number(val.min_sleeve) : undefined,
                                    max_sleeve: val.max_sleeve !== undefined ? Number(val.max_sleeve) : undefined,
                                    min_length: val.min_length !== undefined ? Number(val.min_length) : undefined,
                                    max_length: val.max_length !== undefined ? Number(val.max_length) : undefined,
                                    min_foot_length: val.min_foot_length !== undefined ? Number(val.min_foot_length) : undefined,
                                    max_foot_length: val.max_foot_length !== undefined ? Number(val.max_foot_length) : undefined,
                                    shapes: val.shapes
                                  });
                                }
                              });

                              if (list.length === 0) {
                                throw new Error(isRtl ? "لطفاً حداقل برای یک سایز، راهنمای ابعادی را در قالب تعریف کنید." : "At least one sizing rule must be configured.");
                              }

                              if (editingTemplate.id === 0) {
                                await storageManager.saveSizeGuideTemplate({ name: templateFormName, measurements: list, clothing_type_slug: templateFormClothingType });
                                setSuccess(isRtl ? "قالب با موفقیت ایجاد شد." : "Template registered successfully.");
                              } else {
                                await storageManager.saveSizeGuideTemplate({ id: editingTemplate.id, name: templateFormName, measurements: list, clothing_type_slug: templateFormClothingType });
                                setSuccess(isRtl ? "تغییرات قالب با موفقیت ذخیره شد." : "Template specs saved successfully.");
                              }

                              const res = await storageManager.getSizeGuideTemplates();
                              setTemplatesList(res);
                              setEditingTemplate(null);
                            } catch (err: any) {
                              setError(err.message || (isRtl ? "خطا در پردازش قالب." : "Error processing template."));
                            } finally {
                              setSavingTemplate(false);
                            }
                          }}
                          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-lg"
                        >
                          {savingTemplate ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>{isRtl ? "ذخیره نهایی قالب" : "Save Template Specs"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {templatesList.length === 0 ? (
                        <div className={`col-span-full p-12 text-center border rounded-2xl italic text-xs font-extrabold ${darkMode ? 'bg-neutral-900/10 border-neutral-800 text-neutral-500' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                          {isRtl ? "هیچ قالب سایزبندی تعریف نشده است. برای تخصیص آسان به پوشاک، اولین قالب را همین حالا بسازید!" : "No reusable templates registered yet. Create one to assign specs in bulk!"}
                        </div>
                      ) : (
                        templatesList.map(tpl => (
                          <div key={tpl.id} className={`p-5 border rounded-2xl flex flex-col justify-between gap-4 ${darkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className={`text-xs font-black ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>{tpl.name}</h4>
                                  <span className="inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400">
                                    {tpl.clothing_type_slug === 'footwear' ? (isRtl ? 'کفش' : 'Footwear') :
                                     tpl.clothing_type_slug === 'bottoms' ? (isRtl ? 'پایین‌تنه' : 'Bottoms') :
                                     tpl.clothing_type_slug === 'one_piece' ? (isRtl ? 'سرهمی' : 'One-piece') :
                                     tpl.clothing_type_slug === 'accessories' ? (isRtl ? 'اکسسوری' : 'Accessories') :
                                     (isRtl ? 'بالاتنه' : 'Tops')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingTemplate(tpl);
                                      setTemplateFormName(tpl.name);
                                      setTemplateFormClothingType(tpl.clothing_type_slug || 'tops');
                                      const formState: Record<string, any> = {};
                                      sizes.forEach(sz => {
                                        const found = tpl.measurements?.find(m => m.size_id === sz.id);
                                        const defaults = getDefaultMeasurementsForSize(sz.name);
                                        formState[sz.id] = {
                                          enabled: !!found,
                                          min_height: found ? found.min_height : defaults.min_height,
                                          max_height: found ? found.max_height : defaults.max_height,
                                          min_weight: found ? found.min_weight : defaults.min_weight,
                                          max_weight: found ? found.max_weight : defaults.max_weight,
                                          min_chest: found?.min_chest !== undefined ? found.min_chest : defaults.min_chest,
                                          max_chest: found?.max_chest !== undefined ? found.max_chest : defaults.max_chest,
                                          min_waist: found?.min_waist !== undefined ? found.min_waist : defaults.min_waist,
                                          max_waist: found?.max_waist !== undefined ? found.max_waist : defaults.max_waist,
                                          min_hip: found?.min_hip !== undefined ? found.min_hip : defaults.min_hip,
                                          max_hip: found?.max_hip !== undefined ? found.max_hip : defaults.max_hip,
                                          min_shoulder: found?.min_shoulder !== undefined ? found.min_shoulder : defaults.min_shoulder,
                                          max_shoulder: found?.max_shoulder !== undefined ? found.max_shoulder : defaults.max_shoulder,
                                          min_sleeve: found?.min_sleeve !== undefined ? found.min_sleeve : defaults.min_sleeve,
                                          max_sleeve: found?.max_sleeve !== undefined ? found.max_sleeve : defaults.max_sleeve,
                                          min_length: found?.min_length !== undefined ? found.min_length : defaults.min_length,
                                          max_length: found?.max_length !== undefined ? found.max_length : defaults.max_length,
                                          min_foot_length: found?.min_foot_length !== undefined ? found.min_foot_length : undefined,
                                          max_foot_length: found?.max_foot_length !== undefined ? found.max_foot_length : undefined,
                                          shapes: found ? found.shapes : { slim: true, athletic: true, heavy: false }
                                        };
                                      });
                                      setTemplateFormState(formState);
                                    }}
                                    className={`p-1.5 rounded-lg transition-all ${darkMode ? 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-sky-400' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-sky-600'}`}
                                    title={isRtl ? "ویرایش قالب" : "Edit template"}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(isRtl ? `آیا از حذف قالب "${tpl.name}" اطمینان دارید؟ کالاها به تنظیمات اندازه اختصاصی تغییر وضعیت خواهند داد.` : `Delete template "${tpl.name}"? linked products will fall back to direct specs.`)) {
                                        try {
                                          await storageManager.deleteSizeGuideTemplate(tpl.id);
                                          const list = await storageManager.getSizeGuideTemplates();
                                          setTemplatesList(list);
                                          setSuccess(isRtl ? "قالب سایزبندی حذف شد." : "Template deleted successfully.");
                                        } catch (err) {
                                          setError(isRtl ? "خطا در حذف قالب." : "Error removing template.");
                                        }
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg transition-all ${darkMode ? 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-red-400' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-red-600'}`}
                                    title={isRtl ? "حذف قالب" : "Delete template"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className={`text-[10px] font-bold ${darkMode ? 'text-neutral-500' : 'text-neutral-600'}`}>{isRtl ? "قوانین فعال سایزها:" : "Active Size Rules:"}</div>
                                <div className="grid gap-1">
                                  {tpl.measurements?.map((m, idx) => {
                                    const szName = sizes.find(s => s.id === m.size_id)?.name || `ID: ${m.size_id}`;
                                    return (
                                      <div key={idx} className={`flex items-center justify-between text-[10px] px-2 py-1 rounded border ${darkMode ? 'bg-neutral-950 border-neutral-800/40' : 'bg-neutral-50 border-neutral-200'}`}>
                                        <span className="font-extrabold text-sky-400">{szName}</span>
                                        <span className={`font-semibold ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>{m.min_height}-{m.max_height}cm | {m.min_weight}-{m.max_weight}kg</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CATEGORY MANAGEMENT */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-black">{isRtl ? "مدیریت دسته‌بندی‌های کالا" : "Category Management"}</h3>
                    <p className="text-xs text-neutral-400">
                      {isRtl 
                        ? "دسته‌بندی‌های کالاها را مدیریت کنید و مشخص کنید هر دسته چه نوع فرم راهنمای سایز هوشمند (کفش، بالاتنه، پایین‌تنه یا اکسسوری) را بارگذاری کند." 
                        : "Manage product categories and assign smart size guide types (footwear, tops, bottoms, accessories)."}
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-12">
                    {/* Add Category Form */}
                    <div className={`lg:col-span-5 border rounded-2xl p-6 shadow-xl space-y-4 ${darkMode ? 'bg-neutral-900/40 backdrop-blur-md border-white/10' : 'bg-white border-neutral-200'}`}>
                      <h4 className="text-sm font-extrabold text-sky-400 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>{isRtl ? "ایجاد دسته‌بندی جدید" : "Create New Category"}</span>
                      </h4>

                      <form onSubmit={handleCreateCategory} className="space-y-4">
                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {isRtl ? "نام دسته‌بندی (مثال: کفش ورزشی یا شلوار جین):" : "Category Name (e.g. Sneakers or Denim):"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={isRtl ? "مثال: کفش و کتانی" : "e.g. Footwear"}
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950/80 border border-white/10 text-neutral-200' : 'bg-neutral-50 border border-neutral-200 text-neutral-900'}`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {isRtl ? "نوع ساختار پوشاک (تنظیم فرم راهنمای سایز):" : "Clothing Structure Type (Determines Size Guide Inputs):"}
                          </label>
                          <select
                            value={newCatClothingTypeSlug}
                            onChange={(e) => {
                              const slug = e.target.value as ClothingTypeSlug;
                              setNewCatClothingTypeSlug(slug);
                              if (slug === 'footwear') setNewCatSystemType(5);
                              else if (slug === 'bottoms') setNewCatSystemType(2);
                              else if (slug === 'one_piece') setNewCatSystemType(3);
                              else if (slug === 'accessories') setNewCatSystemType(4);
                              else setNewCatSystemType(1);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950/80 border border-white/10 text-neutral-200' : 'bg-neutral-50 border border-neutral-200 text-neutral-900'}`}
                          >
                            <option value="tops">{isRtl ? "بالاتنه (تیشرت، هودی، پیراهن، کت، کاپشن)" : "Tops (T-Shirts, Hoodies, Shirts, Jackets)"}</option>
                            <option value="bottoms">{isRtl ? "پایین‌تنه (شلوار، شورت، دامن)" : "Bottoms (Pants, Shorts, Skirts)"}</option>
                            <option value="footwear">{isRtl ? "کفش و پاپوش (کتانی، صندل، بوت)" : "Footwear (Sneakers, Boots, Sandals)"}</option>
                            <option value="one_piece">{isRtl ? "سرهمی و پیراهن یکسره (دریس، اورال)" : "One-Piece (Dresses, Jumpsuits)"}</option>
                            <option value="accessories">{isRtl ? "اکسسوری و لوازم جانبی (کیف، کلاه، کمربند)" : "Accessories (Bags, Hats, Belts)"}</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={creatingCategory}
                          className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          {creatingCategory ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>{isRtl ? "ثبت دسته‌بندی جدید" : "Save Category"}</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Existing Categories List */}
                    <div className={`lg:col-span-7 border rounded-2xl p-6 shadow-xl space-y-4 ${darkMode ? 'bg-neutral-900/40 backdrop-blur-md border-white/10' : 'bg-white border-neutral-200'}`}>
                      <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-white/5' : 'border-neutral-200'}`}>
                        <h4 className={`text-xs font-black ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {isRtl ? "دسته‌بندی‌های فعال سیستم" : "Active Categories"}
                        </h4>
                        <span className="text-[10px] bg-sky-500/10 text-sky-400 font-extrabold px-2.5 py-0.5 rounded-full border border-sky-500/20">
                          {categoriesList.length} {isRtl ? "دسته‌بندی" : "Categories"}
                        </span>
                      </div>

                      <div className="grid gap-2.5">
                        {categoriesList.map(cat => (
                          <div key={cat.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${darkMode ? 'bg-neutral-950/50 border-white/5 hover:border-white/10' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                                <Layers className="w-4 h-4" />
                              </div>
                              <div>
                                <p className={`text-xs font-extrabold ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>{isRtl ? (cat.name_fa || cat.name) : cat.name}</p>
                                <span className="text-[9px] font-extrabold text-indigo-400 px-1.5 py-0.2 bg-indigo-500/10 rounded border border-indigo-500/20 inline-block mt-0.5">
                                  {cat.clothing_type_slug === 'footwear' ? (isRtl ? 'کفش و پاپوش' : 'Footwear') :
                                   cat.clothing_type_slug === 'bottoms' ? (isRtl ? 'پایین‌تنه' : 'Bottoms') :
                                   cat.clothing_type_slug === 'one_piece' ? (isRtl ? 'سرهمی' : 'One-Piece') :
                                   cat.clothing_type_slug === 'accessories' ? (isRtl ? 'اکسسوری' : 'Accessories') :
                                   (isRtl ? 'بالاتنه' : 'Tops')}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            {cat.created_by_user && (
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all cursor-pointer"
                                title={isRtl ? "حذف دسته‌بندی" : "Delete category"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

              {/* TAB 2.8: DEDICATED SIZES MANAGEMENT MENU */}
              {activeTab === 'sizes' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-black">{isRtl ? "مدیریت سایزهای فروشگاه" : "Size Catalog Management"}</h3>
                    <p className="text-xs text-neutral-400">
                      {isRtl 
                        ? "سایزهای دلخواه خود (مانند فری‌سایز، ۳۸، ۴۰ و...) را تعریف کنید تا بلافاصله به عنوان ستون در جدول انبار و سبد خرید فعال شوند." 
                        : "Define custom sizes (e.g. Free Size, 38, 40) to instantly render as options in your catalog, variant matrices, and storefront."}
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-12">
                    {/* Size Creator Form Panel */}
                    <div className={`lg:col-span-4 border rounded-2xl p-6 shadow-xl ${darkMode ? 'bg-neutral-900/40 backdrop-blur-md border-white/10' : 'bg-white border-neutral-200'}`}>
                      <h4 className="text-sm font-extrabold text-sky-400 flex items-center gap-2 mb-4">
                        <Plus className="w-4 h-4" />
                        <span>{isRtl ? "افزودن سایز سفارشی" : "Add Custom Size"}</span>
                      </h4>

                      <form onSubmit={handleCreateSize} className="space-y-4">
                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {isRtl ? "عنوان سایز (مثال: Free Size یا ۳۸):" : "Size Name (e.g. Free Size or 38):"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={isRtl ? "مثال: ۴۲" : "e.g. 42"}
                            value={newSizeName}
                            onChange={(e) => setNewSizeName(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950/80 border border-white/10 text-neutral-200' : 'bg-neutral-50 border border-neutral-200 text-neutral-900'}`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {isRtl ? "ترتیب نمایش (عدد کوچک‌تر اول نمایش داده می‌شود):" : "Display Sort Order (lower numbers show first):"}
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={newSizeSortOrder}
                            onChange={(e) => setNewSizeSortOrder(Number(e.target.value))}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-mono text-center focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950/80 border border-white/10 text-neutral-200' : 'bg-neutral-50 border border-neutral-200 text-neutral-900'}`}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={creatingSize}
                          className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/20 transition-all cursor-pointer"
                        >
                          {creatingSize ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>{isRtl ? "ثبت و افزودن سایز" : "Register Size"}</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Sizes Listing Panel */}
                    <div className={`lg:col-span-8 border rounded-2xl p-6 shadow-xl space-y-6 ${darkMode ? 'bg-neutral-900/40 backdrop-blur-md border-white/10' : 'bg-white border-neutral-200'}`}>
                      {/* Merchant Custom Sizes Section */}
                      <div className="space-y-3">
                        <div className={`flex items-center justify-between border-b pb-2 ${darkMode ? 'border-white/5' : 'border-neutral-200'}`}>
                          <h4 className="text-xs font-black text-sky-400">
                            {isRtl ? "سایزهای سفارشی شما" : "Merchant Custom Sizes"}
                          </h4>
                          <span className="text-[10px] bg-sky-500/10 text-sky-400 font-extrabold px-2 py-0.5 rounded-full">
                            {sizes.filter(isMyCustomSize).length} {isRtl ? "مورد" : "items"}
                          </span>
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {sizes.filter(isMyCustomSize).length === 0 ? (
                            <div className={`col-span-full py-8 text-center border rounded-xl italic text-xs ${darkMode ? 'bg-neutral-950/20 border-white/5 text-neutral-500' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                              {isRtl ? "هیچ سایز سفارشی هنوز اضافه نکرده‌اید." : "No custom merchant sizes defined yet."}
                            </div>
                          ) : (
                            sizes
                              .filter(isMyCustomSize)
                              .map(sz => (
                                <div 
                                  key={sz.id} 
                                  className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${darkMode ? 'bg-neutral-950/40 border-white/5 hover:border-sky-500/30' : 'bg-neutral-50 border-neutral-200 hover:border-sky-500/40'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-extrabold text-xs">
                                      {sz.name}
                                    </div>
                                    <div>
                                      <p className={`text-xs font-bold ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>{sz.name}</p>
                                      <p className={`text-[9px] font-mono ${darkMode ? 'text-neutral-500' : 'text-neutral-600'}`}>ID: {sz.id} | {isRtl ? "ترتیب:" : "Sort:"} {sz.sort_order}</p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleDeleteSize(sz.id, sz.name)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${darkMode ? 'bg-neutral-900/80 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 border-white/5' : 'bg-white hover:bg-red-50 text-neutral-400 hover:text-red-600 border-neutral-200'}`}
                                    title={isRtl ? "حذف سایز" : "Delete size"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                          )}
                        </div>
                      </div>

                      {/* System Default Sizes Section */}
                      <div className="space-y-3">
                        <div className={`flex items-center justify-between border-b pb-2 ${darkMode ? 'border-white/5' : 'border-neutral-200'}`}>
                          <h4 className={`text-xs font-black ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {isRtl ? "سایزهای پیش‌فرض و سیستمی (غیرقابل ویرایش)" : "System Default Sizes (Read-Only)"}
                          </h4>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${darkMode ? 'bg-neutral-500/10 text-neutral-400' : 'bg-neutral-200 text-neutral-600'}`}>
                            {sizes.filter(isSystemSize).length} {isRtl ? "مورد" : "items"}
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          {sizes
                            .filter(isSystemSize)
                            .map(sz => (
                              <div 
                                key={sz.id} 
                                className={`flex items-center gap-3 p-2.5 rounded-xl border opacity-70 ${darkMode ? 'bg-neutral-950/10 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}
                              >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-[11px] border ${darkMode ? 'bg-neutral-800 text-neutral-400 border-white/5' : 'bg-neutral-200 text-neutral-700 border-neutral-300'}`}>
                                  {sz.name}
                                </div>
                                <div>
                                  <p className={`text-[11px] font-extrabold ${darkMode ? 'text-neutral-300' : 'text-neutral-800'}`}>{sz.name}</p>
                                  <p className={`text-[8px] font-mono ${darkMode ? 'text-neutral-500' : 'text-neutral-600'}`}>{isRtl ? "ترتیب:" : "Sort:"} {sz.sort_order}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'settings' && (
                <SettingsModal
                  t={t}
                  isRtl={isRtl}
                  darkMode={darkMode}
                  settingsShopName={settingsShopName}
                  setSettingsShopName={setSettingsShopName}
                  settingsShopSlug={settingsShopSlug}
                  setSettingsShopSlug={setSettingsShopSlug}
                  handleSettingsSubmit={handleSettingsSubmit}
                  savingSettings={savingSettings}
                  syncStats={syncStats}
                  syncingCloud={syncingCloud}
                  handleManualSync={handleManualSync}
                  setError={setError}
                  setSuccess={setSuccess}
                  setSyncStats={setSyncStats}
                />
              )}

            </>
          )}

        </div>
      </main>

      {/* QUICK ADD CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
              <h3 className="text-sm font-black text-sky-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>{isRtl ? "افزودن دسته‌بندی جدید" : "Add New Category"}</span>
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className={`p-1 rounded-lg ${darkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {isRtl ? "نام دسته‌بندی (مثال: کفش ورزشی یا شلوار جین):" : "Category Name (e.g. Sneakers or Denim):"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isRtl ? "مثال: کفش و کتانی" : "e.g. Footwear"}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border border-neutral-800 text-neutral-200' : 'bg-neutral-50 border border-neutral-200 text-neutral-900'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {isRtl ? "نوع ساختار پوشاک (تنظیم فرم راهنمای سایز):" : "Clothing Structure Type:"}
                </label>
                <select
                  value={newCatClothingTypeSlug}
                  onChange={(e) => {
                    const slug = e.target.value as ClothingTypeSlug;
                    setNewCatClothingTypeSlug(slug);
                    if (slug === 'footwear') setNewCatSystemType(5);
                    else if (slug === 'bottoms') setNewCatSystemType(2);
                    else if (slug === 'one_piece') setNewCatSystemType(3);
                    else if (slug === 'accessories') setNewCatSystemType(4);
                    else setNewCatSystemType(1);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-neutral-950 border border-neutral-800 text-neutral-200' : 'bg-neutral-50 border border-neutral-200 text-neutral-900'}`}
                >
                  <option value="tops">{isRtl ? "بالاتنه (تیشرت، هودی، پیراهن، کت، کاپشن)" : "Tops (T-Shirts, Hoodies, Shirts, Jackets)"}</option>
                  <option value="bottoms">{isRtl ? "پایین‌تنه (شلوار، شورت، دامن)" : "Bottoms (Pants, Shorts, Skirts)"}</option>
                  <option value="footwear">{isRtl ? "کفش و پاپوش (کتانی، صندل، بوت)" : "Footwear (Sneakers, Boots, Sandals)"}</option>
                  <option value="one_piece">{isRtl ? "سرهمی و پیراهن یکسره (دریس، اورال)" : "One-Piece (Dresses, Jumpsuits)"}</option>
                  <option value="accessories">{isRtl ? "اکسسوری و لوازم جانبی (کیف، کلاه، کمربند)" : "Accessories (Bags, Hats, Belts)"}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl ${darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'}`}
                >
                  {isRtl ? "انصراف" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  {creatingCategory ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{isRtl ? "ثبت و انتخاب" : "Save & Select"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- IMPORT / EXPORT PRODUCTS MODAL --- */}
      {showImportExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-xl p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'}`}>
            <button
              onClick={() => setShowImportExportModal(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
                <FolderUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black">
                  {isRtl ? "ورود و خروجی محصولات (Import & Export)" : "Products Import & Export"}
                </h3>
                <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {isRtl ? "پشتیبان‌گیری از کاتالوگ یا افزودن گروهی کالاها از فایل JSON و CSV" : "Backup catalog or bulk import products from JSON / CSV files."}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* EXPORT SECTION */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                <h4 className="text-xs font-black text-sky-400 mb-2 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  <span>{isRtl ? "۱. خروجی گرفتن از محصولات موجود (Export)" : "1. Export Existing Products"}</span>
                </h4>
                <p className={`text-[11px] mb-3 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {isRtl ? `تعداد ${products.length} محصول در کاتالوگ قرار دارد. یکی از فرمت‌های زیر را برای دانلود انتخاب کنید:` : `${products.length} products available in catalog. Select export format:`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportJSON}
                    disabled={products.length === 0}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <FileJson className="w-4 h-4" />
                    <span>{isRtl ? "خروجی کامل JSON" : "Export JSON"}</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={products.length === 0}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{isRtl ? "خروجی CSV (اکسل)" : "Export CSV (Excel)"}</span>
                  </button>
                </div>
              </div>

              {/* IMPORT SECTION */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                <h4 className="text-xs font-black text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>{isRtl ? "۲. ورود گروهی محصولات از فایل (Import)" : "2. Bulk Import Products"}</span>
                </h4>
                <p className={`text-[11px] mb-3 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {isRtl ? "فایل JSON یا CSV خود شامل مشخصات کالاها را انتخاب کنید تا به صورت خودکار به کاتالوگ اضافه شوند." : "Upload a JSON or CSV file with product details to import into catalog."}
                </p>

                {/* File Upload Box */}
                <input
                  type="file"
                  ref={productImportFileInputRef}
                  accept=".json,.csv"
                  onChange={handleImportFile}
                  className="hidden"
                />

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => productImportFileInputRef.current?.click()}
                    disabled={importingProducts}
                    className={`w-full py-3 px-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      darkMode 
                        ? 'border-neutral-700 hover:border-emerald-500 bg-neutral-900/80 text-neutral-200 hover:text-emerald-400' 
                        : 'border-neutral-300 hover:border-emerald-600 bg-white text-neutral-700 hover:text-emerald-600'
                    }`}
                  >
                    {importingProducts ? (
                      <>
                        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                        <span className="text-xs font-bold">{isRtl ? "در حال پردازش و ثبت محصولات..." : "Importing products..."}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-extrabold">{isRtl ? "انتخاب و آپلود فایل JSON / CSV" : "Choose JSON or CSV File"}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/40 text-[11px]">
                    <span className={darkMode ? 'text-neutral-400' : 'text-neutral-500'}>
                      {isRtl ? "نیاز به نمونه فایل ساختار یافته داری؟" : "Need a template?"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadSampleTemplate('json')}
                        className="text-sky-400 hover:underline font-bold cursor-pointer"
                      >
                        {isRtl ? "دانلود نمونه JSON" : "Sample JSON"}
                      </button>
                      <span className="text-neutral-600">•</span>
                      <button
                        onClick={() => handleDownloadSampleTemplate('csv')}
                        className="text-emerald-400 hover:underline font-bold cursor-pointer"
                      >
                        {isRtl ? "دانلود نمونه CSV" : "Sample CSV"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowImportExportModal(false)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border cursor-pointer ${darkMode ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'}`}
              >
                {isRtl ? "بستن" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
