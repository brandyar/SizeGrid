import { InventoryItem, DiffSyncPayload } from '../../types';
import { directusFetch } from './client';
import { AuthService } from './auth.service';

export class InventoryService {
  constructor(private authService: AuthService) {}

  async getInventoryForProduct(productId: number): Promise<InventoryItem[]> {
    const currentUser = this.authService.getCurrentUser();
    const token = currentUser?.token || null;

    const response = await directusFetch(`/items/inventory?filter[product_id][_eq]=${productId}`, { token });
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
      price: item.price,
      sku: item.sku || ''
    }));
  }

  async getAllInventory(): Promise<InventoryItem[]> {
    const currentUser = this.authService.getCurrentUser();
    const token = currentUser?.token || null;

    const response = await directusFetch('/items/inventory?limit=1000', { token });
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
      price: item.price,
      sku: item.sku || ''
    }));
  }

  async updateInventoryItem(id: number, fields: { stock?: number; price?: number; sku?: string }): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required.");

    const response = await directusFetch(`/items/inventory/${id}`, {
      method: 'PATCH',
      token: currentUser.token,
      body: JSON.stringify(fields)
    });

    if (!response.ok) {
      throw new Error(`خطا در ویرایش آیتم انبار: ${response.statusText}`);
    }
  }

  /**
   * Real Directus Diff Sync Algorithm
   */
  async syncInventory(productId: number, updatedItems: Array<Omit<InventoryItem, 'id'>>): Promise<InventoryItem[]> {
    const currentUser = this.authService.getCurrentUser();
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
          price: item.price,
          sku: item.sku || ''
        });
      } else {
        if (original.stock !== item.stock || original.price !== item.price || original.sku !== item.sku) {
          payload.update.push({
            id: original.id,
            stock: item.stock,
            price: item.price,
            sku: item.sku !== undefined ? item.sku : original.sku
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
      await directusFetch(`/items/inventory/${deleteId}`, {
        method: 'DELETE',
        token: currentUser.token
      });
    }

    // 2. Patch updated inventory items
    for (const updateObj of payload.update) {
      await directusFetch(`/items/inventory/${updateObj.id}`, {
        method: 'PATCH',
        token: currentUser.token,
        body: JSON.stringify({ stock: updateObj.stock, price: updateObj.price, sku: updateObj.sku })
      });
    }

    // 3. Post created inventory items
    for (const createObj of payload.create) {
      await directusFetch('/items/inventory', {
        method: 'POST',
        token: currentUser.token,
        body: JSON.stringify(createObj)
      });
    }

    return await this.getInventoryForProduct(productId);
  }
}
