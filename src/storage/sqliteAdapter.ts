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
   * Initializes local SQLite database and runs structured sequential migrations
   */
  private async initSQLiteDatabase(): Promise<void> {
    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;

      if (typeof invoke === 'function') {
        // 1. Ensure migrations table exists
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL
          );`,
          bindValues: []
        }).catch(() => {});

        // 2. Fetch applied migration versions
        const appliedRows = await invoke('plugin:sql|select', {
          db: this.dbName,
          query: `SELECT version FROM _migrations;`,
          bindValues: []
        }).catch(() => []) as Array<{ version: number }>;

        const appliedVersions = new Set((appliedRows || []).map(r => Number(r.version)));

        // 3. Define migrations
        const migrations = [
          {
            version: 1,
            name: 'initial_core_schema',
            queries: [
              `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                local_uuid TEXT,
                updated_at TEXT,
                name_fa TEXT,
                name_en TEXT,
                description_fa TEXT,
                description_en TEXT,
                category TEXT,
                category_id INTEGER,
                base_price REAL,
                image TEXT,
                clothing_type_slug TEXT,
                size_guide_template_id INTEGER,
                created_by TEXT,
                is_active INTEGER DEFAULT 1
              );`,
              `CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                local_uuid TEXT,
                updated_at TEXT,
                name TEXT,
                system_type INTEGER DEFAULT 1,
                clothing_type_slug TEXT
              );`,
              `CREATE TABLE IF NOT EXISTS sizes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                local_uuid TEXT,
                updated_at TEXT,
                name TEXT,
                sort_order INTEGER DEFAULT 10
              );`,
              `CREATE TABLE IF NOT EXISTS colors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                local_uuid TEXT,
                updated_at TEXT,
                name_fa TEXT,
                name_en TEXT,
                hex_code TEXT
              );`,
              `CREATE TABLE IF NOT EXISTS size_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                local_uuid TEXT,
                updated_at TEXT,
                name TEXT,
                measurements TEXT,
                clothing_type_slug TEXT
              );`,
              `CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                local_uuid TEXT,
                updated_at TEXT,
                product_id INTEGER,
                color_id INTEGER,
                size_id INTEGER,
                stock INTEGER,
                price REAL,
                sku TEXT
              );`,
              `CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                local_uuid TEXT,
                updated_at TEXT,
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
            ]
          },
          {
            version: 2,
            name: 'add_sku_to_inventory',
            queries: [
              `ALTER TABLE inventory ADD COLUMN sku TEXT;`
            ]
          },
          {
            version: 3,
            name: 'add_uuid_and_timestamps',
            queries: [
              `ALTER TABLE products ADD COLUMN local_uuid TEXT;`,
              `ALTER TABLE products ADD COLUMN updated_at TEXT;`,
              `ALTER TABLE categories ADD COLUMN local_uuid TEXT;`,
              `ALTER TABLE categories ADD COLUMN updated_at TEXT;`,
              `ALTER TABLE sizes ADD COLUMN local_uuid TEXT;`,
              `ALTER TABLE sizes ADD COLUMN updated_at TEXT;`,
              `ALTER TABLE colors ADD COLUMN local_uuid TEXT;`,
              `ALTER TABLE colors ADD COLUMN updated_at TEXT;`,
              `ALTER TABLE size_templates ADD COLUMN local_uuid TEXT;`,
              `ALTER TABLE size_templates ADD COLUMN updated_at TEXT;`,
              `ALTER TABLE inventory ADD COLUMN local_uuid TEXT;`,
              `ALTER TABLE inventory ADD COLUMN updated_at TEXT;`,
              `ALTER TABLE orders ADD COLUMN local_uuid TEXT;`,
              `ALTER TABLE orders ADD COLUMN updated_at TEXT;`
            ]
          }
        ];

        // 4. Run pending migrations
        for (const m of migrations) {
          if (!appliedVersions.has(m.version)) {
            for (const q of m.queries) {
              await invoke('plugin:sql|execute', {
                db: this.dbName,
                query: q,
                bindValues: []
              }).catch(() => {});
            }

            await invoke('plugin:sql|execute', {
              db: this.dbName,
              query: `INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?);`,
              bindValues: [m.version, m.name, new Date().toISOString()]
            }).catch(() => {});

            console.log(`[SQLite Migration] Successfully applied migration v${m.version} (${m.name})`);
          }
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

  private async querySql<T>(query: string, bindValues: any[] = []): Promise<T[] | null> {
    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
      if (typeof invoke === 'function') {
        const rows = await invoke('plugin:sql|select', {
          db: this.dbName,
          query,
          bindValues
        });
        if (Array.isArray(rows)) {
          return rows as T[];
        }
      }
    } catch (e) {
      // Ignore fallback silently
    }
    return null;
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
    const rows = await this.querySql<any>('SELECT * FROM products WHERE is_active = 1 OR is_active IS NULL');
    if (rows && rows.length > 0) {
      const products: Product[] = rows.map(r => ({
        id: Number(r.id),
        name_fa: r.name_fa || '',
        name_en: r.name_en || r.name_fa || '',
        description_fa: r.description_fa || '',
        description_en: r.description_en || '',
        category: r.category || '',
        category_id: r.category_id ? Number(r.category_id) : undefined,
        base_price: Number(r.base_price) || 0,
        image: r.image || '',
        clothing_type_slug: (r.clothing_type_slug as ClothingTypeSlug) || 'tops',
        size_guide_template_id: r.size_guide_template_id ? Number(r.size_guide_template_id) : null
      }));
      this.localFallback.setProductsCache(products);
      return products;
    }
    return this.localFallback.getProducts();
  }

  async getProductById(id: number): Promise<Product | null> {
    await this.ensureDbReady();
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  async saveProduct(product: Partial<Product> & { name_fa: string; base_price: number }): Promise<Product> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveProduct(product);

    // Sync save to SQLite if available
    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `INSERT OR REPLACE INTO products (id, name_fa, name_en, description_fa, description_en, category, category_id, base_price, image, clothing_type_slug, size_guide_template_id, created_by, is_active)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          bindValues: [
            saved.id,
            saved.name_fa,
            saved.name_en || saved.name_fa,
            saved.description_fa || '',
            saved.description_en || '',
            saved.category,
            saved.category_id || null,
            saved.base_price,
            saved.image || '',
            saved.clothing_type_slug || 'tops',
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
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `DELETE FROM products WHERE id = ?;`,
          bindValues: [id]
        }).catch(() => {});
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `DELETE FROM inventory WHERE product_id = ?;`,
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
    const rows = await this.querySql<any>('SELECT * FROM categories');
    if (rows && rows.length > 0) {
      const cats: Category[] = rows.map(r => ({
        id: Number(r.id),
        name: r.name || '',
        name_fa: r.name || '',
        system_type: Number(r.system_type) || 1,
        clothing_type_slug: (r.clothing_type_slug as ClothingTypeSlug) || 'tops'
      }));
      this.localFallback.setCategoriesCache(cats);
      return cats;
    }
    return this.localFallback.getCategories();
  }

  async saveCategory(name: string, systemType: number = 1, clothingTypeSlug: ClothingTypeSlug = 'tops'): Promise<Category> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveCategory(name, systemType, clothingTypeSlug);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
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
    const res = await this.localFallback.deleteCategory(id);
    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `DELETE FROM categories WHERE id = ?;`,
          bindValues: [id]
        }).catch(() => {});
      }
    } catch (e) {}
    return res;
  }

  // --- SIZES & COLORS ---
  async getSizes(): Promise<Size[]> {
    await this.ensureDbReady();
    const rows = await this.querySql<any>('SELECT * FROM sizes ORDER BY sort_order ASC');
    if (rows && rows.length > 0) {
      const sizes: Size[] = rows.map(r => ({
        id: Number(r.id),
        name: r.name || '',
        sort_order: Number(r.sort_order) || 10
      }));
      this.localFallback.setSizesCache(sizes);
      return sizes;
    }
    return this.localFallback.getSizes();
  }

  async saveSize(name: string, sortOrder: number = 10): Promise<Size> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveSize(name, sortOrder);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
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
    const res = await this.localFallback.deleteSize(id);
    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `DELETE FROM sizes WHERE id = ?;`,
          bindValues: [id]
        }).catch(() => {});
      }
    } catch (e) {}
    return res;
  }

  async getColors(): Promise<Color[]> {
    await this.ensureDbReady();
    const rows = await this.querySql<any>('SELECT * FROM colors');
    if (rows && rows.length > 0) {
      const colors: Color[] = rows.map(r => ({
        id: Number(r.id),
        name_fa: r.name_fa || '',
        name_en: r.name_en || r.name_fa || '',
        hex_code: r.hex_code || '#000000'
      }));
      this.localFallback.setColorsCache(colors);
      return colors;
    }
    return this.localFallback.getColors();
  }

  async saveColor(nameFa: string, nameEn: string, hexCode: string): Promise<Color> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveColor(nameFa, nameEn, hexCode);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
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
    const rows = await this.querySql<any>('SELECT * FROM size_templates');
    if (rows && rows.length > 0) {
      const templates: SizeGuideTemplate[] = rows.map(r => {
        let measurements = [];
        try {
          measurements = typeof r.measurements === 'string' ? JSON.parse(r.measurements) : (r.measurements || []);
        } catch (e) {}
        return {
          id: Number(r.id),
          name: r.name || '',
          clothing_type_slug: (r.clothing_type_slug as ClothingTypeSlug) || 'tops',
          measurements
        };
      });
      this.localFallback.setTemplatesCache(templates);
      return templates;
    }
    return this.localFallback.getSizeGuideTemplates();
  }

  async saveSizeGuideTemplate(template: Omit<SizeGuideTemplate, 'id'> & { id?: number }): Promise<SizeGuideTemplate> {
    await this.ensureDbReady();
    const saved = await this.localFallback.saveSizeGuideTemplate(template);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
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
    const res = await this.localFallback.deleteSizeGuideTemplate(id);
    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
      if (typeof invoke === 'function') {
        await invoke('plugin:sql|execute', {
          db: this.dbName,
          query: `DELETE FROM size_templates WHERE id = ?;`,
          bindValues: [id]
        }).catch(() => {});
      }
    } catch (e) {}
    return res;
  }

  // --- INVENTORY ---
  async getInventory(productId?: number): Promise<InventoryItem[]> {
    await this.ensureDbReady();
    const query = productId !== undefined 
      ? `SELECT * FROM inventory WHERE product_id = ${productId}` 
      : `SELECT * FROM inventory`;
    const rows = await this.querySql<any>(query);
    if (rows && rows.length > 0) {
      const inventory: InventoryItem[] = rows.map(r => ({
        id: Number(r.id),
        product_id: Number(r.product_id),
        color_id: Number(r.color_id),
        size_id: Number(r.size_id),
        stock: Number(r.stock) || 0,
        price: Number(r.price) || 0,
        sku: r.sku || ''
      }));
      this.localFallback.setInventoryCache(inventory);
      return inventory;
    }
    return this.localFallback.getInventory(productId);
  }

  async updateInventory(items: InventoryItem[]): Promise<boolean> {
    await this.ensureDbReady();
    const result = await this.localFallback.updateInventory(items);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
      if (typeof invoke === 'function') {
        for (const item of items) {
          await invoke('plugin:sql|execute', {
            db: this.dbName,
            query: `INSERT OR REPLACE INTO inventory (id, product_id, color_id, size_id, stock, price, sku) VALUES (?, ?, ?, ?, ?, ?, ?);`,
            bindValues: [item.id || Math.floor(Math.random() * 1000000), item.product_id, item.color_id, item.size_id, item.stock, item.price, item.sku || '']
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
    const rows = await this.querySql<any>('SELECT * FROM orders ORDER BY date_created DESC');
    if (rows && rows.length > 0) {
      const orders: Order[] = rows.map(r => {
        let items = [];
        try {
          items = typeof r.order_items === 'string' ? JSON.parse(r.order_items) : (r.order_items || []);
        } catch (e) {}
        return {
          id: Number(r.id),
          status: (r.status as OrderStatus) || 'published',
          order_total: Number(r.order_total) || 0,
          date_created: r.date_created || new Date().toISOString(),
          order_items: items
        };
      });
      this.localFallback.setOrdersCache(orders);
      return orders;
    }
    return this.localFallback.getOrders();
  }

  async getOrderById(id: number): Promise<Order | null> {
    await this.ensureDbReady();
    const orders = await this.getOrders();
    return orders.find(o => o.id === id) || null;
  }

  async createOrder(orderInput: CreateOrderInput): Promise<Order> {
    await this.ensureDbReady();
    const savedOrder = await this.localFallback.createOrder(orderInput);

    try {
      const tauri = getTauriGlobal();
      const win = typeof window !== 'undefined' ? (window as any) : {};
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
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
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
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
      const invoke = tauri?.core?.invoke || tauri?.invoke || win.__TAURI_INVOKE__ || win.__TAURI__?.invoke;
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
