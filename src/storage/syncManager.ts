import { LocalStorageAdapter } from './localAdapter';
import { SQLiteStorageAdapter } from './sqliteAdapter';
import { DirectusCloudAdapter } from './cloudAdapter';
import { IStorageAdapter, StorageMode, SyncStats, SyncQueueItem, LocalBackupPayload } from './types';
import { Product, Category, Size, Color, SizeGuideTemplate, InventoryItem, ClothingTypeSlug, DiffSyncPayload, Order, CreateOrderInput, OrderStatus } from '../types';
import { DirectusAPI } from '../directus';
import { isDesktopEnv } from '../utils/desktop';
import { APP_VERSION } from '../version';

export class StorageSyncManager implements IStorageAdapter {
  private localAdapter: SQLiteStorageAdapter;
  private cloudAdapter: DirectusCloudAdapter;
  private activeMode: StorageMode = 'local_offline';
  private syncListeners: Array<(stats: SyncStats) => void> = [];
  private syncInProgress: boolean = false;
  private lastError: string | null = null;

  constructor() {
    this.localAdapter = new SQLiteStorageAdapter();
    this.cloudAdapter = new DirectusCloudAdapter();

    // Web browser environment is always cloud_synced; Desktop can be local_offline or cloud_synced
    if (!isDesktopEnv()) {
      this.activeMode = 'cloud_synced';
      this.localAdapter.setMode('cloud_synced');
      this.cloudAdapter.setMode('cloud_synced');
    } else {
      this.activeMode = this.localAdapter.getMode();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.activeMode === 'cloud_synced') {
          this.syncLocalToCloud().catch(() => {});
        } else {
          // In offline/hybrid mode, when online becomes available, keep the local offline database updated
          this.hydrateLocalDatabaseFromCloud().catch(() => {});
          this.notifyListeners();
        }
      });
      window.addEventListener('offline', () => this.notifyListeners());

      // Attempt background initial hydration if online
      if (navigator.onLine) {
        setTimeout(() => {
          this.hydrateLocalDatabaseFromCloud().catch(() => {});
        }, 1500);
      }
    }
  }

  // --- LISTENER REGISTRATION FOR UI BADGES & NOTIFICATIONS ---
  subscribe(listener: (stats: SyncStats) => void): () => void {
    this.syncListeners.push(listener);
    listener(this.getSyncStats());
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const stats = this.getSyncStats();
    this.syncListeners.forEach(listener => listener(stats));
  }

  // --- STORAGE MODE MANAGEMENT & LICENSE GUARDS ---
  getMode(): StorageMode {
    if (!isDesktopEnv()) {
      return 'cloud_synced'; // Web is strictly cloud
    }
    return this.activeMode;
  }

  setMode(mode: StorageMode): void {
    // Web environment: Force cloud_synced
    if (!isDesktopEnv()) {
      this.activeMode = 'cloud_synced';
      this.localAdapter.setMode('cloud_synced');
      this.cloudAdapter.setMode('cloud_synced');
      this.notifyListeners();
      return;
    }

    // Desktop environment: Switching to cloud_synced requires active PRO subscription
    if (mode === 'cloud_synced') {
      const subInfo = DirectusAPI.getSubscriptionInfo();
      if (!subInfo.isPro) {
        this.lastError = 'روشن کردن همگام‌سازی ابری نیازمند اشتراک ویژه (Pro) است.';
        this.notifyListeners();
        throw new Error('روشن کردن همگام‌سازی ابری در نسخه دسکتاپ نیازمند اشتراک ویژه (Pro) است.');
      }
    }

    this.activeMode = mode;
    this.localAdapter.setMode(mode);
    this.cloudAdapter.setMode(mode);

    if (mode === 'cloud_synced') {
      this.syncLocalToCloud().catch(err => console.warn('Sync error on mode switch:', err));
    }
    this.notifyListeners();
  }

  private get activeAdapter(): IStorageAdapter {
    // Web always uses cloud adapter
    if (!isDesktopEnv()) {
      return this.cloudAdapter;
    }

    // If set to cloud_synced on desktop but offline, fallback to localAdapter
    if (this.activeMode === 'cloud_synced' && typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.localAdapter;
    }
    return this.activeMode === 'cloud_synced' ? this.cloudAdapter : this.localAdapter;
  }

  // --- SAFE HYBRID CLOUD TWO-WAY SYNC OPERATION ---
  async syncLocalToCloud(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.syncInProgress) {
      return { success: false, syncedCount: 0, error: 'همگام‌سازی در حال انجام است.' };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, syncedCount: 0, error: 'دستگاه به اینترنت متصل نیست.' };
    }

    // Verify subscription on Desktop
    if (isDesktopEnv()) {
      const subInfo = DirectusAPI.getSubscriptionInfo();
      if (!subInfo.isPro) {
        const msg = 'همگام‌سازی ابری نیازمند فعال بودن اشتراک ویژه (Pro) است.';
        this.lastError = msg;
        this.notifyListeners();
        return { success: false, syncedCount: 0, error: msg };
      }
    }

    this.syncInProgress = true;
    this.lastError = null;
    this.notifyListeners();

    let syncedCount = 0;

    try {
      // 1. Fetch current cloud state and local state safely for all collections
      const [
        cloudProds, localProds,
        cloudCats, localCats,
        cloudSizes, localSizes,
        cloudColors, localColors,
        cloudTpls, localTpls,
        localInventory,
        cloudOrders, localOrders
      ] = await Promise.all([
        this.cloudAdapter.getProducts().catch(() => []),
        this.localAdapter.getProducts().catch(() => []),
        this.cloudAdapter.getCategories().catch(() => []),
        this.localAdapter.getCategories().catch(() => []),
        this.cloudAdapter.getSizes().catch(() => []),
        this.localAdapter.getSizes().catch(() => []),
        this.cloudAdapter.getColors().catch(() => []),
        this.localAdapter.getColors().catch(() => []),
        this.cloudAdapter.getSizeGuideTemplates().catch(() => []),
        this.localAdapter.getSizeGuideTemplates().catch(() => []),
        this.localAdapter.getInventory().catch(() => []),
        this.cloudAdapter.getOrders().catch(() => []),
        this.localAdapter.getOrders().catch(() => [])
      ]);

      // 2. Sync Categories (Local -> Cloud)
      const catIdMap = new Map<number, number>(); // localId -> cloudId
      for (const lc of localCats) {
        const cloudCatMatch = cloudCats.find(cc => 
          (lc.local_uuid && cc.local_uuid === lc.local_uuid) || 
          cc.id === lc.id || 
          cc.name === lc.name || 
          cc.name_fa === lc.name
        );
        if (cloudCatMatch) {
          catIdMap.set(lc.id, cloudCatMatch.id);
        } else {
          try {
            const savedCat = await DirectusAPI.createCategory(lc.name, lc.system_type, lc.clothing_type_slug);
            catIdMap.set(lc.id, savedCat.id);
            syncedCount++;
          } catch (e) {
            console.warn('Failed to push local category to cloud:', e);
          }
        }
      }

      // 3. Sync Sizes (Local -> Cloud)
      const sizeIdMap = new Map<number, number>(); // localId -> cloudId
      for (const ls of localSizes) {
        const cloudSizeMatch = cloudSizes.find(cs => 
          (ls.local_uuid && cs.local_uuid === ls.local_uuid) || 
          cs.id === ls.id || 
          cs.name.toLowerCase() === ls.name.toLowerCase()
        );
        if (cloudSizeMatch) {
          sizeIdMap.set(ls.id, cloudSizeMatch.id);
        } else {
          try {
            const savedSize = await DirectusAPI.createSize(ls.name, ls.sort_order || 10);
            sizeIdMap.set(ls.id, savedSize.id);
            syncedCount++;
          } catch (e) {
            console.warn('Failed to push local size to cloud:', e);
          }
        }
      }

      // 4. Sync Colors (Local -> Cloud)
      const colorIdMap = new Map<number, number>(); // localId -> cloudId
      for (const lcol of localColors) {
        const cloudColorMatch = cloudColors.find(cc => 
          (lcol.local_uuid && cc.local_uuid === lcol.local_uuid) || 
          cc.id === lcol.id || 
          cc.name_fa === lcol.name_fa
        );
        if (cloudColorMatch) {
          colorIdMap.set(lcol.id, cloudColorMatch.id);
        } else {
          try {
            const savedColor = await DirectusAPI.createColor(lcol.name_fa, lcol.name_en || lcol.name_fa, lcol.hex_code);
            colorIdMap.set(lcol.id, savedColor.id);
            syncedCount++;
          } catch (e) {
            console.warn('Failed to push local color to cloud:', e);
          }
        }
      }

      // 5. Sync Size Guide Templates (Local -> Cloud with Timestamp Conflict Resolution)
      const tplIdMap = new Map<number, number>(); // localId -> cloudId
      for (const lt of localTpls) {
        const cloudTplMatch = cloudTpls.find(ct => 
          (lt.local_uuid && ct.local_uuid === lt.local_uuid) || 
          ct.id === lt.id || 
          ct.name === lt.name
        );
        if (cloudTplMatch) {
          tplIdMap.set(lt.id, cloudTplMatch.id);
          const localTime = lt.updated_at ? new Date(lt.updated_at).getTime() : 0;
          const cloudTime = (cloudTplMatch.updated_at || (cloudTplMatch as any).date_updated) ? new Date(cloudTplMatch.updated_at || (cloudTplMatch as any).date_updated).getTime() : 0;

          if (localTime >= cloudTime) {
            try {
              await DirectusAPI.updateSizeGuideTemplate(cloudTplMatch.id, lt.name, lt.measurements || [], lt.clothing_type_slug || 'tops');
              syncedCount++;
            } catch (e) {
              console.warn('Failed to update cloud template:', e);
            }
          }
        } else {
          try {
            const savedTpl = await DirectusAPI.createSizeGuideTemplate(lt.name, lt.measurements || [], lt.clothing_type_slug || 'tops');
            tplIdMap.set(lt.id, savedTpl.id);
            syncedCount++;
          } catch (e) {
            console.warn('Failed to push local template to cloud:', e);
          }
        }
      }

      // 6. Two-Way Sync Products and Inventory Matrix with Timestamp Conflict Resolution
      const prodIdMap = new Map<number, number>(); // localProductId -> cloudProductId

      for (const lp of localProds) {
        const resolvedCatId = lp.category_id ? (catIdMap.get(lp.category_id) || lp.category_id) : undefined;
        const resolvedTplId = lp.size_guide_template_id ? (tplIdMap.get(lp.size_guide_template_id) || lp.size_guide_template_id) : undefined;

        let cloudMatch = cloudProds.find(cp => (lp.local_uuid && cp.local_uuid === lp.local_uuid) || cp.id === lp.id);
        if (!cloudMatch) {
          cloudMatch = cloudProds.find(cp => cp.name_fa === lp.name_fa || (cp.name_en && cp.name_en === lp.name_en));
        }

        let finalCloudProduct: Product | null = null;

        if (cloudMatch) {
          const localTime = lp.updated_at ? new Date(lp.updated_at).getTime() : 0;
          const cloudTime = ((cloudMatch as any).date_updated || cloudMatch.updated_at) ? new Date((cloudMatch as any).date_updated || cloudMatch.updated_at!).getTime() : 0;

          if (localTime >= cloudTime) {
            try {
              finalCloudProduct = await DirectusAPI.updateProduct(cloudMatch.id, {
                ...lp,
                category_id: resolvedCatId,
                size_guide_template_id: resolvedTplId
              });
              syncedCount++;
            } catch (e) {
              finalCloudProduct = cloudMatch;
            }
          } else {
            // Cloud version is newer; retain cloud version
            finalCloudProduct = cloudMatch;
          }
        } else {
          try {
            finalCloudProduct = await DirectusAPI.addProduct({
              name_fa: lp.name_fa,
              name_en: lp.name_en || lp.name_fa,
              description_fa: lp.description_fa,
              description_en: lp.description_en,
              base_price: lp.base_price,
              category: lp.category,
              category_id: resolvedCatId,
              clothing_type_slug: lp.clothing_type_slug,
              image: lp.image,
              size_guide_template_id: resolvedTplId
            });
            syncedCount++;
          } catch (addErr) {
            console.warn('Failed to add product to cloud:', addErr);
          }
        }

        if (finalCloudProduct) {
          prodIdMap.set(lp.id, finalCloudProduct.id);

          // Push local inventory matrix items for this product
          const prodInv = localInventory.filter(inv => inv.product_id === lp.id);
          if (prodInv.length > 0) {
            try {
              const mappedInv = prodInv.map(inv => ({
                ...inv,
                product_id: finalCloudProduct!.id,
                color_id: colorIdMap.get(inv.color_id) || inv.color_id,
                size_id: sizeIdMap.get(inv.size_id) || inv.size_id
              }));
              await DirectusAPI.syncInventory(finalCloudProduct.id, mappedInv);
              syncedCount++;
            } catch (e) {
              console.warn(`Failed to sync inventory for product ${finalCloudProduct.id}:`, e);
            }
          }
        }
      }

      // 7. Sync Orders created locally
      for (const lo of localOrders) {
        const cloudOrderMatch = cloudOrders.find(co => co.id === lo.id);
        if (!cloudOrderMatch && lo.order_items && lo.order_items.length > 0) {
          try {
            await DirectusAPI.createOrder({
              status: lo.status,
              order_total: lo.order_total,
              items: lo.order_items.map(item => ({
                item_inventory: item.item_inventory,
                item_quantity: item.item_quantity,
                item_price: item.item_price
              }))
            });
            syncedCount++;
          } catch (e) {
            console.warn('Failed to push local order to cloud:', e);
          }
        } else if (cloudOrderMatch && cloudOrderMatch.status !== lo.status) {
          try {
            await DirectusAPI.updateOrderStatus(cloudOrderMatch.id, lo.status);
            syncedCount++;
          } catch (e) {
            console.warn('Failed to update cloud order status:', e);
          }
        }
      }

      // 8. Clear pending queue after successful sync
      this.localAdapter.clearPendingSyncQueue();

      // 9. Pull fresh full dataset from Cloud and update local storage cache (Cloud -> Local Two-way sync)
      await this.hydrateLocalDatabaseFromCloud();

      return { success: true, syncedCount };
    } catch (err: any) {
      this.lastError = err?.message || 'خطا در همگام‌سازی با کلود';
      return { success: false, syncedCount, error: this.lastError || undefined };
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Transfers full online cloud database to local offline SQLite and IndexedDB storage
   * Ensures the desktop application has complete offline capabilities with latest data
   */
  async hydrateLocalDatabaseFromCloud(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!navigator.onLine) {
      return { success: false, count: 0, error: 'دستگاه آفلاین است' };
    }

    try {
      const [freshProds, freshCats, freshSizes, freshColors, freshTpls, freshInv, freshOrders] = await Promise.all([
        DirectusAPI.getProducts().catch(() => []),
        DirectusAPI.getCategories().catch(() => []),
        DirectusAPI.getSizes().catch(() => []),
        DirectusAPI.getColors().catch(() => []),
        DirectusAPI.getSizeGuideTemplates().catch(() => []),
        DirectusAPI.getAllInventory().catch(() => []),
        DirectusAPI.getOrders().catch(() => [])
      ]);

      const dataset = {
        products: freshProds,
        categories: freshCats,
        sizes: freshSizes,
        colors: freshColors,
        templates: freshTpls,
        inventory: freshInv,
        orders: freshOrders
      };

      if ((this.localAdapter as any).persistFullCloudDataset) {
        await (this.localAdapter as any).persistFullCloudDataset(dataset);
      } else {
        if (freshProds.length > 0) this.localAdapter.setProductsCache(freshProds);
        if (freshCats.length > 0) this.localAdapter.setCategoriesCache(freshCats);
        if (freshSizes.length > 0) this.localAdapter.setSizesCache(freshSizes);
        if (freshColors.length > 0) this.localAdapter.setColorsCache(freshColors);
        if (freshTpls.length > 0) this.localAdapter.setTemplatesCache(freshTpls);
        if (freshInv.length > 0) this.localAdapter.setInventoryCache(freshInv);
        if (freshOrders.length > 0) this.localAdapter.setOrdersCache(freshOrders);
      }

      const totalItems = freshProds.length + freshCats.length + freshSizes.length + freshColors.length + freshTpls.length + freshInv.length + freshOrders.length;
      localStorage.setItem('tankhor_local_last_sync_time', Date.now().toString());
      this.notifyListeners();

      return { success: true, count: totalItems };
    } catch (err: any) {
      console.warn('[hydrateLocalDatabaseFromCloud] Error hydrating local storage:', err);
      return { success: false, count: 0, error: err?.message };
    }
  }

  // --- DELEGATE STORAGE CALLS TO ACTIVE ADAPTER ---
  async getProducts(): Promise<Product[]> {
    return this.activeAdapter.getProducts();
  }

  async getProductById(id: number): Promise<Product | null> {
    return this.activeAdapter.getProductById(id);
  }

  async saveProduct(product: Partial<Product> & { name_fa: string; base_price: number }): Promise<Product> {
    const saved = await this.activeAdapter.saveProduct(product);
    this.notifyListeners();
    return saved;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const res = await this.activeAdapter.deleteProduct(id);
    this.notifyListeners();
    return res;
  }

  async getCategories(): Promise<Category[]> {
    return this.activeAdapter.getCategories();
  }

  async saveCategory(name: string, systemType: number = 1, clothingTypeSlug: ClothingTypeSlug = 'tops'): Promise<Category> {
    const cat = await this.activeAdapter.saveCategory(name, systemType, clothingTypeSlug);
    this.notifyListeners();
    return cat;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const res = await this.activeAdapter.deleteCategory(id);
    this.notifyListeners();
    return res;
  }

  async getSizes(): Promise<Size[]> {
    return this.activeAdapter.getSizes();
  }

  async saveSize(name: string, sortOrder: number = 10): Promise<Size> {
    const size = await this.activeAdapter.saveSize(name, sortOrder);
    this.notifyListeners();
    return size;
  }

  async deleteSize(id: number): Promise<boolean> {
    const res = await this.activeAdapter.deleteSize(id);
    this.notifyListeners();
    return res;
  }

  async getColors(): Promise<Color[]> {
    return this.activeAdapter.getColors();
  }

  async saveColor(nameFa: string, nameEn: string, hexCode: string): Promise<Color> {
    const color = await this.activeAdapter.saveColor(nameFa, nameEn, hexCode);
    this.notifyListeners();
    return color;
  }

  async getSizeGuideTemplates(): Promise<SizeGuideTemplate[]> {
    return this.activeAdapter.getSizeGuideTemplates();
  }

  async saveSizeGuideTemplate(template: Omit<SizeGuideTemplate, 'id'> & { id?: number }): Promise<SizeGuideTemplate> {
    const res = await this.activeAdapter.saveSizeGuideTemplate(template);
    this.notifyListeners();
    return res;
  }

  async deleteSizeGuideTemplate(id: number): Promise<boolean> {
    const res = await this.activeAdapter.deleteSizeGuideTemplate(id);
    this.notifyListeners();
    return res;
  }

  async getInventory(productId?: number): Promise<InventoryItem[]> {
    return this.activeAdapter.getInventory(productId);
  }

  async updateInventory(items: InventoryItem[]): Promise<boolean> {
    const res = await this.activeAdapter.updateInventory(items);
    this.notifyListeners();
    return res;
  }

  async syncInventoryDiff(productId: number, payload: DiffSyncPayload): Promise<boolean> {
    const res = await this.activeAdapter.syncInventoryDiff(productId, payload);
    this.notifyListeners();
    return res;
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    return this.activeAdapter.getOrders();
  }

  async getOrderById(id: number): Promise<Order | null> {
    return this.activeAdapter.getOrderById(id);
  }

  async createOrder(orderInput: CreateOrderInput): Promise<Order> {
    const order = await this.activeAdapter.createOrder(orderInput);
    this.notifyListeners();
    return order;
  }

  async updateOrderStatus(id: number, status: OrderStatus | string): Promise<boolean> {
    const res = await this.activeAdapter.updateOrderStatus(id, status);
    this.notifyListeners();
    return res;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const res = await this.activeAdapter.deleteOrder(id);
    this.notifyListeners();
    return res;
  }

  getPendingSyncQueue(): SyncQueueItem[] {
    return this.localAdapter.getPendingSyncQueue();
  }

  removeSyncQueueItem(id: string): void {
    this.localAdapter.removeSyncQueueItem(id);
    this.notifyListeners();
  }

  clearPendingSyncQueue(): void {
    this.localAdapter.clearPendingSyncQueue();
    this.notifyListeners();
  }

  getSyncStats(): SyncStats {
    const localStats = this.localAdapter.getSyncStats();
    return {
      mode: this.activeMode,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingCount: localStats.pendingCount,
      lastSyncTime: localStats.lastSyncTime,
      syncInProgress: this.syncInProgress,
      lastError: this.lastError
    };
  }

  // --- LOCAL BACKUP & RESTORE UTILITIES ---
  async exportLocalBackup(): Promise<LocalBackupPayload> {
    const [products, categories, sizes, colors, templates, inventory, orders] = await Promise.all([
      this.localAdapter.getProducts(),
      this.localAdapter.getCategories(),
      this.localAdapter.getSizes(),
      this.localAdapter.getColors(),
      this.localAdapter.getSizeGuideTemplates(),
      this.localAdapter.getInventory(),
      this.localAdapter.getOrders()
    ]);
    const syncQueue = this.localAdapter.getPendingSyncQueue();
    const currentUser = DirectusAPI.getCurrentUser();

    return {
      app: 'Tankhor',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      exportedAt: Date.now(),
      data: {
        products,
        categories,
        sizes,
        colors,
        templates,
        inventory,
        orders,
        syncQueue,
        shopName: currentUser?.shop_name,
        shopSlug: currentUser?.shop_slug
      }
    };
  }

  async importLocalBackup(
    backup: LocalBackupPayload,
    mode: 'overwrite' | 'merge' = 'overwrite'
  ): Promise<{ success: boolean; message: string; counts: { products: number; inventory: number; orders: number } }> {
    if (!backup || !backup.data) {
      throw new Error('فایل پشتیبان نامعتبر است یا ساختار داده‌های آن صحیح نیست.');
    }

    const {
      products = [],
      categories = [],
      sizes = [],
      colors = [],
      templates = [],
      inventory = [],
      orders = [],
      syncQueue = []
    } = backup.data;

    if (mode === 'overwrite') {
      if ((this.localAdapter as any).persistFullCloudDataset) {
        await (this.localAdapter as any).persistFullCloudDataset({
          products,
          categories,
          sizes,
          colors,
          templates,
          inventory,
          orders
        });
      } else {
        this.localAdapter.setProductsCache(products);
        this.localAdapter.setCategoriesCache(categories);
        this.localAdapter.setSizesCache(sizes);
        this.localAdapter.setColorsCache(colors);
        this.localAdapter.setTemplatesCache(templates);
        this.localAdapter.setInventoryCache(inventory);
        this.localAdapter.setOrdersCache(orders);
      }
      if (Array.isArray(syncQueue)) {
        localStorage.setItem('tankhor_local_sync_queue_v1', JSON.stringify(syncQueue));
      }
    } else {
      // Merge mode
      const [
        existingProds,
        existingCats,
        existingSizes,
        existingColors,
        existingTpls,
        existingInv,
        existingOrders
      ] = await Promise.all([
        this.localAdapter.getProducts(),
        this.localAdapter.getCategories(),
        this.localAdapter.getSizes(),
        this.localAdapter.getColors(),
        this.localAdapter.getSizeGuideTemplates(),
        this.localAdapter.getInventory(),
        this.localAdapter.getOrders()
      ]);

      const mergedProds = [...existingProds];
      for (const p of products) {
        if (!mergedProds.some(e => e.id === p.id || (p.local_uuid && e.local_uuid === p.local_uuid))) {
          mergedProds.push(p);
        }
      }

      const mergedCats = [...existingCats];
      for (const c of categories) {
        if (!mergedCats.some(e => e.id === c.id || e.name === c.name)) {
          mergedCats.push(c);
        }
      }

      const mergedSizes = [...existingSizes];
      for (const s of sizes) {
        if (!mergedSizes.some(e => e.id === s.id || e.name === s.name)) {
          mergedSizes.push(s);
        }
      }

      const mergedColors = [...existingColors];
      for (const col of colors) {
        if (!mergedColors.some(e => e.id === col.id || e.name_fa === col.name_fa)) {
          mergedColors.push(col);
        }
      }

      const mergedTpls = [...existingTpls];
      for (const t of templates) {
        if (!mergedTpls.some(e => e.id === t.id || e.name === t.name)) {
          mergedTpls.push(t);
        }
      }

      const mergedInv = [...existingInv];
      for (const inv of inventory) {
        if (!mergedInv.some(e => e.id === inv.id)) {
          mergedInv.push(inv);
        }
      }

      const mergedOrders = [...existingOrders];
      for (const ord of orders) {
        if (!mergedOrders.some(e => e.id === ord.id)) {
          mergedOrders.push(ord);
        }
      }

      if ((this.localAdapter as any).persistFullCloudDataset) {
        await (this.localAdapter as any).persistFullCloudDataset({
          products: mergedProds,
          categories: mergedCats,
          sizes: mergedSizes,
          colors: mergedColors,
          templates: mergedTpls,
          inventory: mergedInv,
          orders: mergedOrders
        });
      } else {
        this.localAdapter.setProductsCache(mergedProds);
        this.localAdapter.setCategoriesCache(mergedCats);
        this.localAdapter.setSizesCache(mergedSizes);
        this.localAdapter.setColorsCache(mergedColors);
        this.localAdapter.setTemplatesCache(mergedTpls);
        this.localAdapter.setInventoryCache(mergedInv);
        this.localAdapter.setOrdersCache(mergedOrders);
      }
    }

    this.notifyListeners();

    return {
      success: true,
      message: 'داده‌های پشتیبان با موفقیت بازگردانی شدند.',
      counts: {
        products: products.length,
        inventory: inventory.length,
        orders: orders.length
      }
    };
  }
}

export const storageManager = new StorageSyncManager();
