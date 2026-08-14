import React, { useMemo } from 'react';
import {
  Warehouse,
  Search,
  Barcode as BarcodeIcon,
  FileSpreadsheet,
  FileJson,
  Package,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Product, Color, Size, InventoryItem } from '../../types';

interface WarehouseTableRowProps {
  item: InventoryItem;
  product: Product;
  color?: Color;
  size?: Size;
  localStock: number;
  localPrice: number;
  localSku: string;
  isModified: boolean;
  isUpdating: boolean;
  darkMode: boolean;
  isRtl: boolean;
  onLocalChange: (itemId: number, field: 'stock' | 'price' | 'sku', value: string) => void;
  onQuickSave: (item: InventoryItem) => void;
}

const WarehouseTableRow: React.FC<WarehouseTableRowProps> = React.memo(({
  item,
  product,
  color,
  size,
  localStock,
  localPrice,
  localSku,
  isModified,
  isUpdating,
  darkMode,
  isRtl,
  onLocalChange,
  onQuickSave,
}) => {
  return (
    <tr
      className={`border-b transition-colors ${
        darkMode ? 'border-neutral-800/60 hover:bg-neutral-900/10' : 'border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      {/* Product name & photo */}
      <td className="p-3 text-right">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border ${
              darkMode ? 'bg-neutral-950/20 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            {product.image ? (
              <img src={product.image} alt="Thumbnail" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <Package className="w-4 h-4" />
              </div>
            )}
          </div>
          <div>
            <p className={`font-extrabold ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}`}>
              {isRtl ? (product.name_fa || product.name_en || 'بدون نام') : (product.name_en || product.name_fa || 'Untitled')}
            </p>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded inline-block mt-0.5 font-bold ${
                darkMode ? 'bg-neutral-950/30 text-neutral-400' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {product.category || 'عمومی'}
            </span>
          </div>
        </div>
      </td>

      {/* Color column */}
      <td className="p-3">
        <div
          className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg border text-[10px] font-bold ${
            darkMode
              ? 'bg-neutral-900/30 border-neutral-800 text-neutral-300'
              : 'bg-neutral-50 border-neutral-200 text-neutral-800'
          }`}
        >
          <span
            className="w-3 h-3 rounded-full border border-neutral-400 shadow-sm shrink-0"
            style={{ backgroundColor: color?.hex_code || '#888' }}
          />
          <span>{isRtl ? (color?.name_fa || color?.name_en || 'نامشخص') : (color?.name_en || color?.name_fa || 'Unknown')}</span>
        </div>
      </td>

      {/* Size column */}
      <td className="p-3">
        <span className="px-3 py-1 bg-sky-600/10 text-sky-400 font-extrabold border border-sky-500/20 rounded-lg text-xs">
          {size?.name || '-'}
        </span>
      </td>

      {/* SKU edit inline */}
      <td className="p-3">
        <div className="flex items-center justify-center gap-1.5 max-w-[140px] mx-auto">
          <input
            type="text"
            value={localSku}
            onChange={(e) => onLocalChange(item.id, 'sku', e.target.value)}
            className={`w-28 px-2 py-1 text-center font-mono font-bold text-xs rounded border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
            } ${
              isModified
                ? 'text-amber-400'
                : darkMode
                ? 'text-neutral-300'
                : 'text-neutral-800'
            }`}
            placeholder="SKU..."
          />
        </div>
      </td>

      {/* Stock edit inline */}
      <td className="p-3">
        <div className="flex items-center justify-center gap-1.5 max-w-[120px] mx-auto">
          <input
            type="number"
            value={localStock}
            onChange={(e) => onLocalChange(item.id, 'stock', e.target.value)}
            className={`w-16 px-2 py-1 text-center font-extrabold text-xs rounded border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
            } ${
              isModified
                ? 'text-sky-400'
                : darkMode
                ? 'text-neutral-300'
                : 'text-neutral-800'
            }`}
          />
          <span className={`text-[9px] font-semibold ${darkMode ? 'text-neutral-500' : 'text-neutral-600'}`}>
            {isRtl ? "عدد" : "pcs"}
          </span>
        </div>
      </td>

      {/* Price edit inline */}
      <td className="p-3">
        <div className="flex items-center justify-center gap-1.5 max-w-[160px] mx-auto">
          <input
            type="number"
            value={localPrice}
            onChange={(e) => onLocalChange(item.id, 'price', e.target.value)}
            className={`w-28 px-2 py-1 text-center font-bold text-xs rounded border focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
            } ${
              isModified
                ? 'text-indigo-400'
                : darkMode
                ? 'text-neutral-300'
                : 'text-neutral-800'
            }`}
          />
        </div>
      </td>

      {/* Save action */}
      <td className="p-3">
        <button
          onClick={() => onQuickSave(item)}
          disabled={isUpdating}
          className={`py-1.5 px-3.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 mx-auto ${
            isModified
              ? 'bg-sky-600 hover:bg-sky-500 text-white shadow shadow-sky-600/10 cursor-pointer'
              : darkMode
              ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/40 cursor-not-allowed'
              : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
          }`}
        >
          {isUpdating ? (
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
});

WarehouseTableRow.displayName = 'WarehouseTableRow';

interface WarehouseTableProps {
  products: Product[];
  colors: Color[];
  sizes: Size[];
  inventory: InventoryItem[];
  localStockEdits: Record<number, number>;
  localPriceEdits: Record<number, number>;
  localSkuEdits: Record<number, string>;
  updatingWarehouseId: number | null;
  warehouseSearch: string;
  setWarehouseSearch: (search: string) => void;
  onLocalChange: (itemId: number, field: 'stock' | 'price' | 'sku', value: string) => void;
  onQuickSave: (item: InventoryItem) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onNavigateBarcodes: () => void;
  darkMode: boolean;
  isRtl: boolean;
}

export const WarehouseTable: React.FC<WarehouseTableProps> = React.memo(({
  products,
  colors,
  sizes,
  inventory,
  localStockEdits,
  localPriceEdits,
  localSkuEdits,
  updatingWarehouseId,
  warehouseSearch,
  setWarehouseSearch,
  onLocalChange,
  onQuickSave,
  onExportCSV,
  onExportJSON,
  onNavigateBarcodes,
  darkMode,
  isRtl,
}) => {
  const filteredItems = useMemo(() => {
    if (!warehouseSearch.trim()) return inventory || [];
    const query = warehouseSearch.toLowerCase().trim();
    return (inventory || []).filter((item) => {
      const prod = (products || []).find((p) => String(p.id) === String(item.product_id));
      const col = (colors || []).find((c) => String(c.id) === String(item.color_id));
      const sz = (sizes || []).find((s) => String(s.id) === String(item.size_id));

      const nameMatch = (prod?.name_fa || prod?.name_en || '').toLowerCase().includes(query);
      const colMatch = (col?.name_fa || col?.name_en || '').toLowerCase().includes(query);
      const sizeMatch = (sz?.name || '').toLowerCase().includes(query);
      const skuMatch = (item?.sku || '').toLowerCase().includes(query) || (localSkuEdits?.[item.id] || '').toLowerCase().includes(query);

      return nameMatch || colMatch || sizeMatch || skuMatch;
    });
  }, [inventory, warehouseSearch, products, colors, sizes, localSkuEdits]);

  return (
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

        {/* Actions & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Field */}
          <div className="relative max-w-xs w-full sm:w-auto">
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={warehouseSearch}
              onChange={(e) => setWarehouseSearch(e.target.value)}
              placeholder={isRtl ? "جستجوی کالا..." : "Search warehouse..."}
              className={`w-full pr-10 pl-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
              }`}
            />
          </div>

          {/* Barcode Generator Shortcut Button */}
          <button
            onClick={onNavigateBarcodes}
            className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title={isRtl ? "تولید و چاپ اتیکت و بارکد حرارتی" : "Thermal Barcode Labels"}
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>{isRtl ? "چاپ بارکد انبار" : "Print Barcodes"}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={onExportCSV}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title={isRtl ? "خروجی اکسل / CSV" : "Export CSV"}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isRtl ? "خروجی CSV" : "Export CSV"}</span>
          </button>

          {/* Export JSON Button */}
          <button
            onClick={onExportJSON}
            className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              darkMode
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
            }`}
            title={isRtl ? "خروجی JSON" : "Export JSON"}
          >
            <FileJson className="w-4 h-4 text-sky-400" />
            <span>{isRtl ? "خروجی JSON" : "Export JSON"}</span>
          </button>
        </div>
      </div>

      {/* Table Inventory Grid */}
      {filteredItems.length === 0 ? (
        <div
          className={`text-center py-20 border border-dashed rounded-2xl ${
            darkMode ? 'border-neutral-800 bg-neutral-900/10' : 'border-neutral-200 bg-neutral-50'
          }`}
        >
          <Warehouse className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
          <p className={`text-sm font-bold ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {isRtl ? "هیچ متغیر انبار منطبقی یافت نشد." : "No matching inventory records found."}
          </p>
        </div>
      ) : (
        <div
          className={`overflow-x-auto rounded-2xl border ${
            darkMode ? 'border-neutral-800 bg-neutral-900/10' : 'border-neutral-200 bg-white shadow-sm'
          }`}
        >
          {/* Desktop Table View */}
          <table className="w-full text-xs text-center border-collapse hidden sm:table">
            <thead>
              <tr
                className={`border-b ${
                  darkMode
                    ? 'bg-neutral-950/40 border-neutral-800 text-neutral-400'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                <th className="p-4 text-right font-bold">{isRtl ? "کالای پوشاک" : "Garment Profile"}</th>
                <th className="p-4 font-bold">{isRtl ? "رنگ" : "Color"}</th>
                <th className="p-4 font-bold">{isRtl ? "سایز" : "Size"}</th>
                <th className="p-4 font-bold">{isRtl ? "شناسه SKU" : "SKU"}</th>
                <th className="p-4 font-bold">{isRtl ? "موجودی انبار" : "Stock level"}</th>
                <th className="p-4 font-bold">{isRtl ? "قیمت تنوع (تومان)" : "Override Price"}</th>
                <th className="p-4 font-bold">{isRtl ? "عملیات سریع" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const matchedProd = products.find((p) => String(p.id) === String(item.product_id));
                const matchedCol = colors.find((c) => String(c.id) === String(item.color_id));
                const matchedSize = sizes.find((s) => String(s.id) === String(item.size_id));

                if (!matchedProd) return null;

                const currentLocalStock =
                  localStockEdits[item.id] !== undefined ? localStockEdits[item.id] : item.stock;
                const currentLocalPrice =
                  localPriceEdits[item.id] !== undefined ? localPriceEdits[item.id] : item.price;
                const currentLocalSku =
                  localSkuEdits[item.id] !== undefined ? localSkuEdits[item.id] : item.sku || '';

                const isModified =
                  currentLocalStock !== item.stock ||
                  currentLocalPrice !== item.price ||
                  currentLocalSku !== (item.sku || '');

                return (
                  <WarehouseTableRow
                    key={item.id}
                    item={item}
                    product={matchedProd}
                    color={matchedCol}
                    size={matchedSize}
                    localStock={currentLocalStock}
                    localPrice={currentLocalPrice}
                    localSku={currentLocalSku}
                    isModified={isModified}
                    isUpdating={updatingWarehouseId === item.id}
                    darkMode={darkMode}
                    isRtl={isRtl}
                    onLocalChange={onLocalChange}
                    onQuickSave={onQuickSave}
                  />
                );
              })}
            </tbody>
          </table>

          {/* Responsive Mobile Card View */}
          <div className="sm:hidden divide-y divide-neutral-800 p-2 space-y-4">
            {filteredItems.map((item) => {
              const matchedProd = products.find((p) => String(p.id) === String(item.product_id));
              const matchedCol = colors.find((c) => String(c.id) === String(item.color_id));
              const matchedSize = sizes.find((s) => String(s.id) === String(item.size_id));

              if (!matchedProd) return null;

              const currentLocalStock =
                localStockEdits[item.id] !== undefined ? localStockEdits[item.id] : item.stock;
              const currentLocalPrice =
                localPriceEdits[item.id] !== undefined ? localPriceEdits[item.id] : item.price;
              const currentLocalSku =
                localSkuEdits[item.id] !== undefined ? localSkuEdits[item.id] : item.sku || '';
              const isModified =
                currentLocalStock !== item.stock ||
                currentLocalPrice !== item.price ||
                currentLocalSku !== (item.sku || '');

              return (
                <div key={item.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-950/20 rounded-lg overflow-hidden shrink-0">
                      {matchedProd.image && (
                        <img src={matchedProd.image} alt="Garment" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-neutral-200 truncate">
                        {isRtl ? matchedProd.name_fa : matchedProd.name_en}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-neutral-700 shrink-0"
                          style={{ backgroundColor: matchedCol?.hex_code }}
                        />
                        <span className="text-[10px] text-neutral-400">
                          {isRtl ? matchedCol?.name_fa : matchedCol?.name_en} • سایز {matchedSize?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-neutral-950/20 p-2.5 rounded-xl border border-neutral-800">
                    <div className="space-y-1">
                      <span className="text-[9px] text-neutral-500 font-bold block">
                        {isRtl ? "موجودی انبار" : "Stock"}
                      </span>
                      <input
                        type="number"
                        value={currentLocalStock}
                        onChange={(e) => onLocalChange(item.id, 'stock', e.target.value)}
                        className="w-full px-2 py-1 text-center font-extrabold text-xs rounded border bg-neutral-950 border-neutral-800 text-sky-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-neutral-500 font-bold block">
                        {isRtl ? "قیمت (تومان)" : "Price"}
                      </span>
                      <input
                        type="number"
                        value={currentLocalPrice}
                        onChange={(e) => onLocalChange(item.id, 'price', e.target.value)}
                        className="w-full px-2 py-1 text-center font-bold text-xs rounded border bg-neutral-950 border-neutral-800 text-indigo-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-[9px] text-neutral-500 font-bold block">
                        {isRtl ? "کد شناسه کالا (SKU)" : "SKU"}
                      </span>
                      <input
                        type="text"
                        value={currentLocalSku}
                        onChange={(e) => onLocalChange(item.id, 'sku', e.target.value)}
                        className="w-full px-2 py-1 text-center font-mono font-bold text-xs rounded border bg-neutral-950 border-neutral-800 text-amber-400 focus:outline-none"
                        placeholder="SKU..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onQuickSave(item)}
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
  );
});

WarehouseTable.displayName = 'WarehouseTable';
