export interface OrderItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  store_id?: string;
  status?: string;
  customer_phone?: string;
  notes?: string;
  fulfillment_type?: string;
  payment_method?: string;
  items?: OrderItem[];
  order_number?: string;
  total?: number | string;
  total_amount?: number | string;
  currency?: string;
  store_name?: string;
  store_slug?: string;
  created_at?: string;
  delivery_fee?: number | string;
  delivery_address?: { line1?: string; city?: string; [key: string]: unknown };
  dispatch_payload?: unknown;
  table_id?: string;
  table_number?: string;
  [key: string]: any;
}
