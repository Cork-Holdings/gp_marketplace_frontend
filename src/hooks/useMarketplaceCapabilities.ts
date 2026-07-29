import { useMemo } from 'react';
import {
  STORE_CATEGORIES,
  CATEGORY_LABELS,
  WORKFLOW_TRANSITIONS,
  FOOD_KANBAN_LANES,
  SERVICE_KANBAN_LANES,
  resolveStoreCategory,
  isFoodStore,
  isServiceStore,
  usesInventory,
  getNextStatuses,
} from '@/lib/workflows';

/**
 * Derives marketplace UI capabilities from store category / tenant profile.
 */
export function useMarketplaceCapabilities(store) {
  return useMemo(() => {
    const category = resolveStoreCategory(store);
    const transitions = WORKFLOW_TRANSITIONS[category] ?? WORKFLOW_TRANSITIONS.PHYSICAL_GOODS;

    return {
      category,
      categoryLabel: CATEGORY_LABELS[category] ?? category,
      transitions,
      isFood: isFoodStore(store),
      isService: isServiceStore(store),
      usesInventory: usesInventory(store),
      kanbanLanes: isFoodStore(store)
        ? FOOD_KANBAN_LANES
        : isServiceStore(store)
          ? SERVICE_KANBAN_LANES
          : null,
      supportsScheduling:
        category === STORE_CATEGORIES.ON_PREMISE_SERVICE ||
        category === STORE_CATEGORIES.ON_SITE_SERVICE,
      supportsDeliveryDispatch:
        category === STORE_CATEGORIES.FOOD_BEVERAGE ||
        category === STORE_CATEGORIES.ON_SITE_SERVICE ||
        category === STORE_CATEGORIES.PHYSICAL_GOODS,
      supportsDineIn: isFoodStore(store),
      supportsModifiers: isFoodStore(store),
      supportsTables: isFoodStore(store),
      supportsVariants: true,
      getNextStatus: (current, fulfillmentType?: string) =>
        getNextStatuses(category, current, fulfillmentType),
    };
  }, [store]);
}

export default useMarketplaceCapabilities;
