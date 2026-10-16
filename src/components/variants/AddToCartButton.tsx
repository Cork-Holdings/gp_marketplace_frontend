import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { ProductVariantSelector } from '../variants/ProductVariantSelector';
import { ModifierGroupSelector } from '../variants/ModifierGroupSelector';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/context/useCart';
import { storefrontApi } from '@/lib/api/services';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { computeVariantPrice, inferAttributeSchema } from '@/lib/validations/variantSchema';

function hasSelectableModifiers(groups) {
  return (groups ?? []).some((group) => (group.modifiers ?? []).length > 0);
}

function filterSelectableGroups(groups) {
  return (groups ?? []).filter((group) => (group.modifiers ?? []).length > 0);
}

function defaultVariantSelection(product) {
  const variants = product?.variants ?? [];
  if (!variants.length) return null;
  const variant = variants[0];
  return {
    attributes: {},
    variant,
    variantId: variant?.id ?? null,
    unitPrice: computeVariantPrice(product?.price, variant),
  };
}

/**
 * Storefront add-to-cart with optional variant / modifier picker.
 * Opens a modal only when the product has variants or modifier groups;
 * otherwise adds in one tap.
 *
 * Pass `children` to use a custom trigger (e.g. a whole product card).
 */
export function AddToCartButton({
  product,
  onAdd,
  currency: _currency,
  className = '',
  disabled = false,
  children,
}: {
  product: any;
  onAdd: (...args: any[]) => void;
  currency?: string;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const { store, storeId } = useCart();
  const capabilities = useMarketplaceCapabilities(store);
  const variants = product?.variants ?? [];
  const hasVariants = variants.length > 0;
  const attributeSchema = useMemo(() => inferAttributeSchema(product), [product]);
  const needsVariantPicker = attributeSchema.length > 0;
  const showModifiers = Boolean(capabilities.supportsModifiers);

  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selection, setSelection] = useState(null);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [groupsReload, setGroupsReload] = useState(0);
  const [modifierSelection, setModifierSelection] = useState({
    selection: {},
    modifiers: [],
    priceDelta: 0,
    valid: true,
  });
  const [itemNotes, setItemNotes] = useState('');

  const handleSelectionChange = useCallback((next) => {
    setSelection(next);
  }, []);

  const resetModalState = useCallback(() => {
    setSelection(defaultVariantSelection(product));
    setModifierSelection({ selection: {}, modifiers: [], priceDelta: 0, valid: true });
    setItemNotes('');
  }, [product]);

  useEffect(() => {
    if (!open) return;
    resetModalState();
  }, [open, resetModalState]);

  useEffect(() => {
    if (!open || !showModifiers || !storeId || !product?.id) return;
    let cancelled = false;
    setGroupsLoading(true);
    setGroupsError('');
    storefrontApi
      .listModifierGroups(storeId, product.id)
      .then((groups) => {
        if (!cancelled) setModifierGroups(filterSelectableGroups(groups));
      })
      .catch(() => {
        if (!cancelled) setGroupsError('Options could not be loaded. Retry before adding this item so required choices are not missed.');
      })
      .finally(() => {
        if (!cancelled) setGroupsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, showModifiers, storeId, product?.id, groupsReload]);

  const addPlain = () => {
    const fallback = defaultVariantSelection(product);
    onAdd(product, 1, {
      variant: fallback?.variant,
      variantId: fallback?.variantId,
      attributes: fallback?.attributes,
      unitPrice: fallback?.unitPrice,
    });
  };

  const openModal = (preloadedGroups = undefined) => {
    if (preloadedGroups) setModifierGroups(filterSelectableGroups(preloadedGroups));
    setOpen(true);
  };

  const handleDirectAdd = async () => {
    if (checking || disabled) return;
    if (needsVariantPicker) {
      openModal();
      return;
    }
    if (!showModifiers || !storeId || !product?.id) {
      addPlain();
      return;
    }

    setChecking(true);
    try {
      const groups = await storefrontApi.listModifierGroups(storeId, product.id);
      if (hasSelectableModifiers(groups)) {
        openModal(groups);
      } else {
        addPlain();
      }
    } catch {
      // Required options must not be silently bypassed when their request fails.
      openModal();
    } finally {
      setChecking(false);
    }
  };

  const handleConfirm = () => {
    if (confirmDisabled) return;
    const fallback = selection ?? defaultVariantSelection(product);
    onAdd(product, 1, {
      variant: fallback?.variant,
      variantId: fallback?.variantId,
      attributes: fallback?.attributes,
      unitPrice: fallback?.unitPrice,
      modifiers: modifierSelection.modifiers,
      modifierSelection: modifierSelection.selection,
      itemNotes: itemNotes.trim() || undefined,
    });
    setOpen(false);
    setSelection(null);
    setItemNotes('');
  };

  const confirmDisabled =
    (hasVariants && !selection?.variantId && !selection?.variant) ||
    groupsLoading ||
    Boolean(groupsError) ||
    (modifierGroups.length > 0 && !modifierSelection.valid);

  const busy = checking || disabled;

  const label = checking ? 'Checking options…' : 'Add';

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={handleDirectAdd}
        className={className}
        aria-label={checking ? 'Checking item options' : `Add ${product?.name ?? 'item'} to cart`}
        aria-busy={checking}
      >
        {children ?? label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Customize — ${product.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={confirmDisabled}>
              Add to cart
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {needsVariantPicker && (
            <ProductVariantSelector product={product} onChange={handleSelectionChange} />
          )}
          {showModifiers && groupsLoading && <p className="text-xs text-forest-muted">Loading options…</p>}
          {showModifiers && groupsError && <div role="alert" className="space-y-2 text-sm text-danger-fg"><p>{groupsError}</p><Button variant="secondary" onClick={() => setGroupsReload(value => value + 1)}>Retry options</Button></div>}
          {showModifiers && modifierGroups.length > 0 && (
            <ModifierGroupSelector groups={modifierGroups} onChange={setModifierSelection} />
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-forest-muted">Special instructions</label>
            <textarea
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              rows={2}
              placeholder="e.g. no onions"
              className="field-input w-full"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

export default AddToCartButton;
