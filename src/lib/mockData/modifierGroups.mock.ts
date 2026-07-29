import { createMockCollection, type MockCollection } from './mockClient';
import type { Modifier, ModifierGroup } from '@/types/modifier';

type GroupTemplate = Pick<ModifierGroup, 'name' | 'selection_type' | 'required'> & {
  modifiers: Array<Omit<Modifier, 'id'> & { key: string }>;
};

const NAME_PATTERN_GROUPS: Array<{ match: RegExp; groups: GroupTemplate[] }> = [
  {
    match: /burger|sandwich|wrap/i,
    groups: [
      {
        name: 'Add-ons',
        selection_type: 'multi',
        required: false,
        modifiers: [
          { key: 'extra-cheese', name: 'Extra cheese', price_delta: 10 },
          { key: 'bacon', name: 'Bacon', price_delta: 15 },
          { key: 'avocado', name: 'Avocado', price_delta: 12 },
        ],
      },
      {
        name: 'Spice Level',
        selection_type: 'single',
        required: true,
        modifiers: [
          { key: 'mild', name: 'Mild', price_delta: 0, is_default: true },
          { key: 'medium', name: 'Medium', price_delta: 0 },
          { key: 'hot', name: 'Hot', price_delta: 0 },
        ],
      },
    ],
  },
  {
    match: /pizza/i,
    groups: [
      {
        name: 'Toppings',
        selection_type: 'multi',
        required: false,
        modifiers: [
          { key: 'mushroom', name: 'Mushroom', price_delta: 8 },
          { key: 'olives', name: 'Olives', price_delta: 8 },
          { key: 'extra-cheese', name: 'Extra cheese', price_delta: 10 },
        ],
      },
      {
        name: 'Crust',
        selection_type: 'single',
        required: true,
        modifiers: [
          { key: 'thin', name: 'Thin crust', price_delta: 0, is_default: true },
          { key: 'thick', name: 'Thick crust', price_delta: 5 },
        ],
      },
    ],
  },
];

const GENERIC_GROUP: GroupTemplate = {
  name: 'Extras',
  selection_type: 'multi',
  required: false,
  modifiers: [
    { key: 'extra-portion', name: 'Extra portion', price_delta: 20 },
    { key: 'takeaway-box', name: 'Takeaway box', price_delta: 5 },
  ],
};

function templatesForProduct(productName = ''): GroupTemplate[] {
  const matched = NAME_PATTERN_GROUPS.find((entry) => entry.match.test(productName));
  return matched ? matched.groups : [GENERIC_GROUP];
}

// Seeded empty: modifier groups are lazily created per-product on first
// request (see listModifierGroupsForProduct) since a store's product list
// isn't known at store-creation time.
export const modifierGroupCollection: MockCollection<ModifierGroup> = createMockCollection(
  'modifier_groups',
  () => [],
);

export async function listModifierGroupsForProduct(
  storeId: string,
  productId: string,
  productName = '',
): Promise<ModifierGroup[]> {
  const all = await modifierGroupCollection.list(storeId);
  const existing = all.filter((g) => g.product_id === productId);
  if (existing.length > 0) return existing;

  const created: ModifierGroup[] = [];
  for (const template of templatesForProduct(productName)) {
    const record = await modifierGroupCollection.create(storeId, {
      ...template,
      product_id: productId,
      modifiers: template.modifiers.map(
        (m): Modifier => ({
          id: `${productId}-${m.key}`,
          name: m.name,
          price_delta: m.price_delta,
          is_default: m.is_default,
        }),
      ),
    });
    created.push(record);
  }
  return created;
}
