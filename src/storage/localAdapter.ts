import { Product, Category, Size, Color, SizeGuideTemplate, InventoryItem, ClothingTypeSlug, DiffSyncPayload, Order, OrderItem, CreateOrderInput, OrderStatus } from '../types';
import { IStorageAdapter, StorageMode, SyncQueueItem, SyncStats } from './types';
import { idbGet, idbSet } from './indexedDBHelper';
import { generateUUID } from '../utils/uuid';

const STORAGE_KEYS = {
  PRODUCTS: 'tankhor_local_products_v1',
  CATEGORIES: 'tankhor_local_categories_v1',
  SIZES: 'tankhor_local_sizes_v1',
  COLORS: 'tankhor_local_colors_v1',
  TEMPLATES: 'tankhor_local_templates_v1',
  INVENTORY: 'tankhor_local_inventory_v1',
  ORDERS: 'tankhor_local_orders_v1',
  SYNC_QUEUE: 'tankhor_local_sync_queue_v1',
  LAST_SYNC: 'tankhor_local_last_sync_time',
  STORAGE_MODE: 'tankhor_storage_mode'
};

// Initial Seed Data for local offline usage
const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: "تیشرت و پولوشرت", name_fa: "تیشرت و پولوشرت", clothing_type_slug: "tops", system_type: 1 },
  { id: 2, name: "هودی و دورس", name_fa: "هودی و دورس", clothing_type_slug: "tops", system_type: 1 },
  { id: 3, name: "پیراهن مردانه", name_fa: "پیراهن مردانه", clothing_type_slug: "tops", system_type: 1 },
  { id: 4, name: "شلوار جین و کتان", name_fa: "شلوار جین و کتان", clothing_type_slug: "bottoms", system_type: 2 },
  { id: 5, name: "شلوار اسلش و ورزشی", name_fa: "شلوار اسلش و ورزشی", clothing_type_slug: "bottoms", system_type: 2 },
  { id: 6, name: "کفش ورزشی و کتانی", name_fa: "کفش ورزشی و کتانی", clothing_type_slug: "footwear", system_type: 5 },
  { id: 7, name: "کفش رسمی و چرم", name_fa: "کفش رسمی و چرم", clothing_type_slug: "footwear", system_type: 5 },
  { id: 8, name: "کت و کاپشن", name_fa: "کت و کاپشن", clothing_type_slug: "tops", system_type: 1 },
  { id: 9, name: "کلاه و اکسسوری", name_fa: "کلاه و اکسسوری", clothing_type_slug: "accessories", system_type: 4 }
];

const DEFAULT_SIZES: Size[] = [
  { id: 1, name: "S", sort_order: 1 },
  { id: 2, name: "M", sort_order: 2 },
  { id: 3, name: "L", sort_order: 3 },
  { id: 4, name: "XL", sort_order: 4 },
  { id: 5, name: "2XL", sort_order: 5 },
  { id: 6, name: "3XL", sort_order: 6 },
  { id: 7, name: "38", sort_order: 10 },
  { id: 8, name: "40", sort_order: 11 },
  { id: 9, name: "42", sort_order: 12 },
  { id: 10, name: "44", sort_order: 13 }
];

const DEFAULT_COLORS: Color[] = [
  { id: 1, name_fa: "مشکی زغالی", name_en: "Charcoal Black", hex_code: "#1A1A1A" },
  { id: 2, name_fa: "سفید استخوانی", name_en: "Off White", hex_code: "#F5F5F0" },
  { id: 3, name_fa: "سرمه‌ای کلاسیک", name_en: "Navy Blue", hex_code: "#1F2E43" },
  { id: 4, name_fa: "خاکستری ملانژ", name_en: "Mélange Gray", hex_code: "#888888" },
  { id: 5, name_fa: "زیتونی سیر", name_en: "Olive Green", hex_code: "#4A5343" },
  { id: 6, name_fa: "آجری", name_en: "Terracotta", hex_code: "#B35A42" },
  { id: 7, name_fa: "کرم خاکی", name_en: "Sand Beige", hex_code: "#E1D5C3" }
];

