export interface CartLineModifier {
  group_id: string;
  group_name?: string;
  modifier_id: string;
  name: string;
  price_delta: number;
}

export interface CartLineItem {
  line_id: string;
  product_id: string;
  variant_id?: string | null;
  attributes?: Record<string, unknown>;
  name: string;
  unit_price: number;
  price: number;
  image_url?: string;
  quantity: number;
  variant_label?: string | null;
  modifiers?: CartLineModifier[];
  item_notes?: string;
}
