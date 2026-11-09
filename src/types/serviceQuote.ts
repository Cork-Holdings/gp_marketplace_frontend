export type ServiceQuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
export type ServiceQuoteLineType = 'labour' | 'material' | 'travel' | 'fee';

export interface ServiceQuoteLine {
  id?: string;
  line_type: ServiceQuoteLineType;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  total?: string | number;
  line_total?: string | number;
}

export interface ServiceQuote {
	scheduled_at?: string;
	scheduled_end_at?: string;
	requested_at?: string;
	requested_end_at?: string;
	scheduling_resource_id?: string;
  id: string;
  customer_id?: string;
  store_id?: string;
  quote_number?: number;
  store_name?: string;
  title: string;
  description?: string;
  status: ServiceQuoteStatus;
  currency?: string;
  subtotal?: string | number;
  tax_amount?: string | number;
  total?: string | number;
  service_address?: { line1?: string; city?: string; country?: string };
  expires_at?: string;
  created_at?: string;
  lines: ServiceQuoteLine[];
}

export type ServiceJobStatus = 'scheduled' | 'assigned' | 'dispatched' | 'arrived' | 'in_progress' | 'provider_completed' | 'customer_confirmed' | 'disputed' | 'cancelled';
export interface ServiceJob {
  id: string; quote_id?: string; title: string; status: ServiceJobStatus; scheduled_start_at?: string; scheduled_end_at?: string; created_at?: string; updated_at?: string; assigned_to?: string;
  dispute_reason?: string;
  service_address?: { line1?: string; city?: string; country?: string };
}
export type ReservationStatus = 'expired' | 'requested' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
export type ReservationKind = 'appointment' | 'walk_in' | 'remote_session' | 'rental' | 'membership_visit';
export interface Reservation { id: string; store_id: string; resource_id?: string; service_id?: string; price_amount?: string; price_currency?: string; customer_id: string; title: string; kind: ReservationKind; status: ReservationStatus; starts_at: string; ends_at: string; notes?: string; }
export interface MerchantResource { id:string; store_id:string; name:string; resource_type:string; capacity:number; is_active:boolean; employee_user_id?:string }
export interface BookableService { id:string; store_id:string; name:string; duration_minutes:number; price:string; currency:string; is_active:boolean }
export interface ServiceProvider { store_id:string; name:string; slug:string; description:string; store_type:string; store_category:string; from_price?:string; currency:string; service_count:number; resource_count:number }
export interface ServiceJobEvidence {id:string;job_id:string;kind:'before_photo'|'after_photo'|'checklist'|'signature'|'receipt'|'note';note?:string;storage_key?:string;created_at:string}
