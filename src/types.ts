export interface User {
  id: string; // Directus system users use UUID
  email: string;
  shop_name?: string;
  shop_slug?: string;
  token?: string;
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
}

export interface DiffSyncPayload {
  create: Array<Omit<InventoryItem, 'id'>>;
  update: Array<Partial<InventoryItem> & { id: number }>;
  delete: Array<number>; // IDs of inventory items to delete
}

export interface LocaleDictionary {
  brand_name: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  get_started: string;
  features_title: string;
  feature_matrix_title: string;
  feature_matrix_desc: string;
  feature_advisor_title: string;
  feature_advisor_desc: string;
  feature_compress_title: string;
  feature_compress_desc: string;
  how_it_works: string;
  step_1: string;
  step_1_desc: string;
  step_2: string;
  step_2_desc: string;
  step_3: string;
  step_3_desc: string;
  login: string;
  register: string;
  email: string;
  password: string;
  shop_name: string;
  shop_slug: string;
  no_account: string;
  have_account: string;
  logout: string;
  loading: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  add_product: string;
  edit_product: string;
  product_name_fa: string;
  product_name_en: string;
  desc_fa: string;
  desc_en: string;
  base_price: string;
  image: string;
  category: string;
  free_tier_limit: string;
  free_tier_warning: string;
  matrix_editor: string;
  colors: string;
  sizes: string;
  stock: string;
  custom_price: string;
  saving_changes: string;
  changes_saved: string;
  error_saving: string;
  image_compressor: string;
  drag_drop_image: string;
  compressing: string;
  compressed_size: string;
  original_size: string;
  store_settings: string;
  buyer_storefront: string;
  variant_picker: string;
  size_advisor: string;
  height_cm: string;
  weight_kg: string;
  body_shape: string;
  shape_slim: string;
  shape_athletic: string;
  shape_heavy: string;
  calculate_size: string;
  recommended_size: string;
  no_size_found: string;
  out_of_stock: string;
  in_stock: string;
  price_toman: string;
  price_usd: string;
  back_to_products: string;
}
