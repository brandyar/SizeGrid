import React, { useState, useEffect, useRef } from 'react';
import { locales } from '../locales';
import { DirectusAPI } from '../directus';
import { useRouter } from './Router';
import { Product, InventoryItem, Color, Size, SizeGuideTemplate, SizeGuideTemplateItem, ClothingTypeSlug } from '../types';
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
  List,
  Grid,
  Warehouse,
  CheckCircle2,
  RefreshCw,
  Ruler
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

type ActiveTab = 'products' | 'warehouse' | 'compressor' | 'settings' | 'templates' | 'sizes';
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

  // Matrix Editor State within Edit Form
  const [matrixGridState, setMatrixGridState] = useState<Record<string, { stock: number; price: number; enabled: boolean }>>({});
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

  // Warehouse Search and Quick Update State
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [updatingWarehouseId, setUpdatingWarehouseId] = useState<number | null>(null);
  const [localStockEdits, setLocalStockEdits] = useState<Record<number, number>>({});
  const [localPriceEdits, setLocalPriceEdits] = useState<Record<number, number>>({});

  // Settings Form State
  const [settingsShopName, setSettingsShopName] = useState(currentUser?.shop_name || '');
  const [settingsShopSlug, setSettingsShopSlug] = useState(currentUser?.shop_slug || '');
  const [savingSettings, setSavingSettings] = useState(false);

  // Dynamic categories list
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Products listing UX states
  const [productSearch, setProductSearch] = useState('');
  const [productView, setProductView] = useState<'grid' | 'list'>('grid');

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
        DirectusAPI.getProducts(),
        DirectusAPI.getColors(),
        DirectusAPI.getSizes(),
        DirectusAPI.getAllInventory(),
        DirectusAPI.getSizeGuideTemplates(),
        DirectusAPI.getCategories()
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
      if (prodFormTemplateOption === 'template') {
        if (!prodFormTemplateId) {
          throw new Error(isRtl ? "لطفاً ابتدا قالب مورد نظر را انتخاب کنید." : "Please choose a template first.");
        }
        // Save template ID on product
        await DirectusAPI.updateProduct(isEditingProd.id, {
          size_guide_template_id: Number(prodFormTemplateId)
        });
        
        // Delete product specific size guides to avoid duplicate results
        for (const szId of selectedSizeIds) {
          const existingGuide = sizeGuidesList.find(g => g.size_id === szId);
          if (existingGuide) {
            await DirectusAPI.deleteSizeGuide(existingGuide.id);
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
        const newTpl = await DirectusAPI.createSizeGuideTemplate(newTemplateName, measurements, clothingType);
        
        // Save template ID on product
        await DirectusAPI.updateProduct(isEditingProd.id, {
          size_guide_template_id: newTpl.id
        });

        // Delete any local guides to avoid duplicate results
        for (const szId of selectedSizeIds) {
          const existingGuide = sizeGuidesList.find(g => g.size_id === szId);
          if (existingGuide) {
            await DirectusAPI.deleteSizeGuide(existingGuide.id);
          }
        }

        // Reload templates list
        const tpls = await DirectusAPI.getSizeGuideTemplates();
        setTemplatesList(tpls);

        setSuccess(isRtl ? "قالب سایزبندی جدید ساخته و با موفقیت به کالا تخصیص یافت." : "New sizing template registered and assigned successfully.");
      }
      else {
        // 'custom' overrides
        // 1. Remove size template mapping from product
        await DirectusAPI.updateProduct(isEditingProd.id, {
          size_guide_template_id: null
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
      await DirectusAPI.createSize(newSizeName.trim(), Number(newSizeSortOrder));
      setSuccess(isRtl ? "سایز جدید با موفقیت اضافه شد." : "New custom size added successfully.");
      setNewSizeName('');
      setNewSizeSortOrder(prev => prev + 2);
      // Reload sizes list
      const sizesList = await DirectusAPI.getSizes();
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
      await DirectusAPI.deleteSize(id);
      setSuccess(isRtl ? "سایز با موفقیت حذف شد." : "Custom size deleted successfully.");
      // Reload sizes list
      const sizesList = await DirectusAPI.getSizes();
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
              onClick={() => { setActiveTab('templates'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${activeTab === 'templates' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'}`}
            >
              <Ruler className="w-4 h-4" />
              <span>{isRtl ? "قالب‌های سایزبندی" : "Size Guide Templates"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('sizes'); setIsEditingProd(null); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-3 transition-all ${activeTab === 'sizes' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/15' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'}`}
            >
              <Sliders className="w-4 h-4" />
              <span>{isRtl ? "مدیریت سایزها" : "Size Management"}</span>
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
                {activeTab === 'warehouse' ? (isRtl ? "مدیریت انبار" : "Warehouse") : ''}
                {activeTab === 'templates' ? (isRtl ? "قالب‌های سایزبندی" : "Size Templates") : ''}
                {activeTab === 'sizes' ? (isRtl ? "مدیریت سایزها" : "Size Management") : ''}
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

                      {/* Search & View Toggle Controls */}
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-neutral-900/40 border border-white/10 backdrop-blur-md">
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
                          <span className="text-xs text-neutral-400 font-bold">{isRtl ? "حالت نمایش:" : "View Mode:"}</span>
                          <div className="flex p-0.5 rounded-lg bg-neutral-950 border border-white/10">
                            <button
                              type="button"
                              onClick={() => setProductView('grid')}
                              className={`p-1.5 rounded-md transition-all cursor-pointer ${productView === 'grid' ? 'bg-sky-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
                              title={isRtl ? "نمایش شبکه‌ای" : "Grid View"}
                            >
                              <Grid className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductView('list')}
                              className={`p-1.5 rounded-md transition-all cursor-pointer ${productView === 'list' ? 'bg-sky-600 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
                              title={isRtl ? "نمایش جدولی" : "List/Table View"}
                            >
                              <List className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {products.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
                          <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                          <p className="text-sm font-bold text-neutral-400">{isRtl ? "هیچ محصولی ثبت نشده است." : "No products available."}</p>
                        </div>
                      ) : (
                        <>
                          {productView === 'grid' ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                  <div key={prod.id} className={`rounded-xl border overflow-hidden flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${darkMode ? 'bg-neutral-900/40 border-white/10' : 'bg-white border-neutral-200'}`}>
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
                                        <span className="absolute top-3 left-3 px-2 py-1 bg-sky-600 text-white rounded-lg font-bold text-[9px] shadow-sm">
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
                                        className="col-span-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                                          className="col-span-2 py-1.5 hover:bg-red-500/10 text-red-400 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>{t.delete}</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/40 backdrop-blur-md">
                              <table className="w-full text-right text-xs">
                                <thead className="bg-neutral-950/60 text-neutral-400 font-black border-b border-white/10">
                                  <tr>
                                    <th className="p-4 text-center w-16">{isRtl ? "تصویر" : "Image"}</th>
                                    <th className="p-4">{isRtl ? "نام کالا / جزئیات" : "Product Details"}</th>
                                    <th className="p-4">{isRtl ? "شناسه کالا" : "SKU"}</th>
                                    <th className="p-4">{isRtl ? "دسته‌بندی" : "Category"}</th>
                                    <th className="p-4">{isRtl ? "قیمت پایه" : "Base Price"}</th>
                                    <th className="p-4 text-center w-40">{isRtl ? "عملیات" : "Actions"}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
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
                                      <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-center">
                                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-950/40 border border-white/10 flex items-center justify-center mx-auto">
                                            {prod.image ? (
                                              <img src={prod.image} alt={prod.name_fa} className="w-full h-full object-cover" />
                                            ) : (
                                              <Image className="w-4 h-4 text-neutral-500 opacity-40" />
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-4 font-extrabold text-neutral-200">
                                          <div>
                                            <p>{isRtl ? prod.name_fa : prod.name_en}</p>
                                            <p className="text-[10px] text-neutral-400 line-clamp-1 font-normal mt-0.5">
                                              {isRtl ? prod.description_fa : prod.description_en}
                                            </p>
                                          </div>
                                        </td>
                                        <td className="p-4 font-mono text-[10px] text-neutral-400">
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
                                {categoriesList.map(cat => (
                                  <option key={cat.id} value={cat.name}>
                                    {isRtl ? (cat.name_fa || cat.name) : cat.name}
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

                            <div>
                              <label className="block text-xs font-bold mb-1.5 text-neutral-400">
                                {isRtl ? "تصویر کالا (آپلود فشرده با کانواس)" : "Product Image (Direct Canvas Compress & Upload)"}
                              </label>
                              
                              <div className="space-y-3">
                                {prodFormImage ? (
                                  <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-neutral-950/40 flex items-center justify-center">
                                    <img src={prodFormImage} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-neutral-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all duration-200">
                                      <button
                                        type="button"
                                        onClick={() => setProdFormImage('')}
                                        className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span>{isRtl ? "حذف تصویر" : "Delete Image"}</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 hover:border-sky-500/50 bg-neutral-950/20 hover:bg-sky-500/5 rounded-xl p-6 transition-all cursor-pointer text-center group">
                                    <Upload className="w-8 h-8 text-neutral-500 group-hover:text-sky-400 group-hover:scale-110 transition-all mb-2" />
                                    <span className="text-xs font-extrabold text-neutral-300 group-hover:text-sky-400">
                                      {isRtl ? "انتخاب تصویر برای فشرده‌سازی و آپلود" : "Click to Compress & Upload Image"}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                                      {isRtl ? "تصویر با استفاده از کانواس در مرورگر فشرده و سپس آپلود می‌شود" : "Compressed in-browser via canvas for fast uploads"}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
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
                                            setError(isRtl ? "خطا در آپلود تصویر" : "Error uploading image: " + err.message);
                                          } finally {
                                            setProdFormStatus('idle');
                                          }
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
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
                          {/* Sizing Architecture Choice */}
                          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-4">
                            <div className="text-xs font-bold text-neutral-400">{isRtl ? "۱. تعیین شیوه مدیریت سایزبندی و قوانین هوشمند:" : "1. Sizing Strategy & Intelligent Rules:"}</div>
                            <div className="grid sm:grid-cols-3 gap-3">
                              <button
                                type="button"
                                onClick={() => setProdFormTemplateOption('template')}
                                className={`p-3 rounded-xl border text-center transition-all ${
                                  prodFormTemplateOption === 'template'
                                    ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-extrabold shadow-md'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900/60'
                                }`}
                              >
                                <div className="text-xs font-black">{isRtl ? "استفاده از قالب‌های آماده" : "Select Existing Template"}</div>
                                <div className="text-[10px] opacity-60 mt-0.5">{isRtl ? "انتخاب الگوهای اندازه‌گیری عمومی" : "Assign reusable guidelines"}</div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setProdFormTemplateOption('new_template')}
                                className={`p-3 rounded-xl border text-center transition-all ${
                                  prodFormTemplateOption === 'new_template'
                                    ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-extrabold shadow-md'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900/60'
                                }`}
                              >
                                <div className="text-xs font-black">{isRtl ? "ساخت و تخصیص قالب جدید" : "Create & Assign Template"}</div>
                                <div className="text-[10px] opacity-60 mt-0.5">{isRtl ? "ساخت الگوی عمومی مجدد مصرف" : "Register new reusable preset"}</div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setProdFormTemplateOption('custom')}
                                className={`p-3 rounded-xl border text-center transition-all ${
                                  prodFormTemplateOption === 'custom'
                                    ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-extrabold shadow-md'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900/60'
                                }`}
                              >
                                <div className="text-xs font-black">{isRtl ? "مقادیر اختصاصی محصول" : "Custom rules for item"}</div>
                                <div className="text-[10px] opacity-60 mt-0.5">{isRtl ? "تنظیم قوانین جداگانه مستقل" : "Configure direct boundaries"}</div>
                              </button>
                            </div>

                            {prodFormTemplateOption === 'template' && (
                              <div className="space-y-3 pt-2">
                                <label className="block text-xs font-bold text-neutral-300">{isRtl ? "الگوی سایزبندی آماده را انتخاب کنید:" : "Choose a template profile:"}</label>
                                <select
                                  value={prodFormTemplateId || ''}
                                  onChange={(e) => setProdFormTemplateId(e.target.value)}
                                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                  <option value="">{isRtl ? "-- انتخاب قالب --" : "-- Choose Sizing Template --"}</option>
                                  {templatesList.map(tpl => (
                                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                                  ))}
                                </select>

                                {prodFormTemplateId && (
                                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
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
                                            <div key={idx} className="flex items-center justify-between text-[11px] p-2 bg-neutral-900 rounded-lg border border-neutral-800/60">
                                              <span className="font-bold text-sky-400 bg-sky-600/10 px-2.5 py-0.5 rounded-md border border-sky-500/15">{sizeName}</span>
                                              <span className="text-neutral-300 font-extrabold">
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
                              <div className="space-y-3 pt-2 border-t border-neutral-800/40">
                                <label className="block text-xs font-bold text-neutral-300">{isRtl ? "نام قالب سایزبندی جدید عمومی:" : "New Sizing Template Profile Name:"}</label>
                                <input
                                  type="text"
                                  placeholder={isRtl ? "مثلا: استاندارد تی‌شرت لش" : "e.g., Standard Oversized Tees"}
                                  value={newTemplateName}
                                  onChange={(e) => setNewTemplateName(e.target.value)}
                                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                                            <div className="flex-1 grid grid-cols-1 gap-4">
                                              <div className="grid sm:grid-cols-3 gap-6">
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

                                              {/* Precise clothing / footwear body-part measurements based on category */}
                                              {(() => {
                                                const prodType = getClothingTypeFromCategory(prodFormCategory, categoriesList);
                                                if (prodType === 'footwear') {
                                                  return (
                                                    <div className="border-t border-white/5 pt-3 mt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                                            className="w-1/2 px-2 py-1 bg-neutral-950 border border-sky-500/30 rounded text-center text-xs text-sky-400 font-extrabold focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">{isRtl ? "تا" : "to"}</span>
                                                          <input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Max"
                                                            value={cell.max_foot_length ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_foot_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-2 py-1 bg-neutral-950 border border-sky-500/30 rounded text-center text-xs text-sky-400 font-extrabold focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                }

                                                if (prodType === 'accessories') {
                                                  return (
                                                    <div className="border-t border-white/5 pt-3 mt-1 text-neutral-500 text-[10px] italic">
                                                      {isRtl ? "اکسسوری‌ها تک‌سایز یا فری‌سایز هستند و نیازی به ابعاد دقیق بدنی ندارند." : "Accessories do not require specific body dimensions."}
                                                    </div>
                                                  );
                                                }

                                                return (
                                                  <div className="border-t border-white/5 pt-3 mt-1 grid grid-cols-2 md:grid-cols-6 gap-3">
                                                    {/* Chest (Tops, One-Piece) */}
                                                    {(prodType === 'tops' || prodType === 'one_piece') && (
                                                      <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "دور سینه:" : "Chest:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_chest ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_chest', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_chest ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_chest', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Waist (Bottoms, One-Piece) */}
                                                    {(prodType === 'bottoms' || prodType === 'one_piece') && (
                                                      <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "دور کمر:" : "Waist:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_waist ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_waist', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_waist ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_waist', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Hip (Bottoms, One-Piece) */}
                                                    {(prodType === 'bottoms' || prodType === 'one_piece') && (
                                                      <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "دور باسن:" : "Hips:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_hip ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_hip', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_hip ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_hip', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Shoulder (Tops) */}
                                                    {prodType === 'tops' && (
                                                      <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "سرشانه:" : "Shoulder:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_shoulder ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_shoulder', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_shoulder ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_shoulder', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Sleeve (Tops) */}
                                                    {prodType === 'tops' && (
                                                      <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? "قد آستین:" : "Sleeve:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_sleeve ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_sleeve', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_sleeve ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_sleeve', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Length (Tops, Bottoms, One-Piece) */}
                                                    {(prodType === 'tops' || prodType === 'bottoms' || prodType === 'one_piece') && (
                                                      <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-neutral-400 block">{isRtl ? (prodType === 'bottoms' ? "قد شلوار:" : "قد لباس:") : "Length:"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={cell.min_length ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'min_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
                                                          />
                                                          <span className="text-neutral-500 text-[10px]">-</span>
                                                          <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={cell.max_length ?? ''}
                                                            onChange={(e) => handleSizeGuideCellChange(sz.id, 'max_length', null, e.target.value ? Number(e.target.value) : undefined)}
                                                            className="w-1/2 px-1 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-center text-xs text-sky-400 font-extrabold"
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
                    <div className="p-6 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-6">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
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
                          className="p-1 text-neutral-400 hover:text-neutral-200"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-neutral-400 mb-1">{isRtl ? "نام قالب (مثلا: هودی لش قواره بزرگ)" : "Template Name:"}</label>
                            <input
                              type="text"
                              required
                              placeholder={isRtl ? "نام توصیفی قالب" : "Descriptive template name"}
                              value={templateFormName}
                              onChange={(e) => setTemplateFormName(e.target.value)}
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-neutral-400 mb-1">{isRtl ? "نوع پوشاک / دسته‌بندی اصلی:" : "Clothing Type / Main Category:"}</label>
                            <select
                              value={templateFormClothingType}
                              onChange={(e) => setTemplateFormClothingType(e.target.value as any)}
                              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-extrabold"
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
                                await DirectusAPI.createSizeGuideTemplate(templateFormName, list, templateFormClothingType);
                                setSuccess(isRtl ? "قالب با موفقیت ایجاد شد." : "Template registered successfully.");
                              } else {
                                await DirectusAPI.updateSizeGuideTemplate(editingTemplate.id, templateFormName, list, templateFormClothingType);
                                setSuccess(isRtl ? "تغییرات قالب با موفقیت ذخیره شد." : "Template specs saved successfully.");
                              }

                              const res = await DirectusAPI.getSizeGuideTemplates();
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
                        <div className="col-span-full p-12 text-center bg-neutral-900/10 border border-neutral-800 rounded-2xl italic text-xs text-neutral-500 font-extrabold">
                          {isRtl ? "هیچ قالب سایزبندی تعریف نشده است. برای تخصیص آسان به پوشاک، اولین قالب را همین حالا بسازید!" : "No reusable templates registered yet. Create one to assign specs in bulk!"}
                        </div>
                      ) : (
                        templatesList.map(tpl => (
                          <div key={tpl.id} className="p-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex flex-col justify-between gap-4">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-xs font-black text-neutral-200">{tpl.name}</h4>
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
                                    className="p-1.5 bg-neutral-800/60 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-sky-400 transition-all"
                                    title={isRtl ? "ویرایش قالب" : "Edit template"}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(isRtl ? `آیا از حذف قالب "${tpl.name}" اطمینان دارید؟ کالاها به تنظیمات اندازه اختصاصی تغییر وضعیت خواهند داد.` : `Delete template "${tpl.name}"? linked products will fall back to direct specs.`)) {
                                        try {
                                          await DirectusAPI.deleteSizeGuideTemplate(tpl.id);
                                          const list = await DirectusAPI.getSizeGuideTemplates();
                                          setTemplatesList(list);
                                          setSuccess(isRtl ? "قالب سایزبندی حذف شد." : "Template deleted successfully.");
                                        } catch (err) {
                                          setError(isRtl ? "خطا در حذف قالب." : "Error removing template.");
                                        }
                                      }
                                    }}
                                    className="p-1.5 bg-neutral-800/60 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400 transition-all"
                                    title={isRtl ? "حذف قالب" : "Delete template"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="text-[10px] font-bold text-neutral-500">{isRtl ? "قوانین فعال سایزها:" : "Active Size Rules:"}</div>
                                <div className="grid gap-1">
                                  {tpl.measurements?.map((m, idx) => {
                                    const szName = sizes.find(s => s.id === m.size_id)?.name || `ID: ${m.size_id}`;
                                    return (
                                      <div key={idx} className="flex items-center justify-between text-[10px] px-2 py-1 bg-neutral-950 rounded border border-neutral-800/40">
                                        <span className="font-extrabold text-sky-400">{szName}</span>
                                        <span className="text-neutral-400 font-semibold">{m.min_height}-{m.max_height}cm | {m.min_weight}-{m.max_weight}kg</span>
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
                    <div className="lg:col-span-4 bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                      <h4 className="text-sm font-extrabold text-sky-400 flex items-center gap-2 mb-4">
                        <Plus className="w-4 h-4" />
                        <span>{isRtl ? "افزودن سایز سفارشی" : "Add Custom Size"}</span>
                      </h4>

                      <form onSubmit={handleCreateSize} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                            {isRtl ? "عنوان سایز (مثال: Free Size یا ۳۸):" : "Size Name (e.g. Free Size or 38):"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={isRtl ? "مثال: ۴۲" : "e.g. 42"}
                            value={newSizeName}
                            onChange={(e) => setNewSizeName(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-950/80 border border-white/10 rounded-xl text-xs text-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                            {isRtl ? "ترتیب نمایش (عدد کوچک‌تر اول نمایش داده می‌شود):" : "Display Sort Order (lower numbers show first):"}
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={newSizeSortOrder}
                            onChange={(e) => setNewSizeSortOrder(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-neutral-950/80 border border-white/10 rounded-xl text-xs text-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-center"
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
                    <div className="lg:col-span-8 bg-neutral-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                      {/* Merchant Custom Sizes Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h4 className="text-xs font-black text-sky-400">
                            {isRtl ? "سایزهای سفارشی شما" : "Merchant Custom Sizes"}
                          </h4>
                          <span className="text-[10px] bg-sky-500/10 text-sky-400 font-extrabold px-2 py-0.5 rounded-full">
                            {sizes.filter(isMyCustomSize).length} {isRtl ? "مورد" : "items"}
                          </span>
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {sizes.filter(isMyCustomSize).length === 0 ? (
                            <div className="col-span-full py-8 text-center bg-neutral-950/20 border border-white/5 rounded-xl italic text-xs text-neutral-500">
                              {isRtl ? "هیچ سایز سفارشی هنوز اضافه نکرده‌اید." : "No custom merchant sizes defined yet."}
                            </div>
                          ) : (
                            sizes
                              .filter(isMyCustomSize)
                              .map(sz => (
                                <div 
                                  key={sz.id} 
                                  className="flex items-center justify-between p-3 bg-neutral-950/40 border border-white/5 hover:border-sky-500/30 rounded-xl transition-all group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-extrabold text-xs">
                                      {sz.name}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-neutral-200">{sz.name}</p>
                                      <p className="text-[9px] text-neutral-500 font-mono">ID: {sz.id} | {isRtl ? "ترتیب:" : "Sort:"} {sz.sort_order}</p>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleDeleteSize(sz.id, sz.name)}
                                    className="p-1.5 bg-neutral-900/80 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded-lg border border-white/5 opacity-80 hover:opacity-100 transition-all cursor-pointer"
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
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h4 className="text-xs font-black text-neutral-400">
                            {isRtl ? "سایزهای پیش‌فرض و سیستمی (غیرقابل ویرایش)" : "System Default Sizes (Read-Only)"}
                          </h4>
                          <span className="text-[10px] bg-neutral-500/10 text-neutral-400 font-extrabold px-2 py-0.5 rounded-full">
                            {sizes.filter(isSystemSize).length} {isRtl ? "مورد" : "items"}
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          {sizes
                            .filter(isSystemSize)
                            .map(sz => (
                              <div 
                                key={sz.id} 
                                className="flex items-center gap-3 p-2.5 bg-neutral-950/10 border border-white/5 rounded-xl opacity-60"
                              >
                                <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-400 flex items-center justify-center font-extrabold text-[11px] border border-white/5">
                                  {sz.name}
                                </div>
                                <div>
                                  <p className="text-[11px] font-extrabold text-neutral-300">{sz.name}</p>
                                  <p className="text-[8px] text-neutral-500 font-mono">{isRtl ? "ترتیب:" : "Sort:"} {sz.sort_order}</p>
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
