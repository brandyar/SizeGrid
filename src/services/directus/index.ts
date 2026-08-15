import { AuthService } from './auth.service';
import { InventoryService } from './inventory.service';
import { ProductService } from './product.service';
import { OrderService } from './order.service';
import { getDirectusUrl, directusFetch } from './client';

export * from './client';
export * from './auth.service';
export * from './inventory.service';
export * from './product.service';
export * from './order.service';

export class DirectusService {
  public auth: AuthService;
  public inventory: InventoryService;
  public product: ProductService;
  public order: OrderService;

  constructor() {
    this.auth = new AuthService();
    this.inventory = new InventoryService(this.auth);
    this.product = new ProductService(this.auth, this.inventory);
    this.order = new OrderService(this.auth);
  }

  // --- AUTH DELEGATIONS ---
  checkSubscriptionStatus(user?: any) {
    return this.auth.checkSubscriptionStatus(user);
  }

  getSubscriptionInfo() {
    return this.auth.getSubscriptionInfo();
  }

  activateProSubscription(days?: number) {
    return this.auth.activateProSubscription(days);
  }

  cancelProSubscription() {
    return this.auth.cancelProSubscription();
  }

  login(email: string, password: string) {
    return this.auth.login(email, password);
  }

  register(email: string, password: string, shopName: string, shopSlug: string) {
    return this.auth.register(email, password, shopName, shopSlug);
  }

  logout() {
    return this.auth.logout();
  }

  getCurrentUser() {
    return this.auth.getCurrentUser();
  }

  updateSettings(shopName: string, shopSlug: string) {
    return this.auth.updateSettings(shopName, shopSlug);
  }

  // --- PRODUCT & METADATA DELEGATIONS ---
  getClothingTypes() {
    return this.product.getClothingTypes();
  }

  getColors() {
    return this.product.getColors();
  }

  createColor(nameFa: string, nameEn: string, hexCode: string) {
    return this.product.createColor(nameFa, nameEn, hexCode);
  }

  getCategories() {
    return this.product.getCategories();
  }

  createCategory(name: string, system_type: number, clothing_type_slug?: any) {
    return this.product.createCategory(name, system_type, clothing_type_slug);
  }

  deleteCategory(id: number) {
    return this.product.deleteCategory(id);
  }

  getSizes() {
    return this.product.getSizes();
  }

  createSize(name: string, sortOrder: number) {
    return this.product.createSize(name, sortOrder);
  }

  deleteSize(id: number) {
    return this.product.deleteSize(id);
  }

  getProducts() {
    return this.product.getProducts();
  }

  addProduct(productData: any) {
    return this.product.addProduct(productData);
  }

  updateProduct(id: number, productData: any) {
    return this.product.updateProduct(id, productData);
  }

  deleteProduct(id: number) {
    return this.product.deleteProduct(id);
  }

  getSizeGuidesForProduct(productId: number) {
    return this.product.getSizeGuidesForProduct(productId);
  }

  saveSizeGuide(productId: number, sizeId: number, measurements: any, existingId?: number) {
    return this.product.saveSizeGuide(productId, sizeId, measurements, existingId);
  }

  deleteSizeGuide(id: number) {
    return this.product.deleteSizeGuide(id);
  }

  getSizeGuideTemplates() {
    return this.product.getSizeGuideTemplates();
  }

  getTemplateById(id: number | string) {
    return this.product.getTemplateById(id);
  }

  getFallbackTemplates() {
    return this.product.getFallbackTemplates();
  }

  createSizeGuideTemplate(name: string, measurements: any[], clothing_type_slug?: any) {
    return this.product.createSizeGuideTemplate(name, measurements, clothing_type_slug);
  }

  updateSizeGuideTemplate(id: number | string, name: string, measurements: any[], clothing_type_slug?: any) {
    return this.product.updateSizeGuideTemplate(id, name, measurements, clothing_type_slug);
  }

  deleteSizeGuideTemplate(id: number | string) {
    return this.product.deleteSizeGuideTemplate(id);
  }

  compressImage(file: File, maxWidth?: number, maxHeight?: number, quality?: number) {
    return this.product.compressImage(file, maxWidth, maxHeight, quality);
  }

  uploadProductImage(file: File) {
    return this.product.uploadProductImage(file);
  }

  getMerchantBySlug(slug: string) {
    return this.product.getMerchantBySlug(slug);
  }

  getProductForStorefront(productId: number) {
    return this.product.getProductForStorefront(productId);
  }

  // --- INVENTORY DELEGATIONS ---
  getInventoryForProduct(productId: number) {
    return this.inventory.getInventoryForProduct(productId);
  }

  getAllInventory() {
    return this.inventory.getAllInventory();
  }

  updateInventoryItem(id: number, fields: { stock?: number; price?: number; sku?: string }) {
    return this.inventory.updateInventoryItem(id, fields);
  }

  syncInventory(productId: number, updatedItems: any[]) {
    return this.inventory.syncInventory(productId, updatedItems);
  }

  // --- ORDER DELEGATIONS ---
  getOrders() {
    return this.order.getOrders();
  }

  getOrderById(id: number) {
    return this.order.getOrderById(id);
  }

  createOrder(orderInput: any) {
    return this.order.createOrder(orderInput);
  }

  updateOrderStatus(id: number, status: any) {
    return this.order.updateOrderStatus(id, status);
  }

  deleteOrder(id: number) {
    return this.order.deleteOrder(id);
  }

  // --- HEALTH & PING TEST ---
  async testConnection(): Promise<{ ok: boolean; latencyMs: number; url: string; message: string }> {
    const url = getDirectusUrl();
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const res = await directusFetch('/server/ping', { retries: 0 }).catch(() => null);
      let ok = false;
      if (res && res.ok) {
        ok = true;
      } else {
        const catRes = await directusFetch('/items/categories?limit=1', { retries: 0 }).catch(() => null);
        if (catRes && (catRes.ok || catRes.status === 401 || catRes.status === 403)) {
          ok = true;
        }
      }
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const latencyMs = Math.round(end - start);

      if (ok) {
        return {
          ok: true,
          latencyMs,
          url,
          message: `ارتباط با سرور ابری برقرار است (${latencyMs} میلی‌ثانیه)`
        };
      } else {
        return {
          ok: false,
          latencyMs: 0,
          url,
          message: 'عدم پاسخگویی سرور ابری. لطفاً اتصال اینترنت خود را بررسی کنید.'
        };
      }
    } catch (err: any) {
      return {
        ok: false,
        latencyMs: 0,
        url,
        message: err?.message || 'خطا در برقراری ارتباط با سرور ابری'
      };
    }
  }
}

export const DirectusAPI = new DirectusService();
export default DirectusAPI;
