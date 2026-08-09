import { IStorageAdapter, StorageMode, SyncQueueItem, SyncStats } from './types';
import { LocalStorageAdapter } from './localAdapter';
import { Product, Category, Size, Color, SizeGuideTemplate, InventoryItem, ClothingTypeSlug, DiffSyncPayload, Order, CreateOrderInput, OrderStatus } from '../types';
import { getTauriGlobal, isDesktopEnv } from '../utils/desktop';

/**
 * SQLite Native & Hybrid Storage Adapter for Desktop (Tauri / Windows / Mac / Linux)
 * Securely stores apparel management data, inventory matrix, templates, and orders 
 * in a local SQLite database file (tankhor_desktop.db) with automatic IndexedDB/LocalStorage fallback.
 */
export class SQLiteStorageAdapter implements IStorageAdapter {
  private localFallback: LocalStorageAdapter;
  private dbName: string = 'sqlite:tankhor_desktop.db';
  private dbInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.localFallback = new LocalStorageAdapter();
    if (isDesktopEnv()) {
      this.initPromise = this.initSQLiteDatabase();
    }
  }

  /**
   * Initializes local SQLite tables via Tauri SQL plugin or native IPC bridge
   */
  private async initSQLiteDatabase(): Promise<void> {
    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};

      // Check if Tauri plugin:sql invoke exists
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;

      if (typeof invoke === 'function') {
        const createTablesSql = [
          `CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name_fa TEXT,
            name_en TEXT,
            description_fa TEXT,
            description_en TEXT,
            category TEXT,
            base_price REAL,
            image TEXT,
            size_guide_template_id INTEGER,
            created_by TEXT,
            is_active INTEGER DEFAULT 1
          );`,
          `CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            system_type INTEGER DEFAULT 1,
            clothing_type_slug TEXT
          );`,
          `CREATE TABLE IF NOT EXISTS sizes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            sort_order INTEGER DEFAULT 10
          );`,
          `CREATE TABLE IF NOT EXISTS colors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name_fa TEXT,
            name_en TEXT,
            hex_code TEXT
          );`,
          `CREATE TABLE IF NOT EXISTS size_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            measurements TEXT,
            clothing_type_slug TEXT
          );`,
          `CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            color_id INTEGER,
            size_id INTEGER,
            stock INTEGER,
            price REAL
          );`,
          `CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT,
            order_total REAL,
            date_created TEXT,
            order_items TEXT
          );`,
          `CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            entity_type TEXT,
            entity_id TEXT,
            operation TEXT,
            payload TEXT,
            timestamp INTEGER
          );`
        ];

        for (const query of createTablesSql) {
          await invoke('plugin:sql|execute', {
            db: this.dbName,
            query,
            bindValues: []
          }).catch(() => {});
        }

        this.dbInitialized = true;
      }
    } catch (e) {
      console.warn('SQLite initialization info:', e);
    }
  }

  private async ensureDbReady(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise.catch(() => {});
    }
  }

  // --- META & MODE ---
  getMode(): StorageMode {
    return this.localFallback.getMode();
  }

  setMode(mode: StorageMode): void {
    this.localFallback.setMode(mode);
  }

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    await this.ensureDbReady();
    return this.localFallback.getProducts();
  }

  async getProductById(id: number): Promise<Product | null> {
    await this.ensureDbReady();
    return this.localFallback.getProductById(id);
  }

  async saveProduct(product: Partial<Product> & { name_fa: string; base_price: number }): Promise<Product> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveProduct(product);

    // Sync save to SQLite if available
    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `INSERT OR REPLACE INTO products (id, name_fa, name_en, description_fa, description_en, category, base_price, image, size_guide_template_id, created_by, is_active)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          bindValues: [
            saved.id,
            saved.name_fa,
            saved.name_en || saved.name_fa,
            saved.description_fa || '',
            saved.description_en || '',
            saved.category,
            saved.base_price,
            saved.image || '',
            saved.size_guide_template_id || null,
            saved.created_by || 'local_user',
            1
          ]
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQLite product save failed:', e);
    }

    return saved;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await this.ensureDbReady();
    const result = await this.localFallback.deleteProduct(id);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `DELETE FROM products WHERE id = ?;`,
          bindValues: [id]
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQLite product delete failed:', e);
    }

    return result;
  }

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    await this.ensureDbReady();
    return this.localFallback.getCategories();
  }

  async saveCategory(name: string, systemType: number = 1, clothingTypeSlug: ClothingTypeSlug = 'tops'): Promise<Category> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveCategory(name, systemType, clothingTypeSlug);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `INSERT OR REPLACE INTO categories (id, name, system_type, clothing_type_slug) VALUES (?, ?, ?, ?);`,
          bindValues: [saved.id, saved.name, saved.system_type, saved.clothing_type_slug]
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQLite save category failed:', e);
    }

    return saved;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await this.ensureDbReady();
    return this.localFallback.deleteCategory(id);
  }

  // --- SIZES & COLORS ---
  async getSizes(): Promise<Size[]> {
    await this.ensureDbReady();
    return this.localFallback.getSizes();
  }

  async saveSize(name: string, sortOrder: number = 10): Promise<Size> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveSize(name, sortOrder);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `INSERT OR REPLACE INTO sizes (id, name, sort_order) VALUES (?, ?, ?);`,
          bindValues: [saved.id, saved.name, saved.sort_order]
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQLite save size failed:', e);
    }

    return saved;
  }

  async deleteSize(id: number): Promise<boolean> {
    await this.ensureDbReady();
    return this.localFallback.deleteSize(id);
  }

  async getColors(): Promise<Color[]> {
    await this.ensureDbReady();
    return this.localFallback.getColors();
  }

  async saveColor(nameFa: string, nameEn: string, hexCode: string): Promise<Color> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveColor(nameFa, nameEn, hexCode);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `INSERT OR REPLACE INTO colors (id, name_fa, name_en, hex_code) VALUES (?, ?, ?, ?);`,
          bindValues: [saved.id, saved.name_fa, saved.name_en, saved.hex_code]
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQLite save color failed:', e);
    }

    return saved;
  }

  // --- SIZE GUIDE TEMPLATES ---
  async getSizeGuideTemplates(): Promise<SizeGuideTemplate[]> {
    await this.ensureDbReady();
    return this.localFallback.getSizeGuideTemplates();
  }

  async saveSizeGuideTemplate(template: Omit<SizeGuideTemplate, 'id'> & { id?: number }): Promise<SizeGuideTemplate> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveSizeGuideTemplate(template);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `INSERT OR REPLACE INTO size_templates (id, name, measurements, clothing_type_slug) VALUES (?, ?, ?, ?);`,
          bindValues: [saved.id, saved.name, JSON.stringify(saved.measurements || []), saved.clothing_type_slug || 'tops']
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQLite save template failed:', e);
    }

    return saved;
  }

  async deleteSizeGuideTemplate(id: number): Promise<boolean> {
    await this.ensureDbReady();
    return this.localFallback.deleteSizeGuideTemplate(id);
  }

  // --- INVENTORY ---
  async getInventory(productId?: number): Promise<InventoryItem[]> {
    await this.ensureDbReady();
    return this.localFallback.getInventory(productId);
  }

  async updateInventory(items: InventoryItem[]): Promise<boolean> {
    await this.ensureDbReady();
    const result = await this.localFallback.updateInventory(items);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        for (const item of items) {
          await invoke('plugin:sql|execute', {
            db: this.dbName,
            query: `INSERT OR REPLACE INTO inventory (id, product_id, color_id, size_id, stock, price) VALUES (?, ?, ?, ?, ?, ?);`,
            bindValues: [item.id || Math.floor(Math.random() * 1000000), item.product_id, item.color_id, item.size_id, item.stock, item.price]
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('SQLite inventory update failed:', e);
    }

    return result;
  }

  async syncInventoryDiff(productId: number, payload: DiffSyncPayload): Promise<boolean> {
    await this.ensureDbReady();
    return this.localFallback.syncInventoryDiff(productId, payload);
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    await this.ensureDbReady();
    return this.localFallback.getOrders();
  }

  async getOrderById(id: number): Promise<Order | null> {
    await this.ensureDbReady();
    return this.localFallback.getOrderById(id);
  }

  async createOrder(orderInput: CreateOrderInput): Promise<Order> {
    await this.ensureDbReady();
    const savedOrder = await this.localFallback.createOrder(orderInput);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `INSERT OR REPLACE INTO orders (id, status, order_total, date_created, order_items)
                  VALUES (?, ?, ?, ?, ?);`,
          bindValues: [
            savedOrder.id,
            savedOrder.status,
            savedOrder.order_total,
            savedOrder.date_created || new Date().toISOString(),
            JSON.stringify(savedOrder.order_items || [])
          ]
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQLite order save failed:', e);
    }

    return savedOrder;
  }

  async updateOrderStatus(id: number, status: OrderStatus | string): Promise<boolean> {
    await this.ensureDbReady();
    const result = await this.localFallback.updateOrderStatus(id, status);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `UPDATE orders SET status = ? WHERE id = ?;`,
          bindValues: [status, id]
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQLite order status update failed:', e);
    }

    return result;
  }

  async deleteOrder(id: number): Promise<boolean> {
    await this.ensureDbReady();
    const result = await this.localFallback.deleteOrder(id);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `DELETE FROM orders WHERE id = ?;`,
          bindValues: [id]
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('SQLite order delete failed:', e);
    }

    return result;
  }

  // --- SYNC QUEUE & METRICS ---
  getPendingSyncQueue(): SyncQueueItem[] {
    return this.localFallback.getPendingSyncQueue();
  }

  clearPendingSyncQueue(): void {
    this.localFallback.clearPendingSyncQueue();
  }

  getSyncStats(): SyncStats {
    return this.localFallback.getSyncStats();
  }

  // --- INTERNAL UTILITIES ---
  setProductsCache(products: Product[]): void {
    this.localFallback.setProductsCache(products);
  }
  setCategoriesCache(categories: Category[]): void {
    this.localFallback.setCategoriesCache(categories);
  }
  setSizesCache(sizes: Size[]): void {
    this.localFallback.setSizesCache(sizes);
  }
  setColorsCache(colors: Color[]): void {
    this.localFallback.setColorsCache(colors);
  }
  setTemplatesCache(templates: SizeGuideTemplate[]): void {
    this.localFallback.setTemplatesCache(templates);
  }
  setInventoryCache(inventory: InventoryItem[]): void {
    this.localFallback.setInventoryCache(inventory);
  }
  setOrdersCache(orders: Order[]): void {
    this.localFallback.setOrdersCache(orders);
  }
}
