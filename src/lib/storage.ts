const TOKEN_KEY = 'geepay_access_token';
const USER_KEY = 'geepay_user';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private browsing */
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* private browsing */
  }
}

export function cartStorageKey(storeId) {
  return `geepay_cart_${storeId}`;
}

export function loadCartFromStorage(storeId) {
  try {
    const raw = localStorage.getItem(cartStorageKey(storeId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(storeId, items) {
  try {
    localStorage.setItem(cartStorageKey(storeId), JSON.stringify(items));
  } catch {
    /* quota exceeded */
  }
}

export function clearCartStorage(storeId) {
  try {
    localStorage.removeItem(cartStorageKey(storeId));
  } catch {
    /* ignore */
  }
}
