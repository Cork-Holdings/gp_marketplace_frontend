const STORAGE_KEY = 'geepay_qr_session';

export type QRSession = {
  storeId: string;
  storeSlug: string;
  tableId?: string;
  tableNumber?: string;
  qrCodeId: string;
  menuCategoryId?: string;
  guestSessionId: string;
  token: string;
};

function newGuestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getQRSession(): QRSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QRSession;
    if (!parsed?.storeId || !parsed?.qrCodeId || !parsed?.guestSessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setQRSession(session: QRSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearQRSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function ensureGuestSessionId(existing?: string | null): string {
  if (existing && existing.trim()) return existing.trim();
  const current = getQRSession();
  if (current?.guestSessionId) return current.guestSessionId;
  return newGuestId();
}

/** Build or refresh a QR session from a resolve API payload. */
export function sessionFromResolve(token: string, payload: any): QRSession {
  const store = payload?.store ?? {};
  const table = payload?.table;
  const qr = payload?.qr_code ?? {};
  const category = payload?.menu_category;
  return {
    storeId: String(store.id ?? qr.store_id ?? ''),
    storeSlug: String(store.slug ?? ''),
    tableId: table?.id ? String(table.id) : undefined,
    tableNumber: table?.table_number ? String(table.table_number) : undefined,
    qrCodeId: String(qr.id ?? ''),
    menuCategoryId: category?.id ? String(category.id) : qr.menu_category_id ? String(qr.menu_category_id) : undefined,
    guestSessionId: ensureGuestSessionId(),
    token,
  };
}

export function qrSessionForStore(storeId: string | undefined | null): QRSession | null {
  const session = getQRSession();
  if (!session || !storeId) return null;
  return session.storeId === storeId ? session : null;
}
