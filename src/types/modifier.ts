export interface Modifier {
  id: string;
  name: string;
  price_delta?: number | string;
  is_default?: boolean;
  [key: string]: any;
}

export interface ModifierGroup {
  id: string;
  store_id: string;
  product_id: string;
  name: string;
  selection_type: 'single' | 'multi';
  required?: boolean;
  min_select?: number;
  max_select?: number;
  modifiers: Modifier[];
  [key: string]: any;
}
