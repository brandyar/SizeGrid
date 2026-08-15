import { User, Product, InventoryItem, Color, Size, SizeGuideTemplate, Category, ClothingType, ClothingTypeSlug, DiffSyncPayload, Order, CreateOrderInput, OrderStatus } from '../types';

export type SyncStatus = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
export type StorageMode = 'local_offline' | 'cloud_synced';
export type EntityType = 'product' | 'category' | 'inventory' | 'size_template' | 'color' | 'size' | 'order';

export interface SyncQueueItem {
  id: string;
  entityType: EntityType;
  entityId: number | string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

export interface SyncStats {
  mode: StorageMode;
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  syncInProgress: boolean;
  lastError: string | null;
}

export interface IStorageAdapter {
  // Initialization & Meta
  getMode(): StorageMode;
  setMode(mode: StorageMode): void;

  // Products
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | null>;
  saveProduct(product: Partial<Product> & { name_fa: string; base_price: number }): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  saveCategory(name: string, systemType?: number, clothingTypeSlug?: ClothingTypeSlug): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;

  // Sizes & Colors
  getSizes(): Promise<Size[]>;
  saveSize(name: string, sortOrder?: number): Promise<Size>;
  deleteSize(id: number): Promise<boolean>;
  getColors(): Promise<Color[]>;
  saveColor(nameFa: string, nameEn: string, hexCode: string): Promise<Color>;

  // Size Guide Templates
  getSizeGuideTemplates(): Promise<SizeGuideTemplate[]>;
  saveSizeGuideTemplate(template: Omit<SizeGuideTemplate, 'id'> & { id?: number }): Promise<SizeGuideTemplate>;
  deleteSizeGuideTemplate(id: number): Promise<boolean>;

  // Inventory
  getInventory(productId?: number): Promise<InventoryItem[]>;
  updateInventory(items: InventoryItem[]): Promise<boolean>;
  syncInventoryDiff(productId: number, payload: DiffSyncPayload): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | null>;
  createOrder(orderInput: CreateOrderInput): Promise<Order>;
  updateOrderStatus(id: number, status: OrderStatus | string): Promise<boolean>;
  deleteOrder(id: number): Promise<boolean>;

  // Sync Operations
  getPendingSyncQueue(): SyncQueueItem[];
  removeSyncQueueItem(id: string): void;
  clearPendingSyncQueue(): void;
  getSyncStats(): SyncStats;
}

export interface LocalBackupPayload {
  app: string;
  version: string;
  timestamp: string;
  exportedAt: number;
  data: {
    products: Product[];
    categories: Category[];
    sizes: Size[];
    colors: Color[];
    templates: SizeGuideTemplate[];
    inventory: InventoryItem[];
    orders: Order[];
    syncQueue: SyncQueueItem[];
    shopName?: string;
    shopSlug?: string;
  };
}

