import { RecordListTable } from '@/components/common/RecordListTable';
import { useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { useAsync } from '@/hooks/useAsync';
import { ProductVariantForm } from '@/components/variants/ProductVariantForm';
import { FoodItemForm } from './FoodItemForm';
import { MenuItemsView } from './MenuItemsView';
import { ProductModifiersPanel } from './ProductModifiersPanel';
import { ownerApi } from '@/lib/api/services';
import { normalizeMenuCategoryList, normalizeProductList } from '@/lib/normalizeApi';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useConfirm } from '@/hooks/useConfirm';
import { purchaseActionLabel, purchaseFlowFor } from '@/lib/purchaseFlow';
import { UserFacingError, userMessage } from '@/lib/userMessage';
import { showToast } from '@/lib/actionFeedback';
import { usePlan } from '@/lib/context/plan';

function productMatchesQuery(product, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    product.name?.toLowerCase().includes(q) ||
    product.description?.toLowerCase().includes(q) ||
    product.sku?.toLowerCase().includes(q)
  );
}

export default function MerchantProductsPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStore, selectedStoreId } = useMarketplace();
  const { category, usesInventory, isFood } = useMarketplaceCapabilities(selectedStore);
  const { data: activePlan } = usePlan();
  const canCreateStock = !usesInventory || Boolean(activePlan?.plan.data.features.includes('inventory'));
  const { confirm, dialog } = useConfirm();

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modifiersProduct, setModifiersProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [deleteError, setDeleteError] = useState(null);
  const createdProductRef = useRef<{ storeId: string; id: string } | null>(null);

  const {
    data: productData,
    loading,
    error,
    retry,
  } = useAsync(
    () => (selectedStoreId ? ownerApi.listProducts(selectedStoreId) : Promise.resolve([])),
    [selectedStoreId],
  );

  const { data: categoryData, retry: retryCategories } = useAsync(
    () => (selectedStoreId && isFood ? ownerApi.listMenuCategories(selectedStoreId) : Promise.resolve([])),
    [selectedStoreId, isFood],
  );

  const products = normalizeProductList(productData);
  const categories = normalizeMenuCategoryList(categoryData);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!productMatchesQuery(p, search.trim())) return false;
      if (availabilityFilter === 'available' && p.is_active === false) return false;
      if (availabilityFilter === 'unavailable' && p.is_active !== false) return false;
      if (isFood && categoryFilter === 'unassigned' && p.menu_category_id) return false;
      if (isFood && categoryFilter !== 'all' && categoryFilter !== 'unassigned') {
        if (p.menu_category_id !== categoryFilter) return false;
      }
      return true;
    });
  }, [products, search, availabilityFilter, categoryFilter, isFood]);

  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  const closeForms = () => {
    if (submitting) return;
    setCreateOpen(false);
    setEditing(null);
    setFormError(null);
    createdProductRef.current = null;
  };

  const handleCreate = async (payload, imageFile) => {
    if (!selectedStoreId || !canCreateStock) return;
    setSubmitting(true);
    setFormError(null);
    try {
      let saved = createdProductRef.current;
      if (saved && saved.storeId !== selectedStoreId) throw new UserFacingError('Return to the original branch to finish saving this item, or close this form and start a new item.');
      if (!saved) {
        const created = await ownerApi.createProduct(selectedStoreId, payload);
        const product = created?.product ?? created;
        if (!product?.id) throw new UserFacingError('The save result could not be confirmed. Close this form and check the catalogue before adding this item again.');
        saved = { storeId: selectedStoreId, id: product.id };
        createdProductRef.current = saved;
      } else {
        const { name, sku, description, price, purchase_flow, is_active, image_url } = payload;
        await ownerApi.updateProduct(selectedStoreId, saved.id, { name, sku, description, price: price ?? payload.variants?.[0]?.price, purchase_flow, is_active, image_url });
      }
      if (imageFile) {
        await ownerApi.uploadProductImage(selectedStoreId, saved.id, imageFile);
      }
      if (isFood) {
        await ownerApi.assignProductCategory(selectedStoreId, saved.id, payload.menu_category_id || null);
      }
      setCreateOpen(false);
      createdProductRef.current = null;
      showToast(imageFile ? 'Item and photo saved. Your photo will appear wherever this item is listed.' : 'Item saved to your catalogue.');
      retry();
      retryCategories();
    } catch (err) {
      setFormError(createdProductRef.current ? new UserFacingError(`The item was created, but some changes could not be saved. ${userMessage(err, 'Check your connection and try again.')} Save again to finish this same item; it will not create a duplicate.`) : err);
      retry();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (payload, imageFile) => {
    if (!selectedStoreId || !editing?.id) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await ownerApi.updateProduct(selectedStoreId, editing.id, payload);
      if (imageFile) {
        await ownerApi.uploadProductImage(selectedStoreId, editing.id, imageFile);
      }
      if (isFood) {
        if (payload.clear_menu_category || !payload.menu_category_id) {
          await ownerApi.assignProductCategory(selectedStoreId, editing.id, null);
        } else if (payload.menu_category_id) {
          await ownerApi.assignProductCategory(selectedStoreId, editing.id, payload.menu_category_id);
        }
      }
      setEditing(null);
      showToast(imageFile ? 'Item and photo updated.' : 'Item updated.');
      retry();
    } catch (err) {
      setFormError(new UserFacingError(`Some changes could not be saved. ${userMessage(err, 'Check your connection and try again.')} Your selected photo is still here; save again to finish.`));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (product) => {
    if (!selectedStoreId) return;
    try {
      await ownerApi.updateProduct(selectedStoreId, product.id, {
        is_active: product.is_active === false,
      });
      retry();
    } catch (err) {
      setDeleteError(err);
    }
  };

  const handleDelete = async (product) => {
    if (!selectedStoreId) return;
    const ok = await confirm({
      title: isFood ? 'Remove menu item?' : 'Delete product?',
      description: `"${product.name}" will be removed from the catalog.`,
      confirmLabel: isFood ? 'Remove item' : 'Delete product',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleteError(null);
    try {
      await ownerApi.deleteProduct(selectedStoreId, product.id);
      retry();
    } catch (err) {
      setDeleteError(err);
    }
  };

  const itemLabel = isFood ? 'item' : usesInventory ? 'product' : 'service';

  return (
    <div className="space-y-6">
      {dialog}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            {isFood ? 'Menu items' : usesInventory ? 'Product Catalog' : 'Service Menu'}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-forest-muted">
            {isFood
              ? 'Manage dishes, prices, photos, and what is available to order.'
              : usesInventory
                ? 'Manage inventory with dynamic size and attribute variants.'
                : 'Configure bookable services and appointment slots.'}
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)} disabled={!selectedStoreId || !canCreateStock} aria-describedby={!canCreateStock ? 'catalogue-plan-note' : undefined} className="gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add {itemLabel}
        </Button>
      </header>

      {!canCreateStock && <p id="catalogue-plan-note" className="reference-notice">{activePlan ? 'Adding stocked products requires the Inventory module. Review your Subscription Plan or contact the administrator. Existing catalogue details and customer work remain accessible.' : 'Checking your plan before adding stocked products…'}</p>}

      {!selectedStoreId ? (
        <p className="text-sm text-forest-muted">Select a branch to manage the catalog.</p>
      ) : loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : isFood ? (
        <MenuItemsView
          products={products}
          categories={categories}
          filtered={filtered}
          search={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          availabilityFilter={availabilityFilter}
          onAvailabilityFilterChange={setAvailabilityFilter}
          onClearFilters={() => {
            setSearch('');
            setCategoryFilter('all');
            setAvailabilityFilter('all');
          }}
          onAdd={() => setCreateOpen(true)}
          onEdit={(p) => {
            setFormError(null);
            setEditing(p);
          }}
          onAddons={setModifiersProduct}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
          deleteError={deleteError}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="field-input min-w-[200px] flex-1"
            />
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="field-input w-auto"
              aria-label="Filter by availability"
            >
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {deleteError && <ErrorState error={deleteError} />}

          {products.length === 0 ? (
            <EmptyState
              title="No products yet"
              description="Add your first item to start selling from this branch."
              actionLabel={canCreateStock ? `Add ${itemLabel}` : undefined}
              onAction={canCreateStock ? () => setCreateOpen(true) : undefined}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matches"
              description="Try a different search or filter."
              actionLabel="Clear filters"
              onAction={() => {
                setSearch('');
                setAvailabilityFilter('all');
              }}
            />
          ) : (
            <div className="dashboard-card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <RecordListTable className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-cream-dark bg-cream/60 text-[11px] font-medium uppercase tracking-wide text-forest-muted">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Customer step</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-cream/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                          {p.image_url ? <img src={p.image_url} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-md border border-cream-dark object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-cream-dark bg-cream text-xs text-forest-muted">No photo</span>}
                          <div className="min-w-0">
                          <div className="font-medium text-charcoal">{p.name}</div>
                          {p.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-forest-muted">{p.description}</p>
                          )}
                          </div></div>
                        </td>
                        <td className="px-4 py-3 text-forest-muted">{p.sku || '—'}</td>
                        <td className="px-4 py-3 tabular-nums">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-3">{p.stock_quantity ?? '—'}</td>
                        <td className="px-4 py-3 text-forest-muted">{purchaseActionLabel(purchaseFlowFor(p, selectedStore))}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setFormError(null);
                                setEditing(p);
                              }}
                              className="text-xs font-medium text-forest hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </RecordListTable>
              </div>
              <p className="border-t border-cream-dark px-4 py-2 text-xs text-forest-muted">
                Showing {filtered.length} of {products.length}
              </p>
            </div>
          )}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={closeForms}
        title={isFood ? 'Add menu item' : usesInventory ? 'Add product' : 'Add service'}
        size="lg"
      >
        {isFood ? (
          <FoodItemForm
            categories={categories}
            onSubmit={handleCreate}
            submitting={submitting}
            embedded
            error={formError}
          />
        ) : (
          <ProductVariantForm
            category={category}
            storeType={selectedStore?.store_type}
            onSubmit={handleCreate}
            submitting={submitting}
            embedded
            error={formError}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={closeForms}
        title={isFood ? 'Edit menu item' : usesInventory ? 'Edit product' : 'Edit service'}
        size="lg"
      >
        {isFood && editing ? (
          <FoodItemForm
            initial={editing}
            categories={categories}
            onSubmit={handleUpdate}
            submitting={submitting}
            embedded
            error={formError}
          />
        ) : editing ? (
          <ProductVariantForm
            category={category}
            storeType={selectedStore?.store_type}
            onSubmit={handleUpdate}
            submitting={submitting}
            embedded
            error={formError}
            initial={editing}
          />
        ) : null}
      </Modal>

      {isFood && modifiersProduct && selectedStoreId && (
        <Modal
          open
          onClose={() => setModifiersProduct(null)}
          title={`Add-ons — ${modifiersProduct.name}`}
          size="lg"
        >
          <ProductModifiersPanel storeId={selectedStoreId} products={[modifiersProduct]} />
        </Modal>
      )}
    </div>
  );
}
