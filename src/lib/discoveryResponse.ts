import type { DiscoveryPage } from './discovery';

export function validateDiscoveryResponse(response: DiscoveryPage): DiscoveryPage {
  if (!Array.isArray(response?.offerings) || !Number.isSafeInteger(response.total) || response.total < 0) {
    throw new Error('Marketplace results could not be read');
  }
  return response;
}
