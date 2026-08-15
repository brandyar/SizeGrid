import { Product, Category, Size, Color, SizeGuideTemplate, InventoryItem, ClothingTypeSlug, DiffSyncPayload, Order, CreateOrderInput, OrderStatus } from '../types';
import { DirectusAPI } from '../directus';
import { LocalStorageAdapter } from './localAdapter';
import { IStorageAdapter, StorageMode, SyncQueueItem, SyncStats } from './types';

export class DirectusCloudAdapter implements IStorageAdapter {
  private mode: StorageMode = 'cloud_synced';
  private localFallback: LocalStorageAdapter;

  constructor() {
    this.localFallback = new LocalStorageAdapter();
  }

  getMode(): StorageMode {
    return this.mode;
  }

  setMode(mode: StorageMode): void {
    this.mode = mode;
  }

  async getProducts(): Promise<Product[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.getProducts();
      }
      const products = await DirectusAPI.getProducts();
      this.localFallback.setProductsCache(products);
      return products;
    } catch (e) {
      console.warn("DirectusCloudAdapter.getProducts network error, falling back to local storage:", e);
      return await this.localFallback.getProducts();
    }
  }

  async getProductById(id: number): Promise<Product | null> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.getProductById(id);
      }
      const products = await DirectusAPI.getProducts();
      this.localFallback.setProductsCache(products);
      return products.find(p => p.id === id) || null;
    } catch (e) {
      console.warn("DirectusCloudAdapter.getProductById network error:", e);
      return await this.localFallback.getProductById(id);
    }
  }

  async saveProduct(product: Partial<Product> & { name_fa: string; base_price: number }): Promise<Product> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.saveProduct(product);
      }
      let saved: Product;
      if (product.id) {
        try {
          saved = await DirectusAPI.updateProduct(product.id, product);
        } catch (err) {
          console.warn("Directus updateProduct failed (possibly local product ID), attempting addProduct:", err);
          saved = await DirectusAPI.addProduct(product as any);
        }
      } else {
        saved = await DirectusAPI.addProduct(product as any);
      }
      const localProducts = await this.localFallback.getProducts();
      const idx = localProducts.findIndex(p => p.id === saved.id || (product.id && p.id === product.id));
      if (idx !== -1) {
        localProducts[idx] = saved;
      } else {
        localProducts.push(saved);
      }
      this.localFallback.setProductsCache(localProducts);
      return saved;
    } catch (e) {
      console.warn("DirectusCloudAdapter.saveProduct network error, saving to local sync queue:", e);
      return await this.localFallback.saveProduct(product);
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.deleteProduct(id);
      }
      await DirectusAPI.deleteProduct(id);
      const localProducts = await this.localFallback.getProducts();
      this.localFallback.setProductsCache(localProducts.filter(p => p.id !== id));
      return true;
    } catch (e) {
      console.warn("DirectusCloudAdapter.deleteProduct network error, queueing local delete:", e);
      return await this.localFallback.deleteProduct(id);
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.getCategories();
      }
      const cats = await DirectusAPI.getCategories();
      this.localFallback.setCategoriesCache(cats);
      return cats;
    } catch (e) {
      console.warn("DirectusCloudAdapter.getCategories network error:", e);
      return await this.localFallback.getCategories();
    }
  }

  async saveCategory(name: string, systemType: number = 1, clothingTypeSlug: ClothingTypeSlug = 'tops'): Promise<Category> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.saveCategory(name, systemType, clothingTypeSlug);
      }
      const created = await DirectusAPI.createCategory(name, systemType, clothingTypeSlug);
      const localCats = await this.localFallback.getCategories();
      localCats.push(created);
      this.localFallback.setCategoriesCache(localCats);
      return created;
    } catch (e) {
      console.warn("DirectusCloudAdapter.saveCategory network error:", e);
      return await this.localFallback.saveCategory(name, systemType, clothingTypeSlug);
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.deleteCategory(id);
      }
      await DirectusAPI.deleteCategory(id);
      const localCats = await this.localFallback.getCategories();
      this.localFallback.setCategoriesCache(localCats.filter(c => c.id !== id));
      return true;
    } catch (e) {
      console.warn("DirectusCloudAdapter.deleteCategory network error:", e);
      return await this.localFallback.deleteCategory(id);
    }
  }

  async getSizes(): Promise<Size[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.getSizes();
      }
      const sizes = await DirectusAPI.getSizes();
      this.localFallback.setSizesCache(sizes);
      return sizes;
    } catch (e) {
      console.warn("DirectusCloudAdapter.getSizes network error:", e);
      return await this.localFallback.getSizes();
    }
  }

  async saveSize(name: string, sortOrder: number = 10): Promise<Size> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.saveSize(name, sortOrder);
      }
      const created = await DirectusAPI.createSize(name, sortOrder);
      const localSizes = await this.localFallback.getSizes();
      localSizes.push(created);
      this.localFallback.setSizesCache(localSizes);
      return created;
    } catch (e) {
      console.warn("DirectusCloudAdapter.saveSize network error:", e);
      return await this.localFallback.saveSize(name, sortOrder);
    }
  }

  async deleteSize(id: number): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.deleteSize(id);
      }
      await DirectusAPI.deleteSize(id);
      const localSizes = await this.localFallback.getSizes();
      this.localFallback.setSizesCache(localSizes.filter(s => s.id !== id));
      return true;
    } catch (e) {
      console.warn("DirectusCloudAdapter.deleteSize network error:", e);
      return await this.localFallback.deleteSize(id);
    }
  }

  async getColors(): Promise<Color[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.getColors();
      }
      const colors = await DirectusAPI.getColors();
      this.localFallback.setColorsCache(colors);
      return colors;
    } catch (e) {
      console.warn("DirectusCloudAdapter.getColors network error:", e);
      return await this.localFallback.getColors();
    }
  }

  async saveColor(nameFa: string, nameEn: string, hexCode: string): Promise<Color> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.saveColor(nameFa, nameEn, hexCode);
      }
      const created = await DirectusAPI.createColor(nameFa, nameEn, hexCode);
      const localColors = await this.localFallback.getColors();
      if (!localColors.find(c => c.id === created.id)) {
        localColors.push(created);
        this.localFallback.setColorsCache(localColors);
      }
      return created;
    } catch (e) {
      console.warn("DirectusCloudAdapter.saveColor network error:", e);
      return await this.localFallback.saveColor(nameFa, nameEn, hexCode);
    }
  }

  async getSizeGuideTemplates(): Promise<SizeGuideTemplate[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.getSizeGuideTemplates();
      }
      const tpls = await DirectusAPI.getSizeGuideTemplates();
      this.localFallback.setTemplatesCache(tpls);
      return tpls;
    } catch (e) {
      console.warn("DirectusCloudAdapter.getSizeGuideTemplates network error:", e);
      return await this.localFallback.getSizeGuideTemplates();
    }
  }

  async saveSizeGuideTemplate(template: Omit<SizeGuideTemplate, 'id'> & { id?: number }): Promise<SizeGuideTemplate> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.saveSizeGuideTemplate(template);
      }
      let saved: SizeGuideTemplate;
      if (template.id) {
        try {
          saved = await DirectusAPI.updateSizeGuideTemplate(template.id, template.name, template.measurements || [], template.clothing_type_slug || 'tops');
        } catch (err) {
          console.warn("Directus updateSizeGuideTemplate failed, attempting createSizeGuideTemplate:", err);
          saved = await DirectusAPI.createSizeGuideTemplate(template.name, template.measurements || [], template.clothing_type_slug || 'tops');
        }
      } else {
        saved = await DirectusAPI.createSizeGuideTemplate(template.name, template.measurements || [], template.clothing_type_slug || 'tops');
      }
      const localTpls = await this.localFallback.getSizeGuideTemplates();
      const idx = localTpls.findIndex(t => t.id === saved.id || (template.id && t.id === template.id));
      if (idx !== -1) localTpls[idx] = saved;
      else localTpls.push(saved);
      this.localFallback.setTemplatesCache(localTpls);
      return saved;
    } catch (e) {
      console.warn("DirectusCloudAdapter.saveSizeGuideTemplate network error:", e);
      return await this.localFallback.saveSizeGuideTemplate(template);
    }
  }

  async deleteSizeGuideTemplate(id: number): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.deleteSizeGuideTemplate(id);
      }
      await DirectusAPI.deleteSizeGuideTemplate(id);
      const localTpls = await this.localFallback.getSizeGuideTemplates();
      this.localFallback.setTemplatesCache(localTpls.filter(t => t.id !== id));
      return true;
    } catch (e) {
      console.warn("DirectusCloudAdapter.deleteSizeGuideTemplate network error:", e);
      return await this.localFallback.deleteSizeGuideTemplate(id);
    }
  }

  async getInventory(productId?: number): Promise<InventoryItem[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.getInventory(productId);
      }
      if (productId !== undefined) {
        return await DirectusAPI.getInventoryForProduct(productId);
      }
      const inv = await DirectusAPI.getAllInventory();
      this.localFallback.setInventoryCache(inv);
      return inv;
    } catch (e) {
      console.warn("DirectusCloudAdapter.getInventory network error:", e);
      return await this.localFallback.getInventory(productId);
    }
  }

  async updateInventory(items: InventoryItem[]): Promise<boolean> {
    try {
      if (items.length === 0) return true;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.updateInventory(items);
      }
      const productId = items[0].product_id;
      await DirectusAPI.syncInventory(productId, items);
      const fullInv = await DirectusAPI.getAllInventory();
      this.localFallback.setInventoryCache(fullInv);
      return true;
    } catch (e) {
      console.warn("DirectusCloudAdapter.updateInventory network error:", e);
      return await this.localFallback.updateInventory(items);
    }
  }

  async syncInventoryDiff(productId: number, payload: DiffSyncPayload): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.syncInventoryDiff(productId, payload);
      }
      const current = await DirectusAPI.getInventoryForProduct(productId);
      let updated = [...current];

      if (payload.delete && payload.delete.length > 0) {
        updated = updated.filter(i => !payload.delete.includes(i.id));
      }
      if (payload.update && payload.update.length > 0) {
        for (const u of payload.update) {
          const idx = updated.findIndex(i => i.id === u.id);
          if (idx !== -1) updated[idx] = { ...updated[idx], ...u };
        }
      }
      if (payload.create && payload.create.length > 0) {
        for (const c of payload.create) {
          updated.push({
            id: 0,
            product_id: productId,
            color_id: c.color_id,
            size_id: c.size_id,
            stock: c.stock || 0,
            price: c.price || 0
          });
        }
      }

      await DirectusAPI.syncInventory(productId, updated);
      const fullInv = await DirectusAPI.getAllInventory();
      this.localFallback.setInventoryCache(fullInv);
      return true;
    } catch (e) {
      console.warn("DirectusCloudAdapter.syncInventoryDiff network error:", e);
      return await this.localFallback.syncInventoryDiff(productId, payload);
    }
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.getOrders();
      }
      const orders = await DirectusAPI.getOrders();
      return orders;
    } catch (e) {
      console.warn("DirectusCloudAdapter.getOrders network error, falling back to local:", e);
      return await this.localFallback.getOrders();
    }
  }

  async getOrderById(id: number): Promise<Order | null> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.getOrderById(id);
      }
      return await DirectusAPI.getOrderById(id);
    } catch (e) {
      console.warn("DirectusCloudAdapter.getOrderById network error:", e);
      return await this.localFallback.getOrderById(id);
    }
  }

  async createOrder(orderInput: CreateOrderInput): Promise<Order> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.createOrder(orderInput);
      }
      const created = await DirectusAPI.createOrder(orderInput);
      // Refresh local inventory cache after cloud stock deduction
      try {
        const fullInv = await DirectusAPI.getAllInventory();
        this.localFallback.setInventoryCache(fullInv);
      } catch (err) {}
      return created;
    } catch (e) {
      console.warn("DirectusCloudAdapter.createOrder network error, saving to local offline:", e);
      return await this.localFallback.createOrder(orderInput);
    }
  }

  async updateOrderStatus(id: number, status: OrderStatus | string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.updateOrderStatus(id, status);
      }
      return await DirectusAPI.updateOrderStatus(id, status);
    } catch (e) {
      console.warn("DirectusCloudAdapter.updateOrderStatus network error:", e);
      return await this.localFallback.updateOrderStatus(id, status);
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await this.localFallback.deleteOrder(id);
      }
      return await DirectusAPI.deleteOrder(id);
    } catch (e) {
      console.warn("DirectusCloudAdapter.deleteOrder network error:", e);
      return await this.localFallback.deleteOrder(id);
    }
  }

  getPendingSyncQueue(): SyncQueueItem[] {
    return this.localFallback.getPendingSyncQueue();
  }

  removeSyncQueueItem(id: string): void {
    this.localFallback.removeSyncQueueItem(id);
  }

  clearPendingSyncQueue(): void {
    this.localFallback.clearPendingSyncQueue();
  }

  getSyncStats(): SyncStats {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const localQueue = this.localFallback.getPendingSyncQueue();
    return {
      mode: this.mode,
      isOnline,
      pendingCount: localQueue.length,
      lastSyncTime: Date.now(),
      syncInProgress: false,
      lastError: null
    };
  }
}
