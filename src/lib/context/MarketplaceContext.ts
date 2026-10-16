import { createContext } from 'react';

export interface MarketplaceContextValue {
  stores: any[];
  memberships: any[];
  selectedStore: any;
  selectedStoreId: string | null;
  selectedMembership: any;
  memberRole: string | null;
  loading: boolean;
  initialized: boolean;
  error: unknown;
  selectStore: (storeId: string | null) => void;
  refreshStores: () => Promise<any[]>;
}

export const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export default MarketplaceContext;
