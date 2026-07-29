export interface ProductVariant {
  id?: string;
  sku?: string;
  price?: number | string;
  price_adjustment?: number | string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Product {
  id: string;
  store_id?: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  price?: number | string;
  image_url?: string | null;
  is_active?: boolean;
  stock_quantity?: number;
  variant_mode?: string;
  attribute_schema?: unknown[];
  variants?: ProductVariant[];
  menu_category_id?: string | null;
  [key: string]: any;
}