const DEFAULT_TEMPLATES: SizeGuideTemplate[] = [
  {
    id: 1,
    name: "قالب استاندارد تیشرت مردانه (تن‌خور معمولی)",
    clothing_type_slug: "tops",
    measurements: [
      { size_id: 1, min_height: 160, max_height: 170, min_weight: 55, max_weight: 65, min_chest: 88, max_chest: 94, min_shoulder: 41, max_shoulder: 43, shapes: { slim: true, athletic: true, heavy: false } },
      { size_id: 2, min_height: 168, max_height: 178, min_weight: 65, max_weight: 76, min_chest: 95, max_chest: 102, min_shoulder: 43, max_shoulder: 46, shapes: { slim: true, athletic: true, heavy: false } },
      { size_id: 3, min_height: 175, max_height: 185, min_weight: 76, max_weight: 87, min_chest: 103, max_chest: 110, min_shoulder: 46, max_shoulder: 49, shapes: { slim: false, athletic: true, heavy: true } },
      { size_id: 4, min_height: 180, max_height: 192, min_weight: 87, max_weight: 100, min_chest: 111, max_chest: 118, min_shoulder: 49, max_shoulder: 52, shapes: { slim: false, athletic: true, heavy: true } }
    ]
  },
  {
    id: 2,
    name: "قالب راهنمای سایز شلوار جین و کتان",
    clothing_type_slug: "bottoms",
    measurements: [
      { size_id: 7, min_height: 165, max_height: 175, min_weight: 60, max_weight: 70, min_waist: 76, max_waist: 80, min_hip: 92, max_hip: 96, min_length: 100, max_length: 102, shapes: { slim: true, athletic: true, heavy: false } },
      { size_id: 8, min_height: 170, max_height: 180, min_weight: 70, max_weight: 80, min_waist: 81, max_waist: 86, min_hip: 97, max_hip: 102, min_length: 102, max_length: 104, shapes: { slim: true, athletic: true, heavy: false } },
      { size_id: 9, min_height: 175, max_height: 188, min_weight: 80, max_weight: 92, min_waist: 87, max_waist: 92, min_hip: 103, max_hip: 108, min_length: 104, max_length: 106, shapes: { slim: false, athletic: true, heavy: true } }
    ]
  },
  {
    id: 3,
    name: "قالب راهنمای سایز کفش و کتانی اسپرت",
    clothing_type_slug: "footwear",
    measurements: [
      { size_id: 8, min_height: 160, max_height: 180, min_weight: 50, max_weight: 90, min_foot_length: 24.5, max_foot_length: 25.5, shapes: { slim: true, athletic: true, heavy: true } },
      { size_id: 9, min_height: 160, max_height: 180, min_weight: 50, max_weight: 90, min_foot_length: 25.6, max_foot_length: 26.5, shapes: { slim: true, athletic: true, heavy: true } },
      { size_id: 10, min_height: 160, max_height: 180, min_weight: 50, max_weight: 90, min_foot_length: 26.6, max_foot_length: 27.5, shapes: { slim: true, athletic: true, heavy: true } }
    ]
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 101,
    name_fa: "تیشرت اورسایز پنبه سوپر ۳۰",
    name_en: "Oversized Super Cotton T-Shirt",
    description_fa: "تهیه شده از پارچه ۱۰۰٪ پنبه شانه شده با شستشوی آنزیم، بدون آبرفت و رنگ‌دهی. تن‌خور آزاد و مدرن.",
    base_price: 580000,
    category: "تیشرت و پولوشرت",
    category_id: 1,
    clothing_type_slug: "tops",
    size_guide_template_id: 1
  },
  {
    id: 102,
    name_fa: "شلوار جین مام‌استایل نیل",
    name_en: "Neil Mom Style Jeans",
    description_fa: "جین سنگ‌شور شده با فاق بلند و برش استاندارد مچ پا، دوخت صنعتی سه سوزنه با ماندگاری بالا.",
    base_price: 1150000,
    category: "شلوار جین و کتان",
    category_id: 4,
    clothing_type_slug: "bottoms",
    size_guide_template_id: 2
  },
  {
    id: 103,
    name_fa: "کتانی اسپرت رانینگ اولترا",
    name_en: "Ultra Running Sports Sneakers",
    description_fa: "رویه بافت تنفس‌پذیر با کفی طبی و زیره ایوا فوق‌العاده سبک و ضدسایش مناسب استفاده روزمره.",
    base_price: 1890000,
    category: "کفش ورزشی و کتانی",
    category_id: 6,
    clothing_type_slug: "footwear",
    size_guide_template_id: 3
  }
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: 1001, product_id: 101, color_id: 1, size_id: 1, stock: 12, price: 580000 },
  { id: 1002, product_id: 101, color_id: 1, size_id: 2, stock: 18, price: 580000 },
  { id: 1003, product_id: 101, color_id: 1, size_id: 3, stock: 8, price: 580000 },
  { id: 1004, product_id: 101, color_id: 2, size_id: 2, stock: 15, price: 580000 },
  { id: 1005, product_id: 101, color_id: 2, size_id: 3, stock: 10, price: 580000 },
  { id: 1006, product_id: 102, color_id: 3, size_id: 7, stock: 6, price: 1150000 },
  { id: 1007, product_id: 102, color_id: 3, size_id: 8, stock: 14, price: 1150000 },
  { id: 1008, product_id: 103, color_id: 1, size_id: 8, stock: 5, price: 1890000 },
  { id: 1009, product_id: 103, color_id: 2, size_id: 9, stock: 9, price: 1890000 }
];

