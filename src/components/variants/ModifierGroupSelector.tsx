import { useMemo, useState, useCallback, useEffect } from 'react';
import type { ModifierGroup } from '@/types/modifier';
import type { CartLineModifier } from '@/types/cart';
import { computeModifiersPrice, validateModifierSelection } from '@/lib/validations/modifierSchema';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/lib/locale';

export interface ModifierGroupSelectorChange {
  selection: Record<string, string[]>;
  modifiers: CartLineModifier[];
  priceDelta: number;
  valid: boolean;
}

/**
 * Add-on/modifier picker for food items — multiple independent groups
 * (required/optional, single/multi-select) with additive price deltas.
 * Parallel to ProductVariantSelector, but for menu modifiers rather than
 * single-combination product variants.
 */
export function ModifierGroupSelector({
  groups,
  onChange,
  currency = DEFAULT_CURRENCY,
}: {
  groups: ModifierGroup[];
  onChange?: (change: ModifierGroupSelectorChange) => void;
  currency?: string;
}) {
  const [selection, setSelection] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    groups.forEach((group) => {
      const modifiers = group.modifiers ?? [];
      const defaults = modifiers.filter((m) => m.is_default).map((m) => m.id);
      if (defaults.length) initial[group.id] = defaults;
    });
    return initial;
  });

  const emit = useCallback(
    (next: Record<string, string[]>) => {
      const selectedModifiers: CartLineModifier[] = [];
      let valid = true;
      groups.forEach((group) => {
        const ids = next[group.id] ?? [];
        const result = validateModifierSelection(group, ids);
        if (!result.valid) valid = false;
        (group.modifiers ?? [])
          .filter((m) => ids.includes(m.id))
          .forEach((m) => {
            selectedModifiers.push({
              group_id: group.id,
              group_name: group.name,
              modifier_id: m.id,
              name: m.name,
              price_delta: parseFloat(String(m.price_delta ?? 0)) || 0,
            });
          });
      });
      onChange?.({
        selection: next,
        modifiers: selectedModifiers,
        priceDelta: computeModifiersPrice(selectedModifiers),
        valid,
      });
    },
    [groups, onChange],
  );

  // Emit the default selection once on mount so callers start with an accurate valid/priceDelta state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => emit(selection), []);

  const totalDelta = useMemo(() => {
    const flatIds = Object.values(selection).flat();
    return groups.reduce((sum, group) => {
      const groupSum = (group.modifiers ?? [])
        .filter((m) => flatIds.includes(m.id))
        .reduce((s, m) => s + (parseFloat(String(m.price_delta ?? 0)) || 0), 0);
      return sum + groupSum;
    }, 0);
  }, [groups, selection]);

  const toggleSingle = (group: ModifierGroup, modifierId: string) => {
    const next = { ...selection, [group.id]: [modifierId] };
    setSelection(next);
    emit(next);
  };

  const toggleMulti = (group: ModifierGroup, modifierId: string) => {
    const current = selection[group.id] ?? [];
    const nextIds = current.includes(modifierId)
      ? current.filter((id) => id !== modifierId)
      : [...current, modifierId];
    const next = { ...selection, [group.id]: nextIds };
    setSelection(next);
    emit(next);
  };

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const selectedIds = selection[group.id] ?? [];
        const result = validateModifierSelection(group, selectedIds);
        return (
          <div key={group.id}>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-forest-muted">
                {group.name}
                {group.required && <span className="text-red-500"> *</span>}
              </label>
              {group.selection_type === 'multi' && (
                <span className="text-[10px] uppercase text-forest-muted/70">Choose any</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(group.modifiers ?? []).map((modifier) => {
                const active = selectedIds.includes(modifier.id);
                const delta = parseFloat(String(modifier.price_delta ?? 0)) || 0;
                return (
                  <button
                    key={modifier.id}
                    type="button"
                    onClick={() =>
                      group.selection_type === 'single'
                        ? toggleSingle(group, modifier.id)
                        : toggleMulti(group, modifier.id)
                    }
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? 'border-forest bg-forest text-cream'
                        : 'border-cream-dark bg-white text-charcoal hover:border-forest-muted'
                    }`}
                  >
                    {modifier.name}
                    {delta > 0 && <span className="ml-1 text-xs opacity-80">+{formatCurrency(delta, currency)}</span>}
                  </button>
                );
              })}
            </div>
            {!result.valid && <p className="mt-1 text-xs text-amber-700">{result.reason}</p>}
          </div>
        );
      })}

      <div className="flex items-center justify-between rounded-lg bg-cream/60 px-3 py-2">
        <span className="text-xs text-forest-muted">Extras total</span>
        <span className="font-semibold text-charcoal">{formatCurrency(totalDelta, currency)}</span>
      </div>
    </div>
  );
}

export default ModifierGroupSelector;
