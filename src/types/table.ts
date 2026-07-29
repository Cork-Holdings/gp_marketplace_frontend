export interface TableQRCode {
  id: string;
  store_id?: string;
  kind?: 'table' | 'store' | 'menu';
  table_id?: string | null;
  menu_category_id?: string | null;
  public_token: string;
  is_active: boolean;
  [key: string]: any;
}

export interface Table {
  id: string;
  store_id: string;
  table_number: string;
  label?: string;
  capacity?: number;
  status?: 'available' | 'occupied' | 'reserved' | 'needs_cleaning';
  qr_code?: TableQRCode | null;
  [key: string]: any;
}
