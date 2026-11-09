export type PaymentReceipt = {
  id: string; kind: 'quote' | 'reservation' | 'custom_order'; source_id: string;
  stage: 'full' | 'deposit' | 'balance'; amount: string; currency: string;
  reference: string; simulated: boolean; confirmed_at: string;
  title: string; business: string; customer: string; refunded: boolean;
};
export type ReceiptPage = { items: PaymentReceipt[]; has_more: boolean };

export function receiptStageLabel(stage: string): string {
  // The legacy "deposit" stage also collects the full custom-order price when
  // there is no deposit. Never infer which from today's offer or call it a debt.
  return stage === 'deposit' ? 'Initial payment' : stage === 'balance' ? 'Balance payment' : 'Full payment';
}
export function receiptKindLabel(kind: string): string {
  return kind === 'quote' ? 'Quoted service' : kind === 'reservation' ? 'Booking' : 'Custom / bulk order';
}
export function receiptPage(value: unknown): ReceiptPage {
  const page=value as ReceiptPage;
  if (!page || !Array.isArray(page.items) || typeof page.has_more!=='boolean' || page.items.some(r=>
    !r || !r.id || !r.reference || !['quote','reservation','custom_order'].includes(r.kind)
    || !['full','deposit','balance'].includes(r.stage) || !/^\d+(\.\d{1,2})?$/.test(r.amount)
    || !/^[A-Z]{3}$/.test(r.currency) || !Number.isFinite(Date.parse(r.confirmed_at))
    || typeof r.simulated!=='boolean' || typeof r.refunded!=='boolean'
    || [r.title,r.business,r.customer].some(text=>typeof text!=='string')
  )) throw new Error('Invalid receipt response');
  return page;
}
