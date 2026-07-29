import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/locale';

export function formatGmv(amount, currency = DEFAULT_CURRENCY) {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return `${currency} —`;
  return `${currency} ${n.toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatOrderMoney(total, currency = DEFAULT_CURRENCY) {
  const n = Number(total);
  if (!Number.isFinite(n)) return '—';
  return formatGmv(n, currency || DEFAULT_CURRENCY);
}

export function mapOrderActivity(order) {
  const status = String(order.status || 'pending').replace(/_/g, ' ');
  const statusKey = status.toLowerCase();
  const paidLike = ['paid', 'completed', 'fulfilled', 'delivered'].some((s) => statusKey.includes(s));

  return {
    id: order.id,
    orderId: `#${order.order_number ?? order.id?.slice(0, 8)}`,
    activity: paidLike ? 'Order update' : 'Order received',
    detail: `${formatLabel(order.fulfillment_type)} · ${formatLabel(order.payment_method)}`,
    price: formatOrderMoney(order.total, order.currency),
    status: status.replace(/\b\w/g, (c) => c.toUpperCase()),
    date: formatShortDate(order.created_at),
    icon: paidLike ? 'payment' : 'package',
  };
}

export function mapStoreCard(store, index = 0) {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug || store.id?.slice(0, 8) || 'store',
    ussd: store.ussd_code || '—',
    status: store.is_active === false ? 'Inactive' : 'Active',
    variant: index % 2 === 0 ? 'dark' : 'muted',
  };
}

function formatLabel(value) {
  if (!value) return '—';
  return String(value).replace(/_/g, ' ');
}

function formatShortDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(DEFAULT_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
}
