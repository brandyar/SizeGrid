import React, { useCallback, useMemo } from 'react';
import { Layers, ArrowRightLeft, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Product, Color, Size } from '../../types';
import { MatrixCellState } from '../../store/useDashboardStore';

interface MatrixCellProps {
  colId: number;
  sizeId: number;
  cell: MatrixCellState;
  basePrice: number;
  darkMode: boolean;
  t: Record<string, string>;
  onCellChange: (colId: number, sizeId: number, field: string, value: any) => void;
}

const MatrixCell: React.FC<MatrixCellProps> = React.memo(({
  colId,
  sizeId,
  cell,
  basePrice,
  darkMode,
  t,
  onCellChange,
}) => {
  const isEnabled = !!cell?.enabled;
  const stockVal = cell?.stock ?? 0;
  const priceVal = cell?.price ?? basePrice;
  const skuVal = cell?.sku ?? '';

  const handleToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCellChange(colId, sizeId, 'enabled', e.target.checked);
    },
    [colId, sizeId, onCellChange]
  );

  const handleStockChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCellChange(colId, sizeId, 'stock', e.target.value);
    },
    [colId, sizeId, onCellChange]
  );

  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCellChange(colId, sizeId, 'price', e.target.value);
    },
    [colId, sizeId, onCellChange]
  );

  const handleSkuChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCellChange(colId, sizeId, 'sku', e.target.value);
    },
    [colId, sizeId, onCellChange]
  );

  return (
    <td
      className={`p-3 border-r min-w-[140px] transition-all ${
        darkMode ? 'border-neutral-800' : 'border-neutral-200'
      } ${
        isEnabled
          ? 'bg-sky-500/5'
          : darkMode
          ? 'bg-neutral-950/20 opacity-50'
          : 'bg-neutral-50 opacity-50'
      }`}
    >
      <div className="space-y-2 text-center">
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            className={`rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 ${
              darkMode ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-300 bg-white'
            }`}
          />
          <span
            className={`text-[10px] font-extrabold ${
              isEnabled ? 'text-sky-400' : (darkMode ? 'text-neutral-500' : 'text-neutral-500')
            }`}
          >
            {isEnabled ? (t.in_stock || "موجود در انبار") : (t.out_of_stock || "غیرفعال")}
          </span>
        </label>

        {isEnabled && (
          <div className="space-y-1.5 pt-1">
            <div
              className={`flex items-center gap-1 border rounded-lg px-2 py-1 ${
                darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <span className="text-[9px] text-neutral-500 font-bold shrink-0">{t.stock || "موجودی"}:</span>
              <input
                type="number"
                min="0"
                value={stockVal}
                onChange={handleStockChange}
                className="w-full bg-transparent text-center focus:outline-none text-xs font-black text-sky-400"
              />
            </div>

            <div
              className={`flex items-center gap-1 border rounded-lg px-2 py-1 ${
                darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <span className="text-[9px] text-neutral-500 font-bold shrink-0">تومان:</span>
              <input
                type="number"
                min="0"
                value={priceVal}
                onChange={handlePriceChange}
                className={`w-full bg-transparent text-center focus:outline-none text-[11px] font-bold ${
                  darkMode ? 'text-white' : 'text-neutral-900'
                }`}
                placeholder={basePrice.toString()}
              />
            </div>

            <div
              className={`flex items-center gap-1 border rounded-lg px-2 py-1 ${
                darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <span className="text-[9px] text-neutral-500 font-mono font-bold shrink-0">SKU:</span>
              <input
                type="text"
                value={skuVal}
                onChange={handleSkuChange}
                className="w-full bg-transparent text-center focus:outline-none text-[10px] font-mono font-bold text-amber-400 uppercase placeholder-neutral-600"
                placeholder="کد کالا..."
              />
            </div>
          </div>
        )}
      </div>
    </td>
  );
});

MatrixCell.displayName = 'MatrixCell';

interface ProductMatrixEditorProps {
  product: Product;
  colors: Color[];
  sizes: Size[];
  selectedColorIds: number[];
  selectedSizeIds: number[];
  matrixGridState: Record<string, MatrixCellState>;
  onCellChange: (colId: number, sizeId: number, field: string, value: any) => void;
  onSaveMatrix: () => void;
  savingMatrix: boolean;
  darkMode: boolean;
  isRtl: boolean;
  t: Record<string, string>;
}

export const ProductMatrixEditor: React.FC<ProductMatrixEditorProps> = React.memo(({
  product,
  colors,
  sizes,
  selectedColorIds,
  selectedSizeIds,
  matrixGridState,
  onCellChange,
  onSaveMatrix,
  savingMatrix,
  darkMode,
  isRtl,
  t,
}) => {
  // Safe filtering supporting number & string IDs
  const activeColors = useMemo(() => {
    const selectedColorSet = new Set((selectedColorIds || []).map(String));
    return (colors || []).filter((c) => selectedColorSet.has(String(c.id)));
  }, [colors, selectedColorIds]);

  const activeSizes = useMemo(() => {
    const selectedSizeSet = new Set((selectedSizeIds || []).map(String));
    return (sizes || []).filter((s) => selectedSizeSet.has(String(s.id)));
  }, [sizes, selectedSizeIds]);

  const basePrice = Number(product?.base_price) || 500000;

  // If no colors or sizes selected, show helpful prompt
  if (activeColors.length === 0 || activeSizes.length === 0) {
    return (
      <div className={`p-8 rounded-2xl border text-center space-y-4 ${darkMode ? 'bg-neutral-900/30 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h4 className="text-sm font-black">
            {isRtl ? "هیچ رنگ یا سایزی برای این کالا فعال نشده است" : "No colors or sizes selected"}
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {isRtl
              ? "برای فعال‌سازی و مدیریت موجودی و قیمت هر تنوع، لطفاً ابتدا از تب «اطلاعات پایه»، رنگ‌ها و سایزهای موجود این کالا را تیک بزنید."
              : "Please select at least one active color and size in the General Info tab to generate the stock matrix grid."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header alert / guidance */}
      <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ArrowRightLeft className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-semibold">
            {isRtl
              ? "جدول متقاطع زیر شامل تمام ترکیب‌های رنگ و سایز انتخاب‌شده است. موجودی و قیمت اختصاصی هر تنوع را تنظیم و ذخیره کنید."
              : "Adjust individual stock levels, SKU codes, and prices for each active color-size combination."}
          </span>
        </div>
      </div>

      {/* 2D Grid Representation */}
      <div
        className={`overflow-x-auto rounded-2xl border shadow-sm ${
          darkMode ? 'border-neutral-800 bg-neutral-900/20' : 'border-neutral-200 bg-white'
        }`}
      >
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr
              className={`border-b ${
                darkMode ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
              }`}
            >
              <th
                className={`p-4 border-r font-black text-right min-w-[160px] ${
                  darkMode ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
                }`}
              >
                {t.colors || "رنگ‌ها"} / {t.sizes || "سایزها"}
              </th>
              {activeSizes.map((sz) => (
                <th
                  key={sz.id}
                  className={`p-4 font-black border-r text-sky-400 min-w-[130px] ${
                    darkMode ? 'border-neutral-800' : 'border-neutral-200'
                  }`}
                >
                  <span className="text-sm font-black block">{sz.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeColors.map((col) => (
              <tr
                key={col.id}
                className={`border-b transition-colors ${
                  darkMode
                    ? 'border-neutral-800/80 hover:bg-neutral-900/30'
                    : 'border-neutral-200 hover:bg-neutral-50/80'
                }`}
              >
                <td
                  className={`p-4 border-r text-right font-extrabold flex items-center gap-3 min-w-[160px] ${
                    darkMode ? 'border-neutral-800' : 'border-neutral-200'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-neutral-400 shadow-sm shrink-0"
                    style={{ backgroundColor: col.hex_code }}
                  />
                  <div>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                      {isRtl ? (col.name_fa || col.name_en) : (col.name_en || col.name_fa)}
                    </p>
                    <code className="text-[9px] text-neutral-400 font-mono tracking-wider uppercase">
                      {col.hex_code}
                    </code>
                  </div>
                </td>

                {activeSizes.map((sz) => {
                  const key = `${col.id}-${sz.id}`;
                  const cell = matrixGridState?.[key] || {
                    stock: 0,
                    price: basePrice,
                    sku: '',
                    enabled: false,
                  };

                  return (
                    <MatrixCell
                      key={sz.id}
                      colId={col.id}
                      sizeId={sz.id}
                      cell={cell}
                      basePrice={basePrice}
                      darkMode={darkMode}
                      t={t}
                      onCellChange={onCellChange}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`flex justify-end pt-4 border-t ${
          darkMode ? 'border-neutral-800/40' : 'border-neutral-200'
        }`}
      >
        <button
          onClick={onSaveMatrix}
          disabled={savingMatrix}
          className="px-8 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {savingMatrix ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{isRtl ? "ذخیره موجودی انبار کالا" : "Save Stock Matrix"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});

ProductMatrixEditor.displayName = 'ProductMatrixEditor';

