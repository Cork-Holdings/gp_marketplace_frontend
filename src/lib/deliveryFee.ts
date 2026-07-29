/** Estimate delivery fee the same way the backend does (flat + optional per-km). */
export function estimateDeliveryFee(
  store: {
    delivery_fee_flat?: string | number;
    delivery_fee_per_km?: string | number;
    latitude?: number | null;
    longitude?: number | null;
  } | null | undefined,
  opts: {
    fulfillmentType: string;
    deliveryLatitude?: number | null;
    deliveryLongitude?: number | null;
  },
): number {
  if (opts.fulfillmentType !== 'delivery' || !store) return 0;

  const flat = parseFloat(String(store.delivery_fee_flat ?? 0)) || 0;
  const perKm = parseFloat(String(store.delivery_fee_per_km ?? 0)) || 0;
  const storeLat = store.latitude;
  const storeLng = store.longitude;
  const destLat = opts.deliveryLatitude;
  const destLng = opts.deliveryLongitude;

  if (
    perKm === 0 ||
    storeLat == null ||
    storeLng == null ||
    destLat == null ||
    destLng == null
  ) {
    return Math.round(flat * 100) / 100;
  }

  const distanceKm = haversineKm(storeLat, storeLng, destLat, destLng);
  return Math.round((flat + perKm * distanceKm) * 100) / 100;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
