import { User, Product, InventoryItem, Color, Size, DiffSyncPayload } from './types';

const DIRECTUS_URL = "/api/directus";

// Standard clothing sizes and color fallbacks in case public access is forbidden
const FALLBACK_COLORS: Color[] = [
  { id: 1, name_fa: "مشکی زغالی", name_en: "Charcoal Black", hex_code: "#1A1A1A" },
  { id: 2, name_fa: "کرم خاکی", name_en: "Sand Beige", hex_code: "#E1D5C3" },
  { id: 3, name_fa: "سرمه‌ای کلاسیک", name_en: "Navy Blue", hex_code: "#1F2E43" },
  { id: 4, name_fa: "زیتونی سیر", name_en: "Olive Green", hex_code: "#4A5343" },
  { id: 5, name_fa: "آجری", name_en: "Terracotta", hex_code: "#B35A42" },
];

const FALLBACK_SIZES: Size[] = [
  { id: 1, name: "S", sort_order: 1 },
  { id: 2, name: "M", sort_order: 2 },
  { id: 3, name: "L", sort_order: 3 },
  { id: 4, name: "XL", sort_order: 4 },
  { id: 5, name: "XXL", sort_order: 5 },
];

class DirectusService {
  private user: User | null = null;

  constructor() {
    // Rehydrate user session from browser cache
    const savedUser = localStorage.getItem('sizegrid_user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (e) {
        this.user = null;
      }
    }
  }

  // --- AUTHENTICATION API ---
  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody?.errors?.[0]?.message || 'شناسه کاربری یا رمز عبور نامعتبر است');
    }

    const data = await response.json();
    const token = data?.data?.access_token;

    // Fetch user profile info
    const userProfileRes = await fetch(`${DIRECTUS_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userProfileRes.ok) {
      throw new Error('خطا در دریافت اطلاعات پروفایل از سرور');
    }

    const profileData = await userProfileRes.json();
    const profile = profileData?.data;

    const loggedUser: User = {
      id: profile.id,
      email: profile.email,
      shop_name: profile.description || `${profile.first_name || 'My'} Store`,
      shop_slug: profile.last_name?.toLowerCase() || `shop-${profile.id.substring(0, 5)}`,
      token: token
    };

    this.user = loggedUser;
    localStorage.setItem('sizegrid_user', JSON.stringify(loggedUser));
    return loggedUser;
  }

  async register(email: string, password: string, shopName: string, shopSlug: string): Promise<User> {
    const cleanSlug = shopSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');

    const response = await fetch(`${DIRECTUS_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        first_name: shopName,
        last_name: cleanSlug,
        description: shopName,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody?.errors?.[0]?.message || 'ثبت‌نام با خطا مواجه شد. ممکن است ایمیل قبلاً ثبت شده باشد.');
    }

    // Automatically login after successful signup
    return this.login(email, password);
  }

  logout() {
    this.user = null;
    localStorage.removeItem('sizegrid_user');
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  // --- MERCHANT STORE SETTINGS ---
  async updateSettings(shopName: string, shopSlug: string): Promise<User> {
    if (!this.user) throw new Error("No authenticated user session.");
    const cleanSlug = shopSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');

    if (this.user.token) {
      const response = await fetch(`${DIRECTUS_URL}/users/${this.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.user.token}`
        },
        body: JSON.stringify({
          first_name: shopName,
          last_name: cleanSlug,
          description: shopName
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update remote user profile");
      }
    }

    // Update current memory + local storage
    this.user.shop_name = shopName;
    this.user.shop_slug = cleanSlug;
    localStorage.setItem('sizegrid_user', JSON.stringify(this.user));
    return this.user;
  }

  // --- META COLLECTION SERVICES (Colors & Sizes with Fallbacks) ---
  async getColors(): Promise<Color[]> {
    try {
      const currentUser = this.getCurrentUser();
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const response = await fetch(`${DIRECTUS_URL}/items/colors`, { headers });
      if (response.ok) {
        const res = await response.json();
        if (res?.data && res.data.length > 0) {
          return res.data.map((c: any) => ({
            id: c.id,
            name_fa: c.name,
            name_en: c.name,
            hex_code: c.hex_code
          }));
        }
      }
    } catch (e) {
      console.warn("Could not query colors, using defaults", e);
    }
    return FALLBACK_COLORS;
  }

  async getSizes(): Promise<Size[]> {
    try {
      const currentUser = this.getCurrentUser();
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const response = await fetch(`${DIRECTUS_URL}/items/sizes`, { headers });
      if (response.ok) {
        const res = await response.json();
        if (res?.data && res.data.length > 0) {
          return res.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            sort_order: s.sort_order
          }));
        }
      }
    } catch (e) {
      console.warn("Could not query sizes, using defaults", e);
    }
    return FALLBACK_SIZES;
  }

  // --- PRODUCTS CRUD SERVICES ---
  async getProducts(): Promise<Product[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${currentUser.token}`
    };

    const response = await fetch(`${DIRECTUS_URL}/items/products?filter[user_id][_eq]=${currentUser.id}`, { headers });
    if (!response.ok) {
      throw new Error(`خطا در بارگذاری لیست محصولات: ${response.statusText}`);
    }

    const res = await response.json();
    const list = res.data || [];

    return list.map((rawProduct: any) => ({
      id: rawProduct.id,
      name_fa: rawProduct.title,
      name_en: rawProduct.title,
      description_fa: rawProduct.description || '',
      description_en: rawProduct.description || '',
      image: rawProduct.main_image ? `${DIRECTUS_URL}/assets/${rawProduct.main_image}` : '',
      base_price: 500000, // Calculated dynamically from inventory if possible
      category: rawProduct.category_id === 1 ? "Tops" : rawProduct.category_id === 2 ? "Outerwear" : rawProduct.category_id === 3 ? "Pants" : "Clothing",
      created_by: rawProduct.user_id
    }));
  }

  async addProduct(productData: Omit<Product, 'id' | 'created_by'>): Promise<Product> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    // Extract image UUID if it's a Directus assets link
    let main_image: string | null = null;
    if (productData.image && productData.image.includes('/assets/')) {
      const parts = productData.image.split('/assets/');
      main_image = parts[parts.length - 1];
    }

    const payload = {
      user_id: currentUser.id,
      status: "published",
      title: productData.name_fa || productData.name_en,
      description: productData.description_fa || productData.description_en,
      category_id: productData.category === "Tops" ? 1 : productData.category === "Outerwear" ? 2 : productData.category === "Pants" ? 3 : 4,
      main_image: main_image
    };

    const response = await fetch(`${DIRECTUS_URL}/items/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`خطا در ایجاد کالا در دیتابیس Directus: ${response.statusText}`);
    }

    const res = await response.json();
    const raw = res.data;

    return {
      id: raw.id,
      name_fa: raw.title,
      name_en: raw.title,
      description_fa: raw.description,
      description_en: raw.description,
      image: raw.main_image ? `${DIRECTUS_URL}/assets/${raw.main_image}` : '',
      base_price: Number(productData.base_price || 500000),
      category: productData.category,
      created_by: raw.user_id
    };
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    // Parse image UUID
    let main_image: string | undefined | null = undefined;
    if (productData.image !== undefined) {
      if (productData.image && productData.image.includes('/assets/')) {
        const parts = productData.image.split('/assets/');
        main_image = parts[parts.length - 1];
      } else if (!productData.image) {
        main_image = null;
      }
    }

    const payload: any = {};
    if (productData.name_fa !== undefined || productData.name_en !== undefined) {
      payload.title = productData.name_fa || productData.name_en;
    }
    if (productData.description_fa !== undefined || productData.description_en !== undefined) {
      payload.description = productData.description_fa || productData.description_en;
    }
    if (productData.category !== undefined) {
      payload.category_id = productData.category === "Tops" ? 1 : productData.category === "Outerwear" ? 2 : productData.category === "Pants" ? 3 : 4;
    }
    if (main_image !== undefined) {
      payload.main_image = main_image;
    }

    const response = await fetch(`${DIRECTUS_URL}/items/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`خطا در به‌روزرسانی کالا: ${response.statusText}`);
    }

    const res = await response.json();
    const raw = res.data;

    return {
      id: raw.id,
      name_fa: raw.title,
      name_en: raw.title,
      description_fa: raw.description,
      description_en: raw.description,
      image: raw.main_image ? `${DIRECTUS_URL}/assets/${raw.main_image}` : '',
      base_price: Number(productData.base_price || 500000),
      category: productData.category,
      created_by: raw.user_id
    };
  }

  async deleteProduct(id: number): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    const response = await fetch(`${DIRECTUS_URL}/items/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`خطا در حذف کالا: ${response.statusText}`);
    }
  }

  // --- 2D INVENTORY MATRIX SERVICES ---
  async getInventoryForProduct(productId: number): Promise<InventoryItem[]> {
    const currentUser = this.getCurrentUser();
    const headers: Record<string, string> = {};
    if (currentUser?.token) {
      headers['Authorization'] = `Bearer ${currentUser.token}`;
    }

    const response = await fetch(`${DIRECTUS_URL}/items/inventory?filter[product_id][_eq]=${productId}`, { headers });
    if (!response.ok) {
      throw new Error(`خطا در دریافت موجودی کالا: ${response.statusText}`);
    }

    const res = await response.json();
    const list = res.data || [];

    return list.map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      color_id: item.color_id,
      size_id: item.size_id,
      stock: item.stock,
      price: item.price
    }));
  }

  /**
   * Real Directus Diff Sync Algorithm for sslip.io
   */
  async syncInventory(productId: number, updatedItems: Array<Omit<InventoryItem, 'id'>>): Promise<InventoryItem[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    const originalItems = await this.getInventoryForProduct(productId);

    const payload: DiffSyncPayload = {
      create: [],
      update: [],
      delete: []
    };

    const originalMap = new Map<string, InventoryItem>();
    originalItems.forEach(item => {
      originalMap.set(`${item.color_id}-${item.size_id}`, item);
    });

    const activeKeys = new Set<string>();

    updatedItems.forEach(item => {
      const key = `${item.color_id}-${item.size_id}`;
      activeKeys.add(key);
      const original = originalMap.get(key);

      if (!original) {
        payload.create.push({
          product_id: productId,
          color_id: item.color_id,
          size_id: item.size_id,
          stock: item.stock,
          price: item.price
        });
      } else {
        if (original.stock !== item.stock || original.price !== item.price) {
          payload.update.push({
            id: original.id,
            stock: item.stock,
            price: item.price
          });
        }
      }
    });

    originalItems.forEach(item => {
      const key = `${item.color_id}-${item.size_id}`;
      if (!activeKeys.has(key)) {
        payload.delete.push(item.id);
      }
    });

    // 1. Delete removed inventory items
    for (const deleteId of payload.delete) {
      await fetch(`${DIRECTUS_URL}/items/inventory/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
    }

    // 2. Patch updated inventory items
    for (const updateObj of payload.update) {
      await fetch(`${DIRECTUS_URL}/items/inventory/${updateObj.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ stock: updateObj.stock, price: updateObj.price })
      });
    }

    // 3. Post created inventory items
    for (const createObj of payload.create) {
      await fetch(`${DIRECTUS_URL}/items/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(createObj)
      });
    }

    return await this.getInventoryForProduct(productId);
  }

  // --- SIZE GUIDES DATABASE ENDPOINTS ---
  async getSizeGuidesForProduct(productId: number): Promise<any[]> {
    const currentUser = this.getCurrentUser();
    const headers: Record<string, string> = {};
    if (currentUser?.token) {
      headers['Authorization'] = `Bearer ${currentUser.token}`;
    }

    const response = await fetch(`${DIRECTUS_URL}/items/size_guides?filter[product_id][_eq]=${productId}`, { headers });
    if (!response.ok) {
      throw new Error(`خطا در بارگذاری مشخصات سایزبندی: ${response.statusText}`);
    }
    const res = await response.json();
    return res.data || [];
  }

  async saveSizeGuide(productId: number, sizeId: number, measurements: any, existingId?: number): Promise<any> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    const payload = {
      product_id: productId,
      size_id: sizeId,
      measurements: measurements
    };

    let response;
    if (existingId) {
      response = await fetch(`${DIRECTUS_URL}/items/size_guides/${existingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ measurements })
      });
    } else {
      response = await fetch(`${DIRECTUS_URL}/items/size_guides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      throw new Error(`خطا در ذخیره‌سازی سایزبند: ${response.statusText}`);
    }
    const res = await response.json();
    return res.data;
  }

  async deleteSizeGuide(id: number): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    const response = await fetch(`${DIRECTUS_URL}/items/size_guides/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`خطا در حذف مشخصه سایز: ${response.statusText}`);
    }
  }

  // --- HTML5 CANVAS IMAGE COMPRESSOR SERVICE ---
  compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Could not acquire 2D context."));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas blob compression failed."));
            }
          }, 'image/jpeg', quality);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  async uploadProductImage(file: File): Promise<string> {
    const compressedBlob = await this.compressImage(file);
    const compressedFile = new File([compressedBlob], "compressed_" + file.name, { type: 'image/jpeg' });

    const currentUser = this.getCurrentUser();
    if (!currentUser?.token) throw new Error("Authentication token missing.");

    const formData = new FormData();
    formData.append('file', compressedFile);

    const response = await fetch(`${DIRECTUS_URL}/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${currentUser.token}` },
      body: formData
    });

    if (!response.ok) {
      throw new Error("آپلود تصویر در سرور دایرکتوس با خطا مواجه شد.");
    }

    const data = await response.json();
    return `${DIRECTUS_URL}/assets/${data?.data?.id}`;
  }

  // --- PUBLIC STOREFRONT QUERY APIS ---
  async getMerchantBySlug(slug: string): Promise<User | null> {
    const cleanSlug = slug.trim().toLowerCase();

    try {
      const response = await fetch(`${DIRECTUS_URL}/users?filter[last_name][_eq]=${cleanSlug}`);
      if (response.ok) {
        const res = await response.json();
        if (res?.data && res.data.length > 0) {
          const u = res.data[0];
          return {
            id: u.id,
            email: u.email,
            shop_name: u.description || `${u.first_name || 'My'} Store`,
            shop_slug: u.last_name
          };
        }
      }
    } catch (e) {
      console.warn("Error querying merchant by slug", e);
    }
    return null;
  }

  async getProductForStorefront(productId: number): Promise<{ product: Product; inventory: InventoryItem[]; colors: Color[]; sizes: Size[]; sizeGuides: any[] } | null> {
    try {
      const response = await fetch(`${DIRECTUS_URL}/items/products/${productId}`);
      if (!response.ok) return null;

      const res = await response.json();
      const rawProduct = res.data;
      if (!rawProduct) return null;

      const product: Product = {
        id: rawProduct.id,
        name_fa: rawProduct.title,
        name_en: rawProduct.title,
        description_fa: rawProduct.description || '',
        description_en: rawProduct.description || '',
        image: rawProduct.main_image ? `${DIRECTUS_URL}/assets/${rawProduct.main_image}` : '',
        base_price: 500000,
        category: rawProduct.category_id === 1 ? "Tops" : rawProduct.category_id === 2 ? "Outerwear" : rawProduct.category_id === 3 ? "Pants" : "Clothing",
        created_by: rawProduct.user_id
      };

      const [inventory, colors, sizes, sizeGuides] = await Promise.all([
        this.getInventoryForProduct(productId),
        this.getColors(),
        this.getSizes(),
        this.getSizeGuidesForProduct(productId)
      ]);

      // Set the base price as the minimum price from inventory if available
      if (inventory.length > 0) {
        const minPrice = Math.min(...inventory.map(i => i.price));
        if (minPrice > 0) {
          product.base_price = minPrice;
        }
      }

      return {
        product,
        inventory,
        colors,
        sizes,
        sizeGuides
      };
    } catch (e) {
      console.warn("Public storefront fetch error", e);
      return null;
    }
  }
}

export const DirectusAPI = new DirectusService();
export default DirectusAPI;
