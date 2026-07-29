import { useState } from 'react';
import { ownerApi } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { TableSkeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useConfirm } from '@/hooks/useConfirm';
import type { ModifierGroup } from '@/types/modifier';

function GroupEditor({ storeId, productId, group, onChanged }: { storeId: string; productId: string; group: ModifierGroup; onChanged: () => void }) {
  const [modifierName, setModifierName] = useState('');
  const [modifierPrice, setModifierPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useConfirm();

  const handleAddModifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifierName.trim()) return;
    setSaving(true);
    try {
      await ownerApi.updateModifierGroup(storeId, group.id, {
        modifiers: [
          ...(group.modifiers ?? []),
          { id: `${productId}-${modifierName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, name: modifierName.trim(), price_delta: parseFloat(modifierPrice) || 0 },
        ],
      });
      setModifierName('');
      setModifierPrice('');
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveModifier = async (modifierId: string) => {
    await ownerApi.updateModifierGroup(storeId, group.id, {
      modifiers: (group.modifiers ?? []).filter((m) => m.id !== modifierId),
    });
    onChanged();
  };

  const handleDeleteGroup = async () => {
    const ok = await confirm({
      title: 'Delete add-on group?',
      description: `"${group.name}" and its options will be removed from this item.`,
      confirmLabel: 'Delete group',
      tone: 'danger',
    });
    if (!ok) return;
    await ownerApi.deleteModifierGroup(storeId, group.id);
    onChanged();
  };

  return (
    <div className="rounded-xl border border-cream-dark p-3">
      {dialog}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-medium text-charcoal">{group.name}</p>
          <p className="text-xs text-forest-muted">
            {group.selection_type === 'single' ? 'Single choice' : 'Multiple choice'}
            {group.required ? ' · Required' : ' · Optional'}
          </p>
        </div>
        <button type="button" onClick={handleDeleteGroup} className="text-xs font-medium text-red-600 hover:underline">
          Delete group
        </button>
      </div>

      <ul className="mb-2 space-y-1">
        {(group.modifiers ?? []).map((m) => (
          <li key={m.id} className="flex items-center justify-between text-sm">
            <span>
              {m.name} {parseFloat(String(m.price_delta ?? 0)) > 0 && `(+${formatCurrency(m.price_delta)})`}
            </span>
            <button type="button" onClick={() => handleRemoveModifier(m.id)} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddModifier} className="flex gap-2">
        <input
          value={modifierName}
          onChange={(e) => setModifierName(e.target.value)}
          placeholder="Option name"
          className="field-input flex-1"
        />
        <input
          value={modifierPrice}
          onChange={(e) => setModifierPrice(e.target.value)}
          placeholder="+Price"
          type="number"
          min="0"
          className="field-input w-24"
        />
        <Button type="submit" size="sm" disabled={saving}>Add</Button>
      </form>
    </div>
  );
}

function ProductModifiersModal({ storeId, product, open, onClose }) {
  const { data, loading, error, retry } = useAsync(
    () => (open ? ownerApi.listModifierGroups(storeId, product.id) : Promise.resolve([])),
    [open, storeId, product.id],
  );
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<'single' | 'multi'>('multi');
  const [creating, setCreating] = useState(false);

  const groups: ModifierGroup[] = Array.isArray(data) ? data : [];

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      await ownerApi.createModifierGroup(storeId, {
        product_id: product.id,
        name: newGroupName.trim(),
        selection_type: newGroupType,
        required: false,
        modifiers: [],
      });
      setNewGroupName('');
      retry();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add-ons — ${product.name}`} size="lg">
      <div className="space-y-4">
        {loading ? (
          <TableSkeleton rows={2} cols={1} />
        ) : error ? (
          <ErrorState error={error} onRetry={retry} />
        ) : groups.length === 0 ? (
          <p className="text-sm text-forest-muted">No add-on groups yet. Add toppings, sides, or extras guests can choose.</p>
        ) : (
          groups.map((g) => <GroupEditor key={g.id} storeId={storeId} productId={product.id} group={g} onChanged={retry} />)
        )}

        <form onSubmit={handleCreateGroup} className="flex flex-wrap items-end gap-2 border-t border-cream-dark pt-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-forest-muted">New group name</label>
            <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="field-input w-full" placeholder="e.g. Toppings" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-forest-muted">Type</label>
            <select value={newGroupType} onChange={(e) => setNewGroupType(e.target.value as 'single' | 'multi')} className="field-input">
              <option value="multi">Multiple choice</option>
              <option value="single">Single choice</option>
            </select>
          </div>
          <Button type="submit" disabled={creating}>Add group</Button>
        </form>
      </div>
    </Modal>
  );
}

/** Direct editor modal for a single product (used from Items page). */
export function ProductModifiersEditor({ storeId, product, open, onClose }) {
  if (!product) return null;
  return <ProductModifiersModal storeId={storeId} product={product} open={open} onClose={onClose} />;
}

export function ProductModifiersPanel({ storeId, products }) {
  const [activeProduct, setActiveProduct] = useState(null);

  return (
    <>
      <ul className="divide-y divide-cream-dark">
        {products.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2">
            <span className="font-medium text-charcoal">{p.name}</span>
            <button
              type="button"
              onClick={() => setActiveProduct(p)}
              className="text-xs font-medium text-forest hover:underline"
            >
              Manage add-ons
            </button>
          </li>
        ))}
      </ul>

      {activeProduct && (
        <ProductModifiersModal
          storeId={storeId}
          product={activeProduct}
          open={Boolean(activeProduct)}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </>
  );
}

export default ProductModifiersPanel;
