/** Store category workflows aligned with Go backend state machine. */

export const STORE_CATEGORIES = {
  ON_PREMISE_SERVICE: 'ON_PREMISE_SERVICE',
  FOOD_BEVERAGE: 'FOOD_BEVERAGE',
  PHYSICAL_GOODS: 'PHYSICAL_GOODS',
  ON_SITE_SERVICE: 'ON_SITE_SERVICE',
};

export const CATEGORY_LABELS = {
  [STORE_CATEGORIES.ON_PREMISE_SERVICE]: 'On-Premise Service',
  [STORE_CATEGORIES.FOOD_BEVERAGE]: 'Food & Beverage',
  [STORE_CATEGORIES.PHYSICAL_GOODS]: 'Physical Goods',
  [STORE_CATEGORIES.ON_SITE_SERVICE]: 'On-Site Service',
};

/** Valid status transitions per category (from Postman docs). */
export const WORKFLOW_TRANSITIONS = {
  [STORE_CATEGORIES.ON_PREMISE_SERVICE]: [
    'pending_payment',
    'paid',
    'scheduled',
    'in_service',
    'completed',
    'cancelled',
  ],
  [STORE_CATEGORIES.FOOD_BEVERAGE]: [
    'pending_payment',
    'paid',
    'preparing',
    'ready_for_dispatch',
    'dispatched',
    'completed',
    'cancelled',
  ],
  [STORE_CATEGORIES.PHYSICAL_GOODS]: [
    'pending_payment',
    'paid',
    'packaged',
    'dispatched',
    'arrived',
    'completed',
    'cancelled',
  ],
  [STORE_CATEGORIES.ON_SITE_SERVICE]: [
    'pending_payment',
    'paid',
    'assigned',
    'dispatched',
    'job_in_progress',
    'completed',
    'cancelled',
  ],
};

export const PHYSICAL_GOODS_KANBAN_LANES = [
  { key: 'incoming', label: 'Incoming', statuses: ['pending_payment', 'paid'] },
  { key: 'packaged', label: 'Packed & ready', statuses: ['packaged'] },
  { key: 'delivery', label: 'Out / arrived', statuses: ['dispatched', 'arrived'] },
  { key: 'done', label: 'Completed', statuses: ['completed', 'fulfilled'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
];

export const FOOD_KANBAN_LANES = [
  { key: 'incoming', label: 'Incoming / New', statuses: ['pending_payment', 'paid'] },
  { key: 'preparing', label: 'In Preparation', statuses: ['preparing'] },
  { key: 'ready', label: 'Ready for Dispatch', statuses: ['ready_for_dispatch'] },
  { key: 'out', label: 'Out for Delivery / Pickup', statuses: ['dispatched'] },
];

/** Dine-in uses real FOOD_BEVERAGE statuses (labels differ in kitchen UI). */
export const DINE_IN_TRANSITIONS = [
  'pending_payment',
  'paid',
  'preparing',
  'ready_for_dispatch',
  'completed',
  'cancelled',
];

export const DINE_IN_KANBAN_LANES = [
  { key: 'incoming', label: 'Incoming / New', statuses: ['pending_payment', 'paid'] },
  { key: 'preparing', label: 'In Preparation', statuses: ['preparing'] },
  { key: 'ready', label: 'Ready to Serve', statuses: ['ready_for_dispatch'] },
  { key: 'served', label: 'Served', statuses: ['completed'] },
];

export const SERVICE_KANBAN_LANES = [
  { key: 'incoming', label: 'Incoming', statuses: ['pending_payment', 'paid'] },
  { key: 'scheduled', label: 'Scheduled', statuses: ['scheduled', 'assigned'] },
  { key: 'active', label: 'In Service', statuses: ['in_service', 'job_in_progress'] },
  { key: 'done', label: 'Completed', statuses: ['completed'] },
];

export const STATUS_LABELS = {
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  scheduled: 'Scheduled',
  in_service: 'In Service',
  preparing: 'Preparing',
  ready_for_dispatch: 'Ready',
  dispatched: 'Dispatched',
  packaged: 'Packaged',
  arrived: 'Arrived',
  assigned: 'Assigned',
  job_in_progress: 'Job In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Guest-facing labels for dine-in kitchen progress. */
export const DINE_IN_STATUS_LABELS = {
  ...STATUS_LABELS,
  paid: 'Received',
  preparing: 'Preparing',
  ready_for_dispatch: 'Ready to serve',
  completed: 'Served',
};

export function statusLabelForOrder(order) {
  if (order?.fulfillment_type === 'dine_in') {
    return DINE_IN_STATUS_LABELS[order.status] ?? STATUS_LABELS[order.status] ?? order.status;
  }
  return STATUS_LABELS[order?.status] ?? order?.status ?? 'Pending';
}

export function getNextStatuses(category, currentStatus, fulfillmentType?: string) {
  const flow =
    category === STORE_CATEGORIES.FOOD_BEVERAGE && fulfillmentType === 'dine_in'
      ? DINE_IN_TRANSITIONS
      : (WORKFLOW_TRANSITIONS[category] ?? WORKFLOW_TRANSITIONS.PHYSICAL_GOODS);
  const idx = flow.indexOf(currentStatus);
  if (idx === -1 || idx >= flow.length - 2) return [];
  const next = flow[idx + 1];
  return next === 'cancelled' ? [] : [next];
}

export function resolveStoreCategory(store) {
  return store?.store_category ?? store?.category ?? STORE_CATEGORIES.PHYSICAL_GOODS;
}

export function isFoodStore(store) {
  return resolveStoreCategory(store) === STORE_CATEGORIES.FOOD_BEVERAGE;
}

export function isServiceStore(store) {
  const cat = resolveStoreCategory(store);
  return cat === STORE_CATEGORIES.ON_PREMISE_SERVICE || cat === STORE_CATEGORIES.ON_SITE_SERVICE;
}

export function usesInventory(store) {
  return resolveStoreCategory(store) === STORE_CATEGORIES.PHYSICAL_GOODS;
}
