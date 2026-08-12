import React, { useState, useEffect, useRef } from 'react';
import { Product, InventoryItem, Color, Size, Category } from '../types';
import {
  Printer,
  Barcode as BarcodeIcon,
  QrCode,
  Tag,
  Check,
  Search,
  Sliders,
  RotateCcw,
  Plus,
  Minus,
  Grid,
  CheckSquare,
  Square,
  Copy,
  Sparkles,
  Layers,
  Settings2,
  FileSpreadsheet,
  X,
  ExternalLink,
  Eye,
  Store,
  RefreshCw
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BarcodeGeneratorProps {
  products: Product[];
  inventory: InventoryItem[];
  colors: Color[];
  sizes: Size[];
  categories: Category[];
  lang: 'fa' | 'en';
  shopName?: string;
  onUpdateInventorySku?: (updatedItems: InventoryItem[]) => Promise<void>;
}

export function BarcodeSVG({ value, format = 'CODE128', height = 32, fontSize = 10, showText = true }: {
  value: string;
  format?: string;
  height?: number;
  fontSize?: number;
  showText?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: format || 'CODE128',
          width: 1.5,
          height: height,
          displayValue: showText,
          fontSize: fontSize,
          margin: 1,
          font: 'monospace',
          background: 'transparent',
          lineColor: '#000000'
        });
      } catch (e) {
        // Silently catch invalid format chars if any
      }
    }
  }, [value, format, height, fontSize, showText]);

  return <svg ref={svgRef} className="max-w-full mx-auto my-0.5" />;
}

export function QRCodeSVG({ value, size = 55 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (value) {
      QRCode.toDataURL(value, { margin: 1, width: size * 2, color: { dark: '#000000', light: '#ffffff' } })
        .then(url => setDataUrl(url))
        .catch(() => {});
    }
  }, [value, size]);

  if (!dataUrl) return <div style={{ width: size, height: size }} className="bg-gray-100 rounded mx-auto" />;
  return <img src={dataUrl} alt={value} style={{ width: size, height: size }} className="mx-auto object-contain" />;
}

type LabelPreset = '50x30' | '40x30' | '50x25' | '60x40' | 'a4_grid';

interface LabelConfig {
  preset: LabelPreset;
  widthMm: number;
  heightMm: number;
  barcodeType: 'code128' | 'qrcode';
  showStoreName: boolean;
  storeName: string;
  showProductName: boolean;
  showPrice: boolean;
  showColorSize: boolean;
  showSkuText: boolean;
  showFooterNote: boolean;
  footerNote: string;
  fontSize: 'small' | 'medium' | 'large';
  currencyText: string;
}

