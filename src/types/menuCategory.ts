export interface MenuCategory {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
  [key: string]: any;
}
