import { create } from 'zustand';
import { InventoryItem } from '../types';

export interface MatrixCellState {
  stock: number;
  price: number;
  sku?: string;
  enabled: boolean;
}

interface DashboardState {
  // Warehouse State
  warehouseInventory: InventoryItem[];
  warehouseSearch: string;
  updatingWarehouseId: number | null;
  localStockEdits: Record<number, number>;
  localPriceEdits: Record<number, number>;
  localSkuEdits: Record<number, string>;

  // Matrix State
  matrixGridState: Record<string, MatrixCellState>;

  // Actions
  setWarehouseInventory: (items: InventoryItem[]) => void;
  setWarehouseSearch: (search: string) => void;
  setUpdatingWarehouseId: (id: number | null) => void;
  setWarehouseLocalChange: (itemId: number, field: 'stock' | 'price' | 'sku', value: string) => void;
  clearWarehouseLocalEdit: (itemId: number) => void;
  resetWarehouseLocalEdits: () => void;

  setMatrixGridState: (matrix: Record<string, MatrixCellState> | ((prev: Record<string, MatrixCellState>) => Record<string, MatrixCellState>)) => void;
  updateMatrixCell: (colId: number, sizeId: number, field: keyof MatrixCellState, value: any) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  warehouseInventory: [],
  warehouseSearch: '',
  updatingWarehouseId: null,
  localStockEdits: {},
  localPriceEdits: {},
  localSkuEdits: {},

  matrixGridState: {},

  setWarehouseInventory: (items) => set({ warehouseInventory: items }),
  setWarehouseSearch: (search) => set({ warehouseSearch: search }),
  setUpdatingWarehouseId: (id) => set({ updatingWarehouseId: id }),

  setWarehouseLocalChange: (itemId, field, value) => {
    set((state) => {
      if (field === 'stock') {
        const num = value === '' ? 0 : Number(value);
        return { localStockEdits: { ...state.localStockEdits, [itemId]: num } };
      }
      if (field === 'price') {
        const num = value === '' ? 0 : Number(value);
        return { localPriceEdits: { ...state.localPriceEdits, [itemId]: num } };
      }
      if (field === 'sku') {
        return { localSkuEdits: { ...state.localSkuEdits, [itemId]: value } };
      }
      return state;
    });
  },

  clearWarehouseLocalEdit: (itemId) => {
    set((state) => {
      const newStock = { ...state.localStockEdits };
      const newPrice = { ...state.localPriceEdits };
      const newSku = { ...state.localSkuEdits };
      delete newStock[itemId];
      delete newPrice[itemId];
      delete newSku[itemId];
      return {
        localStockEdits: newStock,
        localPriceEdits: newPrice,
        localSkuEdits: newSku,
      };
    });
  },

  resetWarehouseLocalEdits: () =>
    set({
      localStockEdits: {},
      localPriceEdits: {},
      localSkuEdits: {},
    }),

  setMatrixGridState: (matrix) =>
    set((state) => ({
      matrixGridState: typeof matrix === 'function' ? matrix(state.matrixGridState) : matrix,
    })),

  updateMatrixCell: (colId, sizeId, field, value) => {
    set((state) => {
      const key = `${colId}-${sizeId}`;
      const existing = state.matrixGridState[key] || {
        stock: 0,
        price: 0,
        sku: '',
        enabled: false,
      };

      let updatedValue = value;
      if (field === 'stock' || field === 'price') {
        updatedValue = value === '' ? 0 : Number(value);
      }

      return {
        matrixGridState: {
          ...state.matrixGridState,
          [key]: {
            ...existing,
            [field]: updatedValue,
          },
        },
      };
    });
  },
}));
