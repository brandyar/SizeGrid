import React, { useCallback } from 'react';
import { ArrowRightLeft, Check } from 'lucide-react';
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
        cell.enabled
          ? 'bg-sky-500/5'
          : darkMode
          ? 'bg-neutral-950/10 opacity-60'
          : 'bg-neutral-50 opacity-60'
      }`}
    >
      <div className="space-y-2 text-center">
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={cell.enabled}
            onChange={handleToggle}
            className={`rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 ${
              darkMode ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-300 bg-white'
            }`}
          />
          <span
            className={`text-[10px] font-extrabold ${
              darkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
          >
            {cell.enabled ? t.in_stock : t.out_of_stock}
          </span>
        </label>

        {cell.enabled && (
          <div className="space-y-1">
            <div
              className={`flex items-center gap-1 border rounded-md px-1.5 py-1 ${
                darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <span className="text-[9px] text-neutral-500 shrink-0">{t.stock}:</span>
              <input
                type="number"
                value={cell.stock}
                onChange={handleStockChange}
                className="w-full bg-transparent text-center focus:outline-none text-[11px] font-extrabold text-sky-400"
              />
            </div>

            <div
              className={`flex items-center gap-1 border rounded-md px-1.5 py-1 ${
                darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <span className="text-[9px] text-neutral-500 shrink-0">$</span>
              <input
                type="number"
                value={cell.price}
                onChange={handlePriceChange}
                className={`w-full bg-transparent text-center focus:outline-none text-[11px] font-bold ${
                  darkMode ? 'text-white' : 'text-neutral-900'
                }`}
                placeholder={basePrice.toString()}
              />
            </div>

            <div
              className={`flex items-center gap-1 border rounded-md px-1.5 py-1 ${
                darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <span className="text-[9px] text-neutral-500 shrink-0">SKU:</span>
              <input
                type="text"
                value={cell.sku || ''}
                onChange={handleSkuChange}
                className="w-full bg-transparent text-center focus:outline-none text-[10px] font-mono font-bold text-amber-400 uppercase"
                placeholder="SKU..."
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
  const activeColors = colors.filter((c) => selectedColorIds.includes(c.id));
  const activeSizes = sizes.filter((s) => selectedSizeIds.includes(s.id));

  return (
    <div className="space-y-6">
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2.5">
        <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          {isRtl
            ? "راهنما: جدول متقاطع زیر شامل متغیرهای فعال کالا است. موجودی و قیمت اختصاصی هر رنگ-سایز را در زیر ویرایش کرده و ذخیره کنید."
            : "Adjust individual stock levels and price overrides for each active color-size intersection below."}
        </span>
      </div>

      {/* 2D Grid Representation */}
      <div
        className={`overflow-x-auto rounded-xl border ${
          darkMode ? 'border-neutral-800' : 'border-neutral-200 bg-white'
        }`}
      >
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr
              className={`border-b ${
                darkMode ? 'bg-neutral-950/40 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
              }`}
            >
              <th
                className={`p-4 border-r font-black ${
                  darkMode ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
                }`}
              >
                {t.colors} / {t.sizes}
              </th>
              {activeSizes.map((sz) => (
                <th
                  key={sz.id}
                  className={`p-4 font-black border-r text-sky-400 ${
                    darkMode ? 'border-neutral-800' : 'border-neutral-200'
                  }`}
                >
                  <span className="text-sm font-bold block">{sz.name}</span>
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
                    ? 'border-neutral-800/80 hover:bg-neutral-900/10'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <td
                  className={`p-4 border-r text-right font-extrabold flex items-center gap-3 min-w-[150px] ${
                    darkMode ? 'border-neutral-800' : 'border-neutral-200'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-neutral-400 shrink-0"
                    style={{ backgroundColor: col.hex_code }}
                  />
                  <div>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                      {isRtl ? col.name_fa : col.name_en}
                    </p>
                    <code className="text-[9px] text-neutral-400 font-mono tracking-wider uppercase">
                      {col.hex_code}
                    </code>
                  </div>
                </td>

                {activeSizes.map((sz) => {
                  const key = `${col.id}-${sz.id}`;
                  const cell = matrixGridState[key] || {
                    stock: 0,
                    price: product.base_price,
                    sku: '',
                    enabled: false,
                  };

                  return (
                    <MatrixCell
                      key={sz.id}
                      colId={col.id}
                      sizeId={sz.id}
                      cell={cell}
                      basePrice={product.base_price}
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
          className="px-8 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
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
  );
});

ProductMatrixEditor.displayName = 'ProductMatrixEditor';
