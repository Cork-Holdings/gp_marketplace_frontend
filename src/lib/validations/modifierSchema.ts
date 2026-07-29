import type { ModifierGroup } from '@/types/modifier';

export function computeModifiersPrice(selectedModifiers: Array<{ price_delta?: number | string }> = []) {
  return selectedModifiers.reduce((sum, m) => sum + (parseFloat(String(m.price_delta ?? 0)) || 0), 0);
}

export interface ModifierValidationResult {
  valid: boolean;
  reason: string | null;
}

export function validateModifierSelection(group: ModifierGroup, selectedIds: string[]): ModifierValidationResult {
  const count = selectedIds.length;
  if (group.selection_type === 'single') {
    if (group.required && count !== 1) return { valid: false, reason: `Select an option for ${group.name}.` };
    if (count > 1) return { valid: false, reason: `Only one option allowed for ${group.name}.` };
    return { valid: true, reason: null };
  }
  const min = group.min_select ?? (group.required ? 1 : 0);
  const max = group.max_select ?? Infinity;
  if (count < min) return { valid: false, reason: `Select at least ${min} option(s) for ${group.name}.` };
  if (count > max) return { valid: false, reason: `Select at most ${max} option(s) for ${group.name}.` };
  return { valid: true, reason: null };
}

/** Deterministic string for a full multi-group modifier selection, used to extend cartLineKey. */
export function modifierSelectionKey(selection: Record<string, string[]> | undefined) {
  if (!selection) return '';
  return Object.entries(selection)
    .filter(([, ids]) => ids.length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupId, ids]) => `${groupId}:${[...ids].sort().join(',')}`)
    .join('|');
}
