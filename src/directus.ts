import { User, Product, InventoryItem, Color, Size, DiffSyncPayload, SizeGuideTemplate, SizeGuideTemplateItem, ClothingType, Category, ClothingTypeSlug } from './types';

const DIRECTUS_URL = ((import.meta as any).env?.VITE_DIRECTUS_URL as string) || '/api/directus';

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
        role: "5e13d3bc-e293-4720-90b5-d7a02871d34a"
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
  async getClothingTypes(): Promise<ClothingType[]> {
    try {
      const currentUser = this.getCurrentUser();
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }
      const response = await fetch(`${DIRECTUS_URL}/items/clothing_types`, { headers });
      if (response.ok) {
        const res = await response.json();
        if (res?.data && res.data.length > 0) {
          return res.data.map((ct: any) => ({
            id: ct.id,
            name: ct.name,
            slug: ct.slug as ClothingTypeSlug
          }));
        }
      }
    } catch (e) {
      console.warn("Could not query clothing_types, using standard defaults", e);
    }
    return [
      { id: 1, name: "بالاتنه (تیشرت، هودی، پیراهن، کت)", slug: "tops" },
      { id: 2, name: "پایین‌تنه (شلوار، شلوارک، جین، لگ)", slug: "bottoms" },
      { id: 3, name: "کفش", slug: "footwear" },
      { id: 4, name: "سرهمی", slug: "one_piece" },
      { id: 5, name: "اکسسوری", slug: "accessories" }
    ];
  }

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

  async getCategories(): Promise<Category[]> {
    try {
      const currentUser = this.getCurrentUser();
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }
      const response = await fetch(`${DIRECTUS_URL}/items/categories`, { headers });
      if (response.ok) {
        const res = await response.json();
        if (res?.data && res.data.length > 0) {
          return res.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            name_fa: c.name,
            slug: c.slug,
            system_type: c.system_type || 1,
            user_id: c.user_id
          }));
        }
      }
    } catch (e) {
      console.warn("Could not query categories, using defaults", e);
    }
    return [
      { id: 1, name: "تیشرت، پیراهن و هودی (بالاتنه)", name_fa: "تیشرت، پیراهن و هودی (بالاتنه)", slug: "tops-shirts", system_type: 1 },
      { id: 2, name: "شلوار، جین و شلوارک (پایین‌تنه)", name_fa: "شلوار، جین و شلوارک (پایین‌تنه)", slug: "bottoms-pants", system_type: 2 },
      { id: 3, name: "کفش و کتانی (کفش)", name_fa: "کفش و کتانی (کفش)", slug: "footwear-shoes", system_type: 3 },
      { id: 4, name: "سرهمی و اورال (سرهمی)", name_fa: "سرهمی و اورال (سرهمی)", slug: "onepiece-overall", system_type: 4 },
      { id: 5, name: "کلاه، کیف و اکسسوری", name_fa: "کلاه، کیف و اکسسوری", slug: "accessories", system_type: 5 }
    ];
  }

  async createCategory(name: string, system_type: number): Promise<Category> {
    const currentUser = this.getCurrentUser();
    const payload = {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      system_type,
      user_id: currentUser?.id || null
    };
    try {
      if (currentUser?.token) {
        const response = await fetch(`${DIRECTUS_URL}/items/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const res = await response.json();
          return {
            id: res.data.id,
            name: res.data.name,
            name_fa: res.data.name,
            slug: res.data.slug,
            system_type: res.data.system_type,
            user_id: res.data.user_id
          };
        }
      }
    } catch (e) {
      console.warn("Directus category creation error", e);
    }
    return {
      id: Math.floor(Math.random() * 1000) + 100,
      name,
      name_fa: name,
      system_type
    };
  }

  async getSizes(): Promise<Size[]> {
    const currentUser = this.getCurrentUser();
    let sizesList: Size[] = [];
    try {
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }

      const response = await fetch(`${DIRECTUS_URL}/items/sizes?limit=100`, { headers });
      if (response.ok) {
        const res = await response.json();
        if (res?.data && res.data.length > 0) {
          sizesList = res.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            sort_order: Number(s.sort_order),
            user_created: s.user_created
          }));
        }
      }
    } catch (e) {
      console.warn("Could not query sizes, using defaults", e);
    }

    if (sizesList.length === 0) {
      sizesList = [...FALLBACK_SIZES].map(s => ({ ...s }));
    }

    // Always merge in custom sizes stored in localStorage for robustness/fallbacks
    if (currentUser) {
      const localSizesStr = localStorage.getItem(`custom_sizes_${currentUser.id}`) || '[]';
      try {
        const localSizes = JSON.parse(localSizesStr);
        localSizes.forEach((ls: Size) => {
          if (!sizesList.some(s => s.id === ls.id)) {
            sizesList.push(ls);
          }
        });
      } catch (e) {}
    }

    // Sort by sort_order ascending
    return sizesList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  async createSize(name: string, sortOrder: number): Promise<Size> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    const payload = {
      name,
      sort_order: sortOrder,
      user_created: currentUser.id
    };

    try {
      const response = await fetch(`${DIRECTUS_URL}/items/sizes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to create size in Directus: ${response.statusText}`);
      }

      const res = await response.json();
      const newSize = {
        id: res.data.id,
        name: res.data.name,
        sort_order: Number(res.data.sort_order),
        user_created: res.data.user_created
      };

      // Also mirror to local storage
      const localSizesStr = localStorage.getItem(`custom_sizes_${currentUser.id}`) || '[]';
      const localSizes = JSON.parse(localSizesStr);
      localSizes.push(newSize);
      localStorage.setItem(`custom_sizes_${currentUser.id}`, JSON.stringify(localSizes));

      return newSize;
    } catch (e) {
      console.warn("Failed to create size on Directus, using local fallback", e);
      const localSizesStr = localStorage.getItem(`custom_sizes_${currentUser.id}`) || '[]';
      const localSizes = JSON.parse(localSizesStr);
      const newSize: Size = {
        id: Math.floor(Math.random() * 10000) + 1000,
        name,
        sort_order: sortOrder,
        user_created: currentUser.id
      };
      localSizes.push(newSize);
      localStorage.setItem(`custom_sizes_${currentUser.id}`, JSON.stringify(localSizes));
      return newSize;
    }
  }

  async deleteSize(id: number): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    try {
      const response = await fetch(`${DIRECTUS_URL}/items/sizes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to delete size: ${response.statusText}`);
      }
    } catch (e) {
      console.warn("Failed to delete size from Directus, using local fallback", e);
    }

    // Always clean up from localStorage too
    const localSizesStr = localStorage.getItem(`custom_sizes_${currentUser.id}`) || '[]';
    try {
      let localSizes = JSON.parse(localSizesStr);
      localSizes = localSizes.filter((s: any) => s.id !== id);
      localStorage.setItem(`custom_sizes_${currentUser.id}`, JSON.stringify(localSizes));
    } catch (e) {}
  }

  // --- PRODUCTS CRUD SERVICES ---
  async getProducts(): Promise<Product[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${currentUser.token}`
    };

    const [response, categories, clothingTypes] = await Promise.all([
      fetch(`${DIRECTUS_URL}/items/products?filter[user_id][_eq]=${currentUser.id}`, { headers }),
      this.getCategories().catch(() => []),
      this.getClothingTypes().catch(() => [])
    ]);

    if (!response.ok) {
      let extra = '';
      try {
        const body = await response.json();
        if (body?.errors?.[0]?.message) {
          extra = `: ${body.errors[0].message}`;
        }
      } catch (e) {}
      throw new Error(`(کد خطا ${response.status}) خطا در بارگذاری محصولات${extra}`);
    }

    const res = await response.json();
    const list = res.data || [];

    return list.map((rawProduct: any) => {
      const catObj = categories.find(c => c.id === rawProduct.category_id);
      let clothingTypeSlug: ClothingTypeSlug = 'tops';
      if (catObj?.system_type) {
        const ct = clothingTypes.find(t => t.id === catObj.system_type);
        if (ct?.slug) clothingTypeSlug = ct.slug;
      } else if (rawProduct.category_id === 2) {
        clothingTypeSlug = 'bottoms';
      } else if (rawProduct.category_id === 3) {
        clothingTypeSlug = 'footwear';
      } else if (rawProduct.category_id === 4) {
        clothingTypeSlug = 'one_piece';
      } else if (rawProduct.category_id === 5) {
        clothingTypeSlug = 'accessories';
      }

      return {
        id: rawProduct.id,
        name_fa: rawProduct.title,
        name_en: rawProduct.title,
        description_fa: rawProduct.description || '',
        description_en: rawProduct.description || '',
        image: rawProduct.main_image ? `${DIRECTUS_URL}/assets/${rawProduct.main_image}` : '',
        base_price: 500000,
        category: catObj?.name || (rawProduct.category_id === 1 ? "بالاتنه" : rawProduct.category_id === 2 ? "پایین‌تنه" : rawProduct.category_id === 3 ? "کفش" : "سایر"),
        category_id: rawProduct.category_id || null,
        clothing_type_slug: clothingTypeSlug,
        size_guide_template_id: rawProduct.size_guide_template_id || null,
        created_by: rawProduct.user_id
      };
    });
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
      main_image: main_image,
      size_guide_template_id: productData.size_guide_template_id || null
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
      size_guide_template_id: raw.size_guide_template_id || null,
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
    if (productData.size_guide_template_id !== undefined) {
      payload.size_guide_template_id = productData.size_guide_template_id;
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
      size_guide_template_id: raw.size_guide_template_id || null,
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

  async getAllInventory(): Promise<InventoryItem[]> {
    const currentUser = this.getCurrentUser();
    const headers: Record<string, string> = {};
    if (currentUser?.token) {
      headers['Authorization'] = `Bearer ${currentUser.token}`;
    }

    const response = await fetch(`${DIRECTUS_URL}/items/inventory?limit=1000`, { headers });
    if (!response.ok) {
      let extra = '';
      try {
        const body = await response.json();
        if (body?.errors?.[0]?.message) {
          extra = `: ${body.errors[0].message}`;
        }
      } catch (e) {}
      throw new Error(`(کد خطا ${response.status}) خطا در دریافت موجودی انبار${extra}`);
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

  async updateInventoryItem(id: number, fields: { stock?: number; price?: number }): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    const response = await fetch(`${DIRECTUS_URL}/items/inventory/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(fields)
    });

    if (!response.ok) {
      throw new Error(`خطا در ویرایش آیتم انبار: ${response.statusText}`);
    }
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

  // --- SIZE GUIDE TEMPLATE CRUD SERVICES ---
  async getSizeGuideTemplates(): Promise<SizeGuideTemplate[]> {
    const currentUser = this.getCurrentUser();
    const headers: Record<string, string> = {};
    if (currentUser?.token) {
      headers['Authorization'] = `Bearer ${currentUser.token}`;
    }

    try {
      const response = await fetch(`${DIRECTUS_URL}/items/size_guide_templates`, { headers });
      if (!response.ok) {
        console.warn("size_guide_templates collection might not exist, returning fallback templates.");
        return this.getFallbackTemplates();
      }

      const res = await response.json();
      const list = res.data || [];
      return list.map((item: any) => ({
        id: item.id,
        name: item.name,
        clothing_type_slug: item.clothing_type_slug || 'tops',
        measurements: typeof item.measurements === 'string' ? JSON.parse(item.measurements) : (item.measurements || []),
        user_created: item.user_created
      }));
    } catch (e) {
      console.warn("Error loading templates from Directus, using fallbacks.", e);
      return this.getFallbackTemplates();
    }
  }

  async getTemplateById(id: number | string): Promise<SizeGuideTemplate | null> {
    try {
      const currentUser = this.getCurrentUser();
      const headers: Record<string, string> = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }
      const response = await fetch(`${DIRECTUS_URL}/items/size_guide_templates/${id}`, { headers });
      if (!response.ok) return null;
      const res = await response.json();
      const item = res.data;
      if (!item) return null;
      return {
        id: item.id,
        name: item.name,
        clothing_type_slug: item.clothing_type_slug || 'tops',
        measurements: typeof item.measurements === 'string' ? JSON.parse(item.measurements) : (item.measurements || []),
        user_created: item.user_created
      };
    } catch (e) {
      console.warn("Error getting size guide template by id:", e);
      return null;
    }
  }

  getFallbackTemplates(): SizeGuideTemplate[] {
    return [
      {
        id: 101,
        name: "تی‌شرت و پیراهن استاندارد (Tops)",
        clothing_type_slug: "tops",
        measurements: [
          { size_id: 1, min_height: 155, max_height: 168, min_weight: 50, max_weight: 65, min_chest: 84, max_chest: 92, min_shoulder: 38, max_shoulder: 41, shapes: { slim: true, athletic: true, heavy: false } },
          { size_id: 2, min_height: 165, max_height: 178, min_weight: 60, max_weight: 78, min_chest: 92, max_chest: 100, min_shoulder: 41, max_shoulder: 44, shapes: { slim: true, athletic: true, heavy: true } },
          { size_id: 3, min_height: 175, max_height: 188, min_weight: 75, max_weight: 95, min_chest: 100, max_chest: 110, min_shoulder: 44, max_shoulder: 47, shapes: { slim: true, athletic: true, heavy: true } },
          { size_id: 4, min_height: 185, max_height: 200, min_weight: 90, max_weight: 115, min_chest: 110, max_chest: 122, min_shoulder: 47, max_shoulder: 51, shapes: { slim: false, athletic: true, heavy: true } }
        ]
      },
      {
        id: 102,
        name: "شلوار و جین اسلیم فیت (Bottoms)",
        clothing_type_slug: "bottoms",
        measurements: [
          { size_id: 1, min_height: 150, max_height: 165, min_weight: 45, max_weight: 58, min_waist: 68, max_waist: 76, min_hip: 88, max_hip: 94, shapes: { slim: true, athletic: true, heavy: false } },
          { size_id: 2, min_height: 160, max_height: 175, min_weight: 55, max_weight: 70, min_waist: 76, max_waist: 84, min_hip: 94, max_hip: 102, shapes: { slim: true, athletic: true, heavy: false } },
          { size_id: 3, min_height: 170, max_height: 185, min_weight: 68, max_weight: 85, min_waist: 84, max_waist: 92, min_hip: 102, max_hip: 110, shapes: { slim: true, athletic: true, heavy: true } },
          { size_id: 4, min_height: 180, max_height: 195, min_weight: 82, max_weight: 102, min_waist: 92, max_waist: 102, min_hip: 110, max_hip: 120, shapes: { slim: false, athletic: true, heavy: true } }
        ]
      },
      {
        id: 103,
        name: "کفش و کتانی مردانه/زنانه (Footwear)",
        clothing_type_slug: "footwear",
        measurements: [
          { size_id: 1, min_height: 150, max_height: 165, min_weight: 45, max_weight: 60, min_foot_length: 23.5, max_foot_length: 24.5, shapes: { slim: true, athletic: true, heavy: true } },
          { size_id: 2, min_height: 160, max_height: 175, min_weight: 55, max_weight: 72, min_foot_length: 24.5, max_foot_length: 25.5, shapes: { slim: true, athletic: true, heavy: true } },
          { size_id: 3, min_height: 170, max_height: 185, min_weight: 65, max_weight: 88, min_foot_length: 25.5, max_foot_length: 27.0, shapes: { slim: true, athletic: true, heavy: true } },
          { size_id: 4, min_height: 180, max_height: 198, min_weight: 80, max_weight: 105, min_foot_length: 27.0, max_foot_length: 28.5, shapes: { slim: true, athletic: true, heavy: true } }
        ]
      },
      {
        id: 104,
        name: "سرهمی و اورال کامل (One-piece)",
        clothing_type_slug: "one_piece",
        measurements: [
          { size_id: 1, min_height: 155, max_height: 168, min_weight: 48, max_weight: 62, min_chest: 82, max_chest: 90, min_waist: 66, max_waist: 74, min_hip: 88, max_hip: 96, shapes: { slim: true, athletic: true, heavy: false } },
          { size_id: 2, min_height: 165, max_height: 178, min_weight: 60, max_weight: 75, min_chest: 90, max_chest: 98, min_waist: 74, max_waist: 82, min_hip: 96, max_hip: 104, shapes: { slim: true, athletic: true, heavy: true } },
          { size_id: 3, min_height: 175, max_height: 188, min_weight: 72, max_weight: 90, min_chest: 98, max_chest: 108, min_waist: 82, max_waist: 92, min_hip: 104, max_hip: 112, shapes: { slim: true, athletic: true, heavy: true } }
        ]
      },
      {
        id: 105,
        name: "کلاه و اکسسوری تک‌سایز (Accessories)",
        clothing_type_slug: "accessories",
        measurements: [
          { size_id: 2, min_height: 140, max_height: 210, min_weight: 40, max_weight: 130, shapes: { slim: true, athletic: true, heavy: true } }
        ]
      }
    ];
  }

  async createSizeGuideTemplate(name: string, measurements: SizeGuideTemplateItem[], clothing_type_slug?: ClothingTypeSlug): Promise<SizeGuideTemplate> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    const payload = {
      name,
      clothing_type_slug: clothing_type_slug || 'tops',
      measurements: measurements,
      user_created: currentUser.id
    };

    try {
      const response = await fetch(`${DIRECTUS_URL}/items/size_guide_templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn("Directus failed to save template to DB. Falling back to local/in-memory template.");
        const mockId = Math.floor(Math.random() * 1000) + 200;
        return {
          id: mockId,
          name,
          clothing_type_slug: clothing_type_slug || 'tops',
          measurements,
          user_created: currentUser.id
        };
      }

      const res = await response.json();
      const item = res.data;
      return {
        id: item.id,
        name: item.name,
        clothing_type_slug: item.clothing_type_slug || clothing_type_slug || 'tops',
        measurements: typeof item.measurements === 'string' ? JSON.parse(item.measurements) : (item.measurements || []),
        user_created: item.user_created
      };
    } catch (e) {
      console.warn("Failed saving template to Directus", e);
      const mockId = Math.floor(Math.random() * 1000) + 200;
      return {
        id: mockId,
        name,
        clothing_type_slug: clothing_type_slug || 'tops',
        measurements,
        user_created: currentUser.id
      };
    }
  }

  async updateSizeGuideTemplate(id: number | string, name: string, measurements: SizeGuideTemplateItem[], clothing_type_slug?: ClothingTypeSlug): Promise<SizeGuideTemplate> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    const payload = {
      name,
      clothing_type_slug: clothing_type_slug || 'tops',
      measurements: measurements
    };

    try {
      const response = await fetch(`${DIRECTUS_URL}/items/size_guide_templates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn("Directus template update failed. Mocking save.");
        return {
          id: Number(id) || 101,
          name,
          clothing_type_slug: clothing_type_slug || 'tops',
          measurements,
          user_created: currentUser.id
        };
      }

      const res = await response.json();
      const item = res.data;
      return {
        id: item.id,
        name: item.name,
        clothing_type_slug: item.clothing_type_slug || clothing_type_slug || 'tops',
        measurements: typeof item.measurements === 'string' ? JSON.parse(item.measurements) : (item.measurements || []),
        user_created: item.user_created
      };
    } catch (e) {
      console.warn("Failed updating template", e);
      return {
        id: Number(id) || 101,
        name,
        clothing_type_slug: clothing_type_slug || 'tops',
        measurements,
        user_created: currentUser.id
      };
    }
  }

  async deleteSizeGuideTemplate(id: number | string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    try {
      const response = await fetch(`${DIRECTUS_URL}/items/size_guide_templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      if (!response.ok) {
        console.warn("Directus template delete failed.");
      }
    } catch (e) {
      console.warn("Failed deleting template from Directus", e);
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
      const [response, categories, clothingTypes] = await Promise.all([
        fetch(`${DIRECTUS_URL}/items/products/${productId}`),
        this.getCategories().catch(() => []),
        this.getClothingTypes().catch(() => [])
      ]);
      if (!response.ok) return null;

      const res = await response.json();
      const rawProduct = res.data;
      if (!rawProduct) return null;

      const catObj = categories.find(c => c.id === rawProduct.category_id);
      let clothingTypeSlug: ClothingTypeSlug = 'tops';
      if (catObj?.system_type) {
        const ct = clothingTypes.find(t => t.id === catObj.system_type);
        if (ct?.slug) clothingTypeSlug = ct.slug;
      } else if (rawProduct.category_id === 2) {
        clothingTypeSlug = 'bottoms';
      } else if (rawProduct.category_id === 3) {
        clothingTypeSlug = 'footwear';
      } else if (rawProduct.category_id === 4) {
        clothingTypeSlug = 'one_piece';
      } else if (rawProduct.category_id === 5) {
        clothingTypeSlug = 'accessories';
      }

      const product: Product = {
        id: rawProduct.id,
        name_fa: rawProduct.title,
        name_en: rawProduct.title,
        description_fa: rawProduct.description || '',
        description_en: rawProduct.description || '',
        image: rawProduct.main_image ? `${DIRECTUS_URL}/assets/${rawProduct.main_image}` : '',
        base_price: 500000,
        category: catObj?.name || (rawProduct.category_id === 1 ? "بالاتنه" : rawProduct.category_id === 2 ? "پایین‌تنه" : rawProduct.category_id === 3 ? "کفش" : "سایر"),
        category_id: rawProduct.category_id || null,
        clothing_type_slug: clothingTypeSlug,
        size_guide_template_id: rawProduct.size_guide_template_id || null,
        created_by: rawProduct.user_id
      };

      let sizeGuides: any[] = [];
      const [inventory, colors, sizes, directGuides] = await Promise.all([
        this.getInventoryForProduct(productId),
        this.getColors(),
        this.getSizes(),
        this.getSizeGuidesForProduct(productId)
      ]);

      sizeGuides = directGuides || [];

      if (product.size_guide_template_id && sizeGuides.length === 0) {
        try {
          const tpl = await this.getTemplateById(Number(product.size_guide_template_id));
          if (tpl && tpl.measurements && tpl.measurements.length > 0) {
            sizeGuides = tpl.measurements.map(m => ({
              product_id: productId,
              size_id: m.size_id,
              measurements: m
            }));
          }
        } catch (err) {
          console.warn("Failed to load template measurements for storefront:", err);
        }
      }

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
