export interface User {
  id: string; // Directus system users use UUID
  email: string;
  shop_name?: string;
  shop_slug?: string;
  token?: string;
  has_pro_subscription?: boolean;
  subscription_tier?: 'free' | 'pro' | 'enterprise';
  subscription_expires_at?: string;
}

export interface Color {
  id: number;
  name_fa: string;
  name_en: string;
  hex_code: string;
}

export type ClothingTypeSlug = 'tops' | 'bottoms' | 'footwear' | 'one_piece' | 'accessories';

export interface ClothingType {
  id: number;
  name: string;
  slug: ClothingTypeSlug;
}

export interface Category {
  id: number;
  name: string;
  name_fa?: string;
  slug?: string;
  system_type?: number | null;
  clothing_type_slug?: ClothingTypeSlug;
  user_id?: string | null;
}

export interface Size {
  id: number;
  name: string;
  sort_order: number;
  user_created?: string | null;
}

export interface SizeGuideSchema {
  // Height range in cm, weight range in kg, recommendations mapping body shapes to sizes
  gender: 'unisex' | 'male' | 'female';
  base_rules: Array<{
    min_height: number;
    max_height: number;
    min_weight: number;
    max_weight: number;
    shapes: {
      slim: string;    // e.g. "S"
      athletic: string;// e.g. "M"
      heavy: string;   // e.g. "L"
    };
  }>;
}

export interface Product {
  id: number;
  name_fa: string;
  name_en: string;
  description_fa?: string;
  description_en?: string;
  image?: string; // Directus file ID or absolute URL
  base_price: number;
  size_guides?: SizeGuideSchema; // JSON schema parsed in Size Advisor
  size_guide_template_id?: number | string | null; // ID of the template
  category?: string;
  category_id?: number | null;
  clothing_type_slug?: ClothingTypeSlug;
  created_by?: string;
}

export interface SizeGuideTemplateItem {
  size_id: number;
  min_height: number;
  max_height: number;
  min_weight: number;
  max_weight: number;
  min_chest?: number;
  max_chest?: number;
  min_waist?: number;
  max_waist?: number;
  min_hip?: number;
  max_hip?: number;
  min_shoulder?: number;
  max_shoulder?: number;
  min_sleeve?: number;
  max_sleeve?: number;
  min_length?: number;
  max_length?: number;
  min_foot_length?: number;
  max_foot_length?: number;
  shapes: {
    slim: boolean;
    regular?: boolean;
    athletic: boolean;
    heavy: boolean;
  };
}

export interface SizeGuideTemplate {
  id: number;
  name: string;
  clothing_type_slug?: ClothingTypeSlug;
  measurements: SizeGuideTemplateItem[]; // Array of size rules
  user_created?: string;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  color_id: number;
  size_id: number;
  stock: number;
  price: number; // custom price for this variant, falls back to product base_price
  sku?: string; // unique stock keeping unit / barcode text
}

export interface DiffSyncPayload {
  create: Array<Omit<InventoryItem, 'id'>>;
  update: Array<Partial<InventoryItem> & { id: number }>;
  delete: Array<number>; // IDs of inventory items to delete
}

export interface LocaleDictionary {
  [key: string]: string;
}

export interface AppVersionInfo {
  version: string;
  releaseDate: string;
  notes?: string;
  changelog: {
    fa: string[];
    en: string[];
  };
  downloadUrl?: string;
  minSupportedVersion?: string;
  minimum_version?: string;
  isMandatory?: boolean;
}

export type UpdateCheckStatus = 'idle' | 'checking' | 'update_available' | 'up_to_date' | 'downloading' | 'ready_to_install' | 'error';

export interface UpdateState {
  currentVersion: string;
  status: UpdateCheckStatus;
  latestRelease: AppVersionInfo | null;
  downloadProgress: number;
  errorMessage: string | null;
  lastCheckedTime: number | null;
  showStartupModal?: boolean;
}

export type OrderStatus = 'published' | 'draft' | 'archived' | 'completed' | 'pending' | 'cancelled';

export interface OrderItem {
  id?: number;
  order_id?: number;
  item_inventory: number; // InventoryItem ID
  item_quantity: number;
  item_price: number;
  item_total: number;
  // Expanded visual helper fields
  inventory_item?: InventoryItem;
  product_name?: string;
  color_name?: string;
  size_name?: string;
}

export interface Order {
  id: number;
  status: OrderStatus | string;
  sort?: number;
  order_total: number;
  date_created?: string;
  user_created?: string;
  user_updated?: string;
  date_updated?: string;
  order_items?: OrderItem[];
}

export interface CreateOrderItemInput {
  item_inventory: number;
  item_quantity: number;
  item_price: number;
}

export interface CreateOrderInput {
  status?: OrderStatus | string;
  order_total?: number;
  items: CreateOrderItemInput[];
}