export function BarcodeGenerator({
  products,
  inventory,
  colors,
  sizes,
  categories,
  lang,
  shopName = 'تن‌خور',
  onUpdateInventorySku
}: BarcodeGeneratorProps) {
  const isRtl = lang === 'fa';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | 'all'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Selection & Quantity State (key: inventory_id -> quantity to print)
  const [printQuantities, setPrintQuantities] = useState<Record<number, number>>({});
  const [editedSkus, setEditedSkus] = useState<Record<number, string>>({});
  const [savingSkus, setSavingSkus] = useState(false);

  // Label Customization Config
  const [config, setConfig] = useState<LabelConfig>({
    preset: '50x30',
    widthMm: 50,
    heightMm: 30,
    barcodeType: 'code128',
    showStoreName: true,
    storeName: shopName || 'تن‌خور',
    showProductName: true,
    showPrice: true,
    showColorSize: true,
    showSkuText: true,
    showFooterNote: false,
    footerNote: 'ضمانت اصالت و کیفیت پوشاک',
    fontSize: 'medium',
    currencyText: 'تومان'
  });

  // Print Mode State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Auto-generate SKUs for inventory items if not already present
  const getEffectiveSku = (item: InventoryItem, prod?: Product, color?: Color, size?: Size): string => {
    if (editedSkus[item.id] !== undefined) {
      return editedSkus[item.id];
    }
    if (item.sku && item.sku.trim().length > 0) {
      return item.sku;
    }
    // Generate default structured SKU: TNK-{prod_id}-{color_id || 0}-{size_id || 0}
    const colorCode = color ? color.name_en.substring(0, 3).toUpperCase() : String(item.color_id);
    const sizeCode = size ? size.name.toUpperCase() : String(item.size_id);
    return `TNK-${item.product_id}-${colorCode}-${sizeCode}`.replace(/[^A-Z0-9-]/gi, '');
  };

  // Preset size selector mapping
  const applyPreset = (preset: LabelPreset) => {
    switch (preset) {
      case '40x30':
        setConfig(prev => ({ ...prev, preset, widthMm: 40, heightMm: 30 }));
        break;
      case '50x25':
        setConfig(prev => ({ ...prev, preset, widthMm: 50, heightMm: 25 }));
        break;
      case '60x40':
        setConfig(prev => ({ ...prev, preset, widthMm: 60, heightMm: 40 }));
        break;
      case 'a4_grid':
        setConfig(prev => ({ ...prev, preset, widthMm: 70, heightMm: 37 }));
        break;
      case '50x30':
      default:
        setConfig(prev => ({ ...prev, preset: '50x30', widthMm: 50, heightMm: 30 }));
        break;
    }
  };

  // Build flattened variant list for table
  const variantList = inventory.map(item => {
    const prod = products.find(p => p.id === item.product_id);
    const color = colors.find(c => c.id === item.color_id);
    const size = sizes.find(s => s.id === item.size_id);
    const category = categories.find(c => c.id === prod?.category_id || c.name === prod?.category);
    const sku = getEffectiveSku(item, prod, color, size);
    return {
      item,
      prod,
      color,
      size,
      category,
      sku
    };
  }).filter(v => Boolean(v.prod));

  // Filtered variants
  const filteredVariants = variantList.filter(v => {
    if (selectedProductId !== 'all' && v.item.product_id !== selectedProductId) return false;
    if (selectedCategoryId !== 'all' && v.prod?.category_id !== selectedCategoryId && v.prod?.category !== String(selectedCategoryId)) return false;
    if (onlyInStock && v.item.stock <= 0) return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = v.prod?.name_fa?.toLowerCase().includes(q) || v.prod?.name_en?.toLowerCase().includes(q);
      const matchColor = v.color?.name_fa?.toLowerCase().includes(q) || v.color?.name_en?.toLowerCase().includes(q);
      const matchSize = v.size?.name?.toLowerCase().includes(q);
      const matchSku = v.sku.toLowerCase().includes(q);
      return matchName || matchColor || matchSize || matchSku;
    }
    return true;
  });

  // Quantity Management Helpers
  const setQuantity = (inventoryId: number, qty: number) => {
    setPrintQuantities(prev => ({
      ...prev,
      [inventoryId]: Math.max(0, qty)
    }));
  };

  const setAllQuantitiesToStock = () => {
    const newQty: Record<number, number> = {};
    filteredVariants.forEach(v => {
      newQty[v.item.id] = Math.max(1, v.item.stock);
    });
    setPrintQuantities(prev => ({ ...prev, ...newQty }));
  };

  const setAllQuantitiesToOne = () => {
    const newQty: Record<number, number> = {};
    filteredVariants.forEach(v => {
      newQty[v.item.id] = 1;
    });
    setPrintQuantities(prev => ({ ...prev, ...newQty }));
  };

  const clearAllQuantities = () => {
    setPrintQuantities({});
  };

  // Selected items list with print count > 0
  const selectedPrintItems = variantList.filter(v => (printQuantities[v.item.id] || 0) > 0);
  const totalLabelsToPrint = selectedPrintItems.reduce((sum, v) => sum + (printQuantities[v.item.id] || 0), 0);

  // Handle saving modified SKUs
  const handleSaveSkus = async () => {
    if (!onUpdateInventorySku) return;
    setSavingSkus(true);
    try {
      const updatedInventory: InventoryItem[] = inventory.map(item => {
        const edited = editedSkus[item.id];
        if (edited !== undefined && edited !== item.sku) {
          return { ...item, sku: edited };
        }
        return item;
      });
      await onUpdateInventorySku(updatedInventory);
    } catch (e) {
      console.error('Error saving SKUs:', e);
    } finally {
      setSavingSkus(false);
    }
  };

  // Helper to format currency
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(isRtl ? 'fa-IR' : 'en-US').format(amount);
  };

  // Print Action
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900/40 via-indigo-900/30 to-purple-900/40 border border-sky-500/20 rounded-2xl p-5 md:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
            <BarcodeIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{isRtl ? "تولید و چاپ لیبل بارکد انبار" : "Barcode & Label Print Center"}</span>
              <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium">
                ویژه پرینتر حرارتی
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {isRtl
                ? "امکان تولید بارکد میله‌ای (Code128) یا QR Code با درج مشخصات کامل محصول، سایز، رنگ و قیمت روی اتیکت حرارتی"
                : "Generate & print custom thermal labels with Code128 barcodes, QR codes, sizes, colors and prices."}
            </p>
          </div>
        </div>

        {/* Top Print Summary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {Object.keys(editedSkus).length > 0 && onUpdateInventorySku && (
            <button
              onClick={handleSaveSkus}
              disabled={savingSkus}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {savingSkus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isRtl ? "ذخیره تغییرات کد SKU" : "Save SKUs"}</span>
            </button>
          )}

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            disabled={totalLabelsToPrint === 0}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
              totalLabelsToPrint > 0
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>
              {isRtl
                ? `پیش‌نمایش و چاپ ${totalLabelsToPrint > 0 ? `(${totalLabelsToPrint} برچسب)` : ''}`
                : `Preview & Print Labels (${totalLabelsToPrint})`}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Variant Selector & SKU Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isRtl ? "جستجوی کالا، سایز، رنگ یا SKU..." : "Search name, size, color or SKU..."}
                  className="w-full pl-3 pr-9 py-2 bg-slate-800/80 border border-slate-700/70 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              {/* Product Filter */}
              <div>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/70 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-all"
                >
                  <option value="all">{isRtl ? "همه محصولات" : "All Products"}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name_fa} ({p.name_en})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategoryId}
                  onChange={e => setSelectedCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/70 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-all"
                >
                  <option value="all">{isRtl ? "همه دسته‌بندی‌ها" : "All Categories"}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name_fa || c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Batch Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={e => setOnlyInStock(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                  />
                  <span>{isRtl ? "فقط کالاهای دارای موجودی" : "Only items in stock"}</span>
                </label>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={setAllQuantitiesToStock}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700/60 font-medium transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3 h-3" />
                  <span>{isRtl ? "انتخاب به تعداد موجودی" : "Set qty to stock"}</span>
                </button>
                <button
                  onClick={setAllQuantitiesToOne}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 font-medium transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>{isRtl ? "انتخاب همه (۱ عدد)" : "Select all (1 label)"}</span>
                </button>
                <button
                  onClick={clearAllQuantities}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700/60 font-medium transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>{isRtl ? "پاکسازی انتخاب‌ها" : "Clear selection"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Variants Table */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                    <th className="p-3 font-semibold">{isRtl ? "نام محصول" : "Product"}</th>
                    <th className="p-3 font-semibold">{isRtl ? "رنگ / سایز" : "Color / Size"}</th>
                    <th className="p-3 font-semibold">{isRtl ? "کد شناسه (SKU)" : "SKU Barcode"}</th>
                    <th className="p-3 font-semibold text-center">{isRtl ? "موجودی" : "Stock"}</th>
                    <th className="p-3 font-semibold text-center">{isRtl ? "تعداد چاپ" : "Labels"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredVariants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <Tag className="w-8 h-8 mx-auto mb-2 opacity-40 text-sky-400" />
                        <p>{isRtl ? "هیچ کالایی مطابق با فیلترها یافت نشد." : "No variants match your filter criteria."}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVariants.map(({ item, prod, color, size, sku }) => {
                      const printQty = printQuantities[item.id] || 0;
                      const isSelected = printQty > 0;
                      const displayPrice = item.price || prod?.base_price || 0;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-sky-500/10 border-l-2 border-sky-500' : ''
                          }`}
                        >
                          {/* Product Info */}
                          <td className="p-3 font-medium">
                            <div className="flex items-center gap-2">
                              {prod?.image && (
                                <img
                                  src={prod.image}
                                  alt={prod.name_fa}
                                  className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-700/50"
                                />
                              )}
                              <div>
                                <div className="text-white font-bold">{prod?.name_fa}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {formatPrice(displayPrice)} {config.currencyText}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Color & Size */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-[11px]">
                                {color?.hex_code && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full inline-block border border-white/20"
                                    style={{ backgroundColor: color.hex_code }}
                                  />
                                )}
                                <span>{color?.name_fa || 'عمومی'}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 text-[11px]">
                                {size?.name || 'فری سایز'}
                              </span>
                            </div>
                          </td>

                          {/* Editable SKU */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={editedSkus[item.id] !== undefined ? editedSkus[item.id] : sku}
                              onChange={e => setEditedSkus(prev => ({ ...prev, [item.id]: e.target.value.toUpperCase() }))}
                              placeholder="SKU Code"
                              className="w-36 px-2.5 py-1 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500 transition-all uppercase"
                            />
                          </td>

                          {/* Stock */}
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                item.stock > 0
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {item.stock}
                            </span>
                          </td>

                          {/* Quantity Controls */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setQuantity(item.id, printQty - 1)}
                                className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="999"
                                value={printQty}
                                onChange={e => setQuantity(item.id, parseInt(e.target.value) || 0)}
                                className="w-12 text-center py-1 bg-slate-950 border border-slate-700 rounded-md text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                              />
                              <button
                                onClick={() => setQuantity(item.id, printQty + 1)}
                                className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Thermal Label Settings & Live Preview */}
        <div className="lg:col-span-4 space-y-4">
          {/* Label Customization Card */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Settings2 className="w-4 h-4 text-sky-400" />
              <span>{isRtl ? "تنظیمات ابعاد و قالب برچسب" : "Label & Thermal Print Options"}</span>
            </h3>

            {/* Paper Size Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isRtl ? "اندازه کاغذ / برچسب حرارتی" : "Thermal Label Paper Size"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '50x30', label: '۵۰ × ۳۰ mm', desc: 'استاندارد اتیکت پوشاک' },
                  { id: '40x30', label: '۴۰ × ۳۰ mm', desc: 'کوچک / زرگری' },
                  { id: '50x25', label: '۵۰ × ۲۵ mm', desc: 'فشرده' },
                  { id: '60x40', label: '۶۰ × ۴۰ mm', desc: 'بزرگ / اتیکت آویز' },
                  { id: 'a4_grid', label: 'برگ A4', desc: 'چاپ شبکه‌ای استیکر' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id as LabelPreset)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      config.preset === p.id
                        ? 'bg-sky-500/20 border-sky-500 text-white shadow-md shadow-sky-500/10'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{p.label}</div>
                    <div className="text-[10px] text-slate-400">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Barcode Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isRtl ? "نوع بارکد" : "Barcode Encoding"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, barcodeType: 'code128' }))}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    config.barcodeType === 'code128'
                      ? 'bg-indigo-500/20 border-indigo-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <BarcodeIcon className="w-4 h-4" />
                  <span>Code 128 (میله‌ای)</span>
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, barcodeType: 'qrcode' }))}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    config.barcodeType === 'qrcode'
                      ? 'bg-indigo-500/20 border-indigo-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR Code (دیجیتال)</span>
                </button>
              </div>
            </div>

            {/* Content Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>{isRtl ? "عنوان فروشگاه / برند" : "Show Shop Name"}</span>
                <input
                  type="checkbox"
                  checked={config.showStoreName}
                  onChange={e => setConfig(p => ({ ...p, showStoreName: e.target.checked }))}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              {config.showStoreName && (
                <input
                  type="text"
                  value={config.storeName}
                  onChange={e => setConfig(p => ({ ...p, storeName: e.target.value }))}
                  placeholder="نام فروشگاه"
                  className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
                />
              )}

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>{isRtl ? "نام محصول" : "Show Product Name"}</span>
                <input
                  type="checkbox"
                  checked={config.showProductName}
                  onChange={e => setConfig(p => ({ ...p, showProductName: e.target.checked }))}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>{isRtl ? "بج سایز و رنگ" : "Show Size & Color Badges"}</span>
                <input
                  type="checkbox"
                  checked={config.showColorSize}
                  onChange={e => setConfig(p => ({ ...p, showColorSize: e.target.checked }))}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>{isRtl ? "قیمت محصول" : "Show Price"}</span>
                <input
                  type="checkbox"
                  checked={config.showPrice}
                  onChange={e => setConfig(p => ({ ...p, showPrice: e.target.checked }))}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>{isRtl ? "متن شناسه SKU زیر بارکد" : "Show SKU Text"}</span>
                <input
                  type="checkbox"
                  checked={config.showSkuText}
                  onChange={e => setConfig(p => ({ ...p, showSkuText: e.target.checked }))}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            {/* Single Item Live Preview Component */}
            <div className="pt-3 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
                <span>{isRtl ? "پیش‌نمایش آنلاین نمونه برچسب" : "Live Sample Preview"}</span>
                <span className="text-[10px] text-sky-400 font-mono">{config.widthMm}x{config.heightMm}mm</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                {/* Simulated Thermal Label Card (White background, Crisp black text) */}
                <div
                  className="bg-white text-black p-2.5 rounded shadow-xl flex flex-col justify-between select-none text-center font-sans border border-gray-300 transition-all"
                  style={{
                    width: `${Math.min(240, config.widthMm * 4.5)}px`,
                    minHeight: `${Math.min(160, config.heightMm * 4.5)}px`
                  }}
                >
                  {config.showStoreName && (
                    <div className="text-[11px] font-black border-b border-black/20 pb-0.5 tracking-tight uppercase">
                      {config.storeName}
                    </div>
                  )}

                  {config.showProductName && (
                    <div className="text-[10px] font-bold mt-1 line-clamp-1 leading-tight">
                      {filteredVariants[0]?.prod?.name_fa || 'پیراهن مردانه تن‌خور'}
                    </div>
                  )}

                  {config.showColorSize && (
                    <div className="flex items-center justify-center gap-1 my-0.5 text-[9px] font-black dir-rtl">
                      <span className="bg-black text-white px-1.5 py-0.2 rounded font-mono">
                        {filteredVariants[0]?.size?.name || 'L'}
                      </span>
                      <span>•</span>
                      <span>{filteredVariants[0]?.color?.name_fa || 'مشکی'}</span>
                    </div>
                  )}

                  {/* Barcode SVG / QR */}
                  <div className="my-1 flex justify-center items-center">
                    {config.barcodeType === 'code128' ? (
                      <BarcodeSVG
                        value={filteredVariants[0]?.sku || 'TNK-101-BLK-L'}
                        height={26}
                        fontSize={9}
                        showText={config.showSkuText}
                      />
                    ) : (
                      <QRCodeSVG value={filteredVariants[0]?.sku || 'TNK-101-BLK-L'} size={45} />
                    )}
                  </div>

                  {config.showPrice && (
                    <div className="text-[11px] font-black border-t border-black/20 pt-0.5">
                      {formatPrice(filteredVariants[0]?.item.price || filteredVariants[0]?.prod?.base_price || 450000)} {config.currencyText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Thermal Printing Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isRtl ? "صفحه آماده‌سازی و پرینت اتیکت‌ها" : "Label Sheet Print Preview"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isRtl
                      ? `آماده چاپ ${totalLabelsToPrint} برچسب با ابعاد ${config.widthMm}×${config.heightMm} میلی‌متر`
                      : `Ready to print ${totalLabelsToPrint} labels (${config.widthMm}x${config.heightMm}mm)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={triggerPrint}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isRtl ? "ارسال به پرینتر حرارتی (Print)" : "Send to Thermal Printer"}</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Printable Canvas Area */}
            <div className="p-6 overflow-y-auto bg-slate-950 flex-1 flex flex-col items-center">
              {/* Print Notice */}
              <div className="mb-4 text-center text-xs text-slate-400 max-w-lg bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                {isRtl
                  ? "💡 راهنما: در پنجره چاپ مرورگر، اندازه کاغذ را روی ابعاد لیبل حرارتی خود (مثلاً 50x30mm) تنظیم کرده و Margin را روی None بگذارید."
                  : "💡 Tip: In print settings, select your thermal paper size (e.g. 50x30mm) and set Margins to None."}
              </div>

              {/* Printable Grid Area with ID for CSS Print target */}
              <div
                id="thermal-print-area"
                className={`bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 ${
                  config.preset === 'a4_grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 gap-3'
                    : 'flex flex-wrap justify-center gap-4'
                }`}
              >
                {selectedPrintItems.flatMap(v => {
                  const qty = printQuantities[v.item.id] || 0;
                  const itemLabels = [];
                  const priceToDisplay = v.item.price || v.prod?.base_price || 0;

                  for (let i = 0; i < qty; i++) {
                    itemLabels.push(
                      <div
                        key={`${v.item.id}-${i}`}
                        className="thermal-label-item bg-white text-black p-2.5 rounded shadow flex flex-col justify-between text-center select-none border border-black/20"
                        style={{
                          width: `${config.widthMm * 3.8}px`,
                          height: `${config.heightMm * 3.8}px`,
                          pageBreakAfter: 'always',
                          breakAfter: 'page'
                        }}
                      >
                        {config.showStoreName && (
                          <div className="text-[11px] font-black border-b border-black/30 pb-0.5 tracking-tight uppercase">
                            {config.storeName}
                          </div>
                        )}

                        {config.showProductName && (
                          <div className="text-[10px] font-extrabold mt-0.5 line-clamp-1 leading-tight">
                            {v.prod?.name_fa}
                          </div>
                        )}

                        {config.showColorSize && (
                          <div className="flex items-center justify-center gap-1.5 my-0.5 text-[9px] font-black">
                            <span className="bg-black text-white px-1.5 py-0.2 rounded font-mono">
                              {v.size?.name}
                            </span>
                            <span>•</span>
                            <span>{v.color?.name_fa}</span>
                          </div>
                        )}

                        {/* Barcode rendering */}
                        <div className="my-0.5 flex justify-center items-center">
                          {config.barcodeType === 'code128' ? (
                            <BarcodeSVG
                              value={v.sku}
                              height={28}
                              fontSize={9}
                              showText={config.showSkuText}
                            />
                          ) : (
                            <QRCodeSVG value={v.sku} size={48} />
                          )}
                        </div>

                        {config.showPrice && (
                          <div className="text-[11px] font-black border-t border-black/30 pt-0.5">
                            {formatPrice(priceToDisplay)} {config.currencyText}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return itemLabels;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Thermal Printing CSS Styles Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-print-area, #thermal-print-area * {
            visibility: visible !important;
          }
          #thermal-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .thermal-label-item {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 4px !important;
            width: ${config.widthMm}mm !important;
            height: ${config.heightMm}mm !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
    </div>
  );
}
