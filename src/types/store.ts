export interface StorefrontSettings {
  hero_headline?: string | null;
  hero_tagline?: string | null;
  cta_label?: string | null;
  featured_eyebrow?: string | null;
  featured_title?: string | null;
  about_title?: string | null;
  catalog_eyebrow?: string | null;
  catalog_title?: string | null;
  footer_blurb?: string | null;
  hero_images?: string[];
}

export type StoreImageKind = 'logo' | 'banner' | 'hero' | 'card';

export interface Store {
  id: string;
  owner_id?: string;
  merchant_id?: string;
  name: string;
  slug: string;
  description?: string;
  ussd_code?: string;
  currency?: string;
  image_url?: string;
  logo_url?: string;
  banner_url?: string;
  brand_color?: string;
  storefront_settings?: StorefrontSettings;
  is_active?: boolean;
  store_category?: string;
  store_type?: string;
  branch_name?: string;
  member_role?: string;
  delivery_fee_flat?: string | number;
  delivery_fee_per_km?: string | number;
  tax_rate_bps?: number;
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: any;
}