export class LocalStorageAdapter implements IStorageAdapter {
  private mode: StorageMode = 'local_offline';

  constructor() {
    this.initSeedDataIfNeeded();
    const savedMode = localStorage.getItem(STORAGE_KEYS.STORAGE_MODE) as StorageMode;
    if (savedMode) {
      this.mode = savedMode;
    }
  }

  private initSeedDataIfNeeded() {
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SIZES)) {
      this.setItem(STORAGE_KEYS.SIZES, DEFAULT_SIZES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COLORS)) {
      this.setItem(STORAGE_KEYS.COLORS, DEFAULT_COLORS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      this.setItem(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      this.setItem(STORAGE_KEYS.INVENTORY, DEFAULT_INVENTORY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE)) {
      this.setItem(STORAGE_KEYS.SYNC_QUEUE, []);
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading key ${key} from LocalStorage`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      idbSet(key, value).catch(() => {});
    } catch (e) {
      console.error(`Error writing key ${key} to LocalStorage`, e);
      // Fallback: write strictly to IndexedDB if localStorage quota exceeded
      idbSet(key, value).catch(() => {});
    }
  }

  private recordSyncQueueItem(entityType: SyncQueueItem['entityType'], entityId: number | string, operation: SyncQueueItem['operation'], payload: any) {
    const queue = this.getItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
    const newItem: SyncQueueItem = {
      id: `queue_${generateUUID()}`,
      entityType,
      entityId,
      operation,
      payload,
      timestamp: Date.now()
    };
    queue.push(newItem);
    this.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  // --- MODE MANAGERS ---
  getMode(): StorageMode {
    return this.mode;
  }

  setMode(mode: StorageMode): void {
    this.mode = mode;
    localStorage.setItem(STORAGE_KEYS.STORAGE_MODE, mode);
  }

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    return this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  }

  async getProductById(id: number): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  async saveProduct(productData: Partial<Product> & { name_fa: string; base_price: number }): Promise<Product> {
    const products = await this.getProducts();
    let savedProduct: Product;
    const nowIso = new Date().toISOString();

    if (productData.id) {
      // Update existing
      const index = products.findIndex(p => p.id === productData.id);
      if (index !== -1) {
        savedProduct = { 
          ...products[index], 
          ...productData, 
          local_uuid: products[index].local_uuid || productData.local_uuid || generateUUID(),
          updated_at: nowIso 
        };
        products[index] = savedProduct;
      } else {
        savedProduct = { 
          ...productData, 
          local_uuid: productData.local_uuid || generateUUID(),
          updated_at: nowIso 
        } as Product;
        products.push(savedProduct);
      }
      this.recordSyncQueueItem('product', savedProduct.id, 'update', savedProduct);
    } else {
      // Create new with auto increment local ID
      const newId = products.length > 0 ? Math.max(...products.map(p => Number(p.id) || 0)) + 1 : 101;
      savedProduct = {
        id: newId,
        local_uuid: productData.local_uuid || generateUUID(),
        updated_at: nowIso,
        name_fa: productData.name_fa,
        name_en: productData.name_en || productData.name_fa,
        description_fa: productData.description_fa || '',
        description_en: productData.description_en || '',
        base_price: productData.base_price,
        category: productData.category || 'عمومی',
        category_id: productData.category_id || null,
        clothing_type_slug: productData.clothing_type_slug || 'tops',
        image: productData.image || '',
        size_guide_template_id: productData.size_guide_template_id || null
      };
      products.push(savedProduct);
      this.recordSyncQueueItem('product', savedProduct.id, 'create', savedProduct);
    }

    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    return savedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const products = await this.getProducts();
    const updated = products.filter(p => p.id !== id);
    this.setItem(STORAGE_KEYS.PRODUCTS, updated);

    // Also delete inventory related to this product
    const inventory = await this.getInventory();
    const updatedInventory = inventory.filter(inv => inv.product_id !== id);
    this.setItem(STORAGE_KEYS.INVENTORY, updatedInventory);

    this.recordSyncQueueItem('product', id, 'delete', { id });
    return true;
  }

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  }

  async saveCategory(name: string, systemType: number = 1, clothingTypeSlug: ClothingTypeSlug = 'tops'): Promise<Category> {
    const categories = await this.getCategories();
    const newId = categories.length > 0 ? Math.max(...categories.map(c => Number(c.id) || 0)) + 1 : 1;
    const nowIso = new Date().toISOString();
    const newCat: Category = {
      id: newId,
      local_uuid: generateUUID(),
      updated_at: nowIso,
      name,
      name_fa: name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      system_type: systemType,
      clothing_type_slug: clothingTypeSlug
    };
    categories.push(newCat);
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
    this.recordSyncQueueItem('category', newCat.id, 'create', newCat);
    return newCat;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const categories = await this.getCategories();
    const updated = categories.filter(c => c.id !== id);
    this.setItem(STORAGE_KEYS.CATEGORIES, updated);
    this.recordSyncQueueItem('category', id, 'delete', { id });
    return true;
  }

  // --- SIZES & COLORS ---
  async getSizes(): Promise<Size[]> {
    return this.getItem<Size[]>(STORAGE_KEYS.SIZES, []);
  }

  async saveSize(name: string, sortOrder: number = 10): Promise<Size> {
    const sizes = await this.getSizes();
    const existing = sizes.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const newId = sizes.length > 0 ? Math.max(...sizes.map(s => Number(s.id) || 0)) + 1 : 1;
    const nowIso = new Date().toISOString();
    const newSize: Size = { id: newId, local_uuid: generateUUID(), updated_at: nowIso, name, sort_order: sortOrder };
    sizes.push(newSize);
    this.setItem(STORAGE_KEYS.SIZES, sizes);
    this.recordSyncQueueItem('size', newSize.id, 'create', newSize);
    return newSize;
  }

  async deleteSize(id: number): Promise<boolean> {
    const sizes = await this.getSizes();
    const updated = sizes.filter(s => s.id !== id);
    this.setItem(STORAGE_KEYS.SIZES, updated);
    this.recordSyncQueueItem('size', id, 'delete', { id });
    return true;
  }

  async getColors(): Promise<Color[]> {
    return this.getItem<Color[]>(STORAGE_KEYS.COLORS, []);
  }

  async saveColor(nameFa: string, nameEn: string, hexCode: string): Promise<Color> {
    const colors = await this.getColors();
    const newId = colors.length > 0 ? Math.max(...colors.map(c => Number(c.id) || 0)) + 1 : 1;
    const nowIso = new Date().toISOString();
    const newColor: Color = { id: newId, local_uuid: generateUUID(), updated_at: nowIso, name_fa: nameFa, name_en: nameEn || nameFa, hex_code: hexCode };
    colors.push(newColor);
    this.setItem(STORAGE_KEYS.COLORS, colors);
    this.recordSyncQueueItem('color', newColor.id, 'create', newColor);
    return newColor;
  }

  // --- SIZE GUIDE TEMPLATES ---
  async getSizeGuideTemplates(): Promise<SizeGuideTemplate[]> {
    return this.getItem<SizeGuideTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
  }

  async saveSizeGuideTemplate(templateData: Omit<SizeGuideTemplate, 'id'> & { id?: number }): Promise<SizeGuideTemplate> {
    const templates = await this.getSizeGuideTemplates();
    let saved: SizeGuideTemplate;
    const nowIso = new Date().toISOString();

    if (templateData.id) {
      const idx = templates.findIndex(t => t.id === templateData.id);
      if (idx !== -1) {
        saved = { 
          ...templates[idx], 
          ...templateData, 
          local_uuid: templates[idx].local_uuid || templateData.local_uuid || generateUUID(),
          updated_at: nowIso 
        } as SizeGuideTemplate;
        templates[idx] = saved;
      } else {
        saved = { 
          ...templateData, 
          local_uuid: templateData.local_uuid || generateUUID(),
          updated_at: nowIso 
        } as SizeGuideTemplate;
        templates.push(saved);
      }
      this.recordSyncQueueItem('size_template', saved.id, 'update', saved);
    } else {
      const newId = templates.length > 0 ? Math.max(...templates.map(t => Number(t.id) || 0)) + 1 : 1;
      saved = {
        id: newId,
        local_uuid: templateData.local_uuid || generateUUID(),
        updated_at: nowIso,
        name: templateData.name,
        clothing_type_slug: templateData.clothing_type_slug || 'tops',
        measurements: templateData.measurements || []
      };
      templates.push(saved);
      this.recordSyncQueueItem('size_template', saved.id, 'create', saved);
    }

    this.setItem(STORAGE_KEYS.TEMPLATES, templates);
    return saved;
  }

  async deleteSizeGuideTemplate(id: number): Promise<boolean> {
    const templates = await this.getSizeGuideTemplates();
    const updated = templates.filter(t => t.id !== id);
    this.setItem(STORAGE_KEYS.TEMPLATES, updated);
    this.recordSyncQueueItem('size_template', id, 'delete', { id });
    return true;
  }

  // --- INVENTORY ---
  async getInventory(productId?: number): Promise<InventoryItem[]> {
    const all = this.getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    if (productId !== undefined) {
      return all.filter(item => item.product_id === productId);
    }
    return all;
  }

  async updateInventory(items: InventoryItem[]): Promise<boolean> {
    const inventory = await this.getInventory();
    if (items.length === 0) return true;

    // Calculate maximum current ID in local inventory to prevent ID collisions
    let maxId = inventory.length > 0 ? Math.max(...inventory.map(i => Number(i.id) || 0)) : 1000;

    // Check if items is a single item update (e.g., updating stock of 1 row in warehouse)
    if (items.length === 1 && items[0].id && items[0].id !== 0) {
      const singleItem = items[0];
      const idx = inventory.findIndex(i => i.id === singleItem.id);
      if (idx !== -1) {
        inventory[idx] = { ...inventory[idx], ...singleItem };
      } else {
        inventory.push(singleItem);
      }
    } else {
      // Group items by product_id to update matrix combinations for each product
      const productIds = Array.from(new Set(items.map(i => i.product_id)));

      for (const pid of productIds) {
        const targetItemsForProd = items.filter(i => i.product_id === pid);
        const existingProdInventory = inventory.filter(i => i.product_id === pid);
        const newProdInventory: InventoryItem[] = [];

        for (const targetItem of targetItemsForProd) {
          let matched: InventoryItem | undefined;
          if (targetItem.id && targetItem.id !== 0) {
            matched = existingProdInventory.find(i => i.id === targetItem.id);
          }
          if (!matched) {
            matched = existingProdInventory.find(i => i.color_id === targetItem.color_id && i.size_id === targetItem.size_id);
          }

          if (matched) {
            newProdInventory.push({
              ...matched,
              stock: targetItem.stock,
              price: targetItem.price,
              sku: targetItem.sku !== undefined ? targetItem.sku : matched.sku
            });
          } else {
            maxId++;
            newProdInventory.push({
              id: maxId,
              product_id: pid,
              color_id: targetItem.color_id,
              size_id: targetItem.size_id,
              stock: targetItem.stock,
              price: targetItem.price,
              sku: targetItem.sku || ''
            });
          }
        }

        // Replace inventory for this product in the main array
        const otherProductsInventory = inventory.filter(i => i.product_id !== pid);
        inventory.length = 0;
        inventory.push(...otherProductsInventory, ...newProdInventory);
      }
    }

    this.setItem(STORAGE_KEYS.INVENTORY, inventory);
    this.recordSyncQueueItem('inventory', 0, 'update', items);
    return true;
  }

  async syncInventoryDiff(productId: number, payload: DiffSyncPayload): Promise<boolean> {
    const inventory = await this.getInventory();
    let updated = [...inventory];

    // Delete
    if (payload.delete && payload.delete.length > 0) {
      updated = updated.filter(item => !payload.delete.includes(item.id));
    }

    // Update
    if (payload.update && payload.update.length > 0) {
      for (const u of payload.update) {
        const idx = updated.findIndex(item => item.id === u.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], ...u };
        }
      }
    }

    // Create
    if (payload.create && payload.create.length > 0) {
      let maxId = updated.length > 0 ? Math.max(...updated.map(i => Number(i.id) || 0)) : 1000;
      for (const c of payload.create) {
        maxId++;
        updated.push({
          id: maxId,
          product_id: productId,
          color_id: c.color_id,
          size_id: c.size_id,
          stock: c.stock || 0,
          price: c.price || 0
        });
      }
    }

    this.setItem(STORAGE_KEYS.INVENTORY, updated);
    this.recordSyncQueueItem('inventory', productId, 'update', payload);
    return true;
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    const orders = this.getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    return orders.sort((a, b) => new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime());
  }

  async getOrderById(id: number): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id) || null;
  }

  async createOrder(orderInput: CreateOrderInput): Promise<Order> {
    // 1. Get current local inventory
    const currentInventory = this.getItem<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    
    // 2. Calculate item totals and deduct inventory stock
    const createdItems: OrderItem[] = [];
    let calculatedTotal = 0;

    for (const itemInput of orderInput.items) {
      const itemTotal = itemInput.item_quantity * itemInput.item_price;
      calculatedTotal += itemTotal;

      const orderItem: OrderItem = {
        id: Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000),
        item_inventory: itemInput.item_inventory,
        item_quantity: itemInput.item_quantity,
        item_price: itemInput.item_price,
        item_total: itemTotal
      };
      createdItems.push(orderItem);

      // Deduct stock from local inventory
      const invIndex = currentInventory.findIndex(inv => inv.id === itemInput.item_inventory);
      if (invIndex !== -1) {
        currentInventory[invIndex].stock = Math.max(0, currentInventory[invIndex].stock - itemInput.item_quantity);
      }
    }

    // Save updated local inventory
    this.setItem(STORAGE_KEYS.INVENTORY, currentInventory);

    // 3. Create Order
    const newOrderId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 100);
    const newOrder: Order = {
      id: newOrderId,
      status: orderInput.status || 'published',
      order_total: orderInput.order_total && orderInput.order_total > 0 ? orderInput.order_total : calculatedTotal,
      date_created: new Date().toISOString(),
      order_items: createdItems
    };

    const orders = this.getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    orders.push(newOrder);
    this.setItem(STORAGE_KEYS.ORDERS, orders);

    // Record in sync queue for cloud sync
    this.recordSyncQueueItem('order', newOrderId, 'create', newOrder);

    return newOrder;
  }

  async updateOrderStatus(id: number, status: OrderStatus | string): Promise<boolean> {
    const orders = this.getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return false;

    orders[idx].status = status;
    orders[idx].date_updated = new Date().toISOString();
    this.setItem(STORAGE_KEYS.ORDERS, orders);
    this.recordSyncQueueItem('order', id, 'update', { status });
    return true;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const orders = this.getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length === orders.length) return false;

    this.setItem(STORAGE_KEYS.ORDERS, filtered);
    this.recordSyncQueueItem('order', id, 'delete', { id });
    return true;
  }

  // Cache synchronization helpers (without adding to sync queue)
  setProductsCache(products: Product[]): void {
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  setCategoriesCache(categories: Category[]): void {
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  setSizesCache(sizes: Size[]): void {
    this.setItem(STORAGE_KEYS.SIZES, sizes);
  }

  setColorsCache(colors: Color[]): void {
    this.setItem(STORAGE_KEYS.COLORS, colors);
  }

  setTemplatesCache(templates: SizeGuideTemplate[]): void {
    this.setItem(STORAGE_KEYS.TEMPLATES, templates);
  }

  setInventoryCache(inventory: InventoryItem[]): void {
    this.setItem(STORAGE_KEYS.INVENTORY, inventory);
  }

  setOrdersCache(orders: Order[]): void {
    this.setItem(STORAGE_KEYS.ORDERS, orders);
  }

  // --- SYNC QUEUE & METRICS ---
  getPendingSyncQueue(): SyncQueueItem[] {
    return this.getItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  }

  clearPendingSyncQueue(): void {
    this.setItem(STORAGE_KEYS.SYNC_QUEUE, []);
  }

  getSyncStats(): SyncStats {
    const queue = this.getPendingSyncQueue();
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return {
      mode: this.mode,
      isOnline: navigator.onLine,
      pendingCount: queue.length,
      lastSyncTime: lastSync ? Number(lastSync) : null,
      syncInProgress: false,
      lastError: null
    };
  }
}
