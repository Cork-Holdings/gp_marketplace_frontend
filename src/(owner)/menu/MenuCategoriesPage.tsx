import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { useAsync } from '@/hooks/useAsync';
import { ownerApi } from '@/lib/api/services';
import { normalizeMenuCategoryList, normalizeProductList } from '@/lib/normalizeApi';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { useConfirm } from '@/hooks/useConfirm';
import { formatCurrency } from '@/lib/utils';
import type { MenuCategory } from '@/types/menuCategory';
import type { Product } from '@/types/product';
import { suggestedMenuSection } from '@/lib/menuSuggestions';
import './menu-placement.css';

type PageTab = 'sections' | 'placement';

const Icons = {
  search: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  edit: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  ),
  trash: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
  up: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ),
  down: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  external: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  ),
  plus: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  folder: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  ),
};

function IconBtn({
  label,
  onClick,
  children,
  danger = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30 ${
        danger
          ? 'text-forest-muted/60 hover:bg-red-50 hover:text-red-600'
          : 'text-forest-muted/60 hover:bg-sage-light hover:text-forest'
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
        active
          ? 'bg-forest text-white'
          : 'bg-white text-forest-muted ring-1 ring-cream-dark hover:text-charcoal'
      }`}
    >
      {children}
    </button>
  );
}

function ItemThumb({ product }: { product: Product }) {
  if (product.image_url) {
    return (
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-sage-light">
        <img src={product.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  const initial = (product.name?.[0] ?? '?').toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-light"
      aria-hidden="true"
    >
      <span className="text-sm font-semibold text-forest-muted/40">{initial}</span>
    </div>
  );
}

function PlacementRow({
  storeId,
  product,
  categories,
  assignedId,
  onMove,
  busy,
}: {
  storeId: string;
  product: Product;
  categories: MenuCategory[];
  assignedId?: string;
  onAssigned: () => void;
  onSaveMessage: (message: string) => void;
  onMove: (product: Product, categoryId: string) => Promise<void>;
  busy: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const handleChange = async (categoryId: string) => {
    setSaving(true);
    setError(false);
    try {
      await onMove(product, categoryId);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="menu-placement-row flex items-center gap-3 px-3 py-2.5 hover:bg-cream/40">
      <button type="button" className="menu-drag-handle" draggable={!busy && !saving} disabled={busy || saving} aria-label={`Drag ${product.name}; use the section selector to move without dragging`} title="Drag to a section, or use the section selector" onDragStart={event => { event.dataTransfer.setData('application/x-geepay-menu-item', `${storeId}:${product.id}`); event.dataTransfer.effectAllowed = 'move'; }}>
        <svg width="18" height="24" viewBox="0 0 18 24" fill="currentColor" aria-hidden="true">{[6,12,18].flatMap(y => [6,12].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />))}</svg>
      </button>
      <ItemThumb product={product} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-charcoal">{product.name}</p>
        <p className="text-xs tabular-nums text-forest-muted">{formatCurrency(product.price)}</p>
        {error ? <p className="text-xs text-red-600">Couldn’t save — try again</p> : null}
        {!assignedId && suggestedMenuSection(product.name) && categories.some(c => c.name.toLowerCase() === suggestedMenuSection(product.name)?.toLowerCase()) && <button type="button" className="menu-suggestion" disabled={saving || busy} onClick={() => handleChange(categories.find(c => c.name.toLowerCase() === suggestedMenuSection(product.name)?.toLowerCase())!.id)}>Suggested: {suggestedMenuSection(product.name)} · Move</button>}
      </div>
      <select
        value={assignedId ?? ''}
        disabled={saving || busy}
        onChange={(e) => handleChange(e.target.value)}
        aria-label={`Section for ${product.name}`}
        className="h-9 max-w-[10rem] shrink-0 appearance-none truncate rounded-lg bg-white px-2.5 text-xs font-medium text-charcoal ring-1 ring-cream-dark focus:outline-none focus:ring-2 focus:ring-forest/30 disabled:opacity-50 sm:max-w-[12rem]"
      >
        <option value="">Unassigned</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function MenuCategoriesPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStore, selectedStoreId } = useMarketplace();
  const capabilities = useMarketplaceCapabilities(selectedStore);
  const { confirm, dialog } = useConfirm();
  const [activeTab, setActiveTab] = useState<PageTab>('sections');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const movingRef = useRef(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const saveMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: categoryData,
    loading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useAsync(
    () => (selectedStoreId ? ownerApi.listMenuCategories(selectedStoreId) : Promise.resolve([])),
    [selectedStoreId],
  );

  const {
    data: productData,
    loading: productsLoading,
    error: productsError,
    retry: retryProducts,
  } = useAsync(
    () => (selectedStoreId ? ownerApi.listProducts(selectedStoreId) : Promise.resolve([])),
    [selectedStoreId],
  );

  const categories = normalizeMenuCategoryList(categoryData);
  const products = normalizeProductList(productData);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [categories],
  );

  const assignments = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of products) {
      if (p.menu_category_id) map[p.id] = p.menu_category_id;
    }
    return map;
  }, [products]);

  const stats = useMemo(() => {
    const unassigned = products.filter((p) => !p.menu_category_id).length;
    return {
      sections: categories.length,
      total: products.length,
      unassigned,
    };
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (unassignedOnly) list = list.filter((p) => !p.menu_category_id);
    const q = itemSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
    );
  }, [products, itemSearch, unassignedOnly]);

  const grouped = useMemo(() => {
    const byCat: Record<string, Product[]> = {};
    const unassigned: Product[] = [];
    for (const p of filteredProducts) {
      const catId = assignments[p.id];
      if (!catId) {
        unassigned.push(p);
        continue;
      }
      if (!byCat[catId]) byCat[catId] = [];
      byCat[catId].push(p);
    }
    return { byCat, unassigned };
  }, [filteredProducts, assignments]);

  const storefrontUrl = selectedStore?.slug ? `/store/${selectedStore.slug}` : null;

  useEffect(() => {
    return () => {
      if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
    };
  }, []);

  const showSaveMessage = (message: string) => {
    setSaveMessage(message);
    if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
    saveMessageTimer.current = setTimeout(() => setSaveMessage(null), 2800);
  };

  const moveItem = async (product: Product, categoryId: string) => {
    if (!selectedStoreId || movingRef.current || !products.some(p => p.id === product.id) || (categoryId && !categories.some(c => c.id === categoryId)) || (assignments[product.id] || '') === categoryId) return;
    movingRef.current = true; setMoving(true); setMoveError(null);
    try {
      await ownerApi.assignProductCategory(selectedStoreId, product.id, categoryId || null);
      await retryProducts();
      showSaveMessage(`${product.name} moved to ${categories.find(c => c.id === categoryId)?.name || 'Unassigned'}.`);
    } catch {
      setMoveError('The move could not be saved. The item has not been moved here. Check the list and try again.');
      throw new Error('Menu placement failed');
    } finally { movingRef.current = false; setMoving(false); setDropTarget(null); }
  };
  const dropItem = (event: React.DragEvent, categoryId: string) => {
    event.preventDefault(); setDropTarget(null);
    const token = event.dataTransfer.getData('application/x-geepay-menu-item');
    const product = products.find(p => `${selectedStoreId}:${p.id}` === token);
    if (product) void moveItem(product, categoryId).catch(() => {});
  };

  if (!isStoreOwner) return <Navigate to="/portal" replace />;
  if (selectedStore && !capabilities.isFood) return <Navigate to="/portal/owner/products" replace />;

  const openCreateCategory = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '' });
    setCategoryModalOpen(true);
  };

  const openEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setForm({ name: category.name ?? '', description: category.description ?? '' });
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setEditingCategory(null);
    setForm({ name: '', description: '' });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;
    setSubmitting(true);
    try {
      if (editingCategory) {
        await ownerApi.updateMenuCategory(selectedStoreId, editingCategory.id, {
          name: form.name,
          description: form.description || null,
        });
        showSaveMessage(`Updated “${form.name.trim()}”`);
      } else {
        await ownerApi.createMenuCategory(selectedStoreId, {
          ...form,
          sort_order: categories.length,
        });
        showSaveMessage(`Created “${form.name.trim()}”`);
      }
      closeCategoryModal();
      retryCategories();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string, name: string) => {
    if (!selectedStoreId) return;
    const ok = await confirm({
      title: 'Delete menu section?',
      description: `“${name}” will be removed. Items in this section will become unassigned.`,
      confirmLabel: 'Delete section',
      tone: 'danger',
    });
    if (!ok) return;
    await ownerApi.deleteMenuCategory(selectedStoreId, categoryId);
    showSaveMessage(`Deleted “${name}”`);
    retryCategories();
    retryProducts();
  };

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    if (!selectedStoreId || reorderingId) return;
    const idx = sortedCategories.findIndex((c) => c.id === categoryId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sortedCategories.length) return;

    const current = sortedCategories[idx];
    const neighbor = sortedCategories[swapIdx];
    const currentOrder = current.sort_order ?? idx;
    const neighborOrder = neighbor.sort_order ?? swapIdx;

    setReorderingId(categoryId);
    try {
      await Promise.all([
        ownerApi.updateMenuCategory(selectedStoreId, current.id, { sort_order: neighborOrder }),
        ownerApi.updateMenuCategory(selectedStoreId, neighbor.id, { sort_order: currentOrder }),
      ]);
      retryCategories();
    } finally {
      setReorderingId(null);
    }
  };

  const focusUnassigned = () => {
    setActiveTab('placement');
    setUnassignedOnly(true);
    setItemSearch('');
  };

  return (
    <div className="space-y-5">
      {dialog}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">Menu</h1>
          <p className="mt-1 max-w-lg text-sm text-forest-muted">
            Sections guests see on your storefront. Add dishes in{' '}
            <Link to="/portal/owner/products" className="font-medium text-forest hover:underline">
              Items
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          {storefrontUrl ? (
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-medium text-forest-muted ring-1 ring-cream-dark transition hover:text-charcoal"
            >
              Preview
              {Icons.external}
            </a>
          ) : null}
          <Button
            type="button"
            onClick={openCreateCategory}
            disabled={!selectedStoreId}
            className="gap-1.5"
          >
            {Icons.plus}
            Add section
          </Button>
        </div>
      </header>

      {!selectedStoreId ? (
        <p className="text-sm text-forest-muted">Select a branch to manage your menu.</p>
      ) : (
        <>
          {(stats.sections > 0 || stats.total > 0) && (
            <p className="text-sm text-forest-muted">
              <span className="font-medium text-charcoal">{stats.sections}</span> sections
              <span className="mx-2 text-cream-dark">|</span>
              <span className="font-medium text-charcoal">{stats.total}</span> items
              {stats.unassigned > 0 && (
                <>
                  <span className="mx-2 text-cream-dark">|</span>
                  <button
                    type="button"
                    onClick={focusUnassigned}
                    className="font-medium text-amber-800 underline-offset-2 hover:underline"
                  >
                    {stats.unassigned} need a section
                  </button>
                </>
              )}
            </p>
          )}

          <div className="flex items-center gap-1 border-b border-cream-dark" role="tablist" aria-label="Menu">
            {(
              [
                { id: 'sections' as const, label: 'Sections' },
                { id: 'placement' as const, label: 'Placement' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative -mb-px px-3 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'text-charcoal'
                    : 'text-forest-muted hover:text-charcoal'
                }`}
              >
                {tab.label}
                {tab.id === 'placement' && stats.unassigned > 0 ? (
                  <span className="ml-1.5 text-xs font-semibold text-amber-700">{stats.unassigned}</span>
                ) : null}
                {activeTab === tab.id ? (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-forest" />
                ) : null}
              </button>
            ))}
          </div>

          {saveMessage ? (
            <p className="text-sm text-forest" role="status" aria-live="polite">
              {saveMessage}
            </p>
          ) : null}

          {activeTab === 'sections' ? (
            <div className="space-y-3">
              {categoriesLoading ? (
                <TableSkeleton rows={3} cols={2} />
              ) : categoriesError ? (
                <ErrorState error={categoriesError} onRetry={retryCategories} />
              ) : sortedCategories.length === 0 ? (
                <EmptyState
                  title="No sections yet"
                  description="Add Starters, Mains, Drinks — guests browse your menu by these sections."
                  actionLabel="Add section"
                  onAction={openCreateCategory}
                  icon={Icons.folder}
                />
              ) : (
                <ul className="overflow-hidden rounded-xl bg-white ring-1 ring-cream-dark">
                  {sortedCategories.map((c, index) => {
                    const count = products.filter((p) => assignments[p.id] === c.id).length;
                    const isFirst = index === 0;
                    const isLast = index === sortedCategories.length - 1;
                    return (
                      <li
                        key={c.id}
                        className="flex items-center gap-2 border-b border-cream-dark px-2 py-2 last:border-b-0 sm:gap-3 sm:px-3"
                      >
                        <div className="flex shrink-0 items-center">
                          <IconBtn
                            label={`Move ${c.name} up`}
                            disabled={isFirst || reorderingId === c.id}
                            onClick={() => moveCategory(c.id, 'up')}
                          >
                            {Icons.up}
                          </IconBtn>
                          <IconBtn
                            label={`Move ${c.name} down`}
                            disabled={isLast || reorderingId === c.id}
                            onClick={() => moveCategory(c.id, 'down')}
                          >
                            {Icons.down}
                          </IconBtn>
                        </div>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-light text-forest-muted">
                          <span className="text-xs font-bold tabular-nums">{index + 1}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-charcoal">{c.name}</p>
                          <p className="truncate text-xs text-forest-muted">
                            {count} item{count === 1 ? '' : 's'}
                            {c.description ? ` · ${c.description}` : ''}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <IconBtn label={`Edit ${c.name}`} onClick={() => openEditCategory(c)}>
                            {Icons.edit}
                          </IconBtn>
                          <IconBtn
                            label={`Delete ${c.name}`}
                            danger
                            onClick={() => handleDelete(c.id, c.name)}
                          >
                            {Icons.trash}
                          </IconBtn>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {sortedCategories.length > 1 ? (
                <p className="text-xs text-forest-muted">Order here is the order guests see on your storefront.</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <section className="menu-drop-section" aria-label="Move items to a section">
                <h2>Place items in sections</h2><p>Drag an item’s handle onto a section below, or use its section selector.</p>
                <div className="menu-drop-targets">{[...sortedCategories.map(c => ({ id: c.id, name: c.name })), { id: '', name: 'Unassigned' }].map(c => <div key={c.id} className={`menu-drop-target${dropTarget === c.id ? ' is-over' : ''}${moving ? ' is-busy' : ''}`} onDragOver={event => { if (!moving && event.dataTransfer.types.includes('application/x-geepay-menu-item')) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropTarget(c.id); } }} onDragLeave={() => setDropTarget(null)} onDrop={event => dropItem(event, c.id)}><strong>{c.name}</strong><span>{products.filter(p => (assignments[p.id] || '') === c.id).length} items · Drop here</span></div>)}</div>
                <div className="menu-section-suggestions">{Array.from(new Set(products.filter(p => !p.menu_category_id).map(p => suggestedMenuSection(p.name)).filter((name): name is string => Boolean(name)))).filter(name => !categories.some(c => c.name.toLowerCase() === name.toLowerCase())).map(name => <button key={name} type="button" disabled={moving || submitting} onClick={() => { setEditingCategory(null); setForm({ name, description: '' }); setCategoryModalOpen(true); }}>Suggested section: {name} · Add</button>)}</div>
                {moving && <p role="status">Saving placement…</p>}{moveError && <p className="menu-placement-error" role="alert">{moveError}</p>}
              </section>
              <div className="space-y-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-forest-muted/70">
                    {Icons.search}
                  </span>
                  <label htmlFor="menu-item-search" className="sr-only">
                    Search items
                  </label>
                  <input
                    id="menu-item-search"
                    type="search"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search items"
                    className="h-10 w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm text-charcoal ring-1 ring-cream-dark placeholder:text-forest-muted/60 focus:outline-none focus:ring-2 focus:ring-forest/30"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <FilterChip active={!unassignedOnly} onClick={() => setUnassignedOnly(false)}>
                    All items
                  </FilterChip>
                  <FilterChip active={unassignedOnly} onClick={() => setUnassignedOnly(true)}>
                    Unassigned{stats.unassigned > 0 ? ` (${stats.unassigned})` : ''}
                  </FilterChip>
                  {(unassignedOnly || itemSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemSearch('');
                        setUnassignedOnly(false);
                      }}
                      className="ml-1 text-xs font-medium text-forest-muted underline-offset-2 hover:text-forest hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {productsLoading ? (
                <TableSkeleton rows={4} cols={2} />
              ) : productsError ? (
                <ErrorState error={productsError} onRetry={retryProducts} />
              ) : products.length === 0 ? (
                <EmptyState
                  title="No items yet"
                  description="Add dishes first, then place them into sections here."
                  actionLabel="Go to Items"
                  actionTo="/portal/owner/products"
                />
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  title="No matches"
                  description={
                    unassignedOnly ? 'Every item is already in a section.' : 'Try a different search.'
                  }
                  actionLabel="Clear filters"
                  onAction={() => {
                    setItemSearch('');
                    setUnassignedOnly(false);
                  }}
                />
              ) : unassignedOnly || sortedCategories.length === 0 ? (
                <div className="overflow-hidden rounded-xl bg-white ring-1 ring-cream-dark">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="border-b border-cream-dark last:border-b-0">
                      <PlacementRow
                        storeId={selectedStoreId}
                        product={p}
                        categories={sortedCategories}
                        assignedId={assignments[p.id]}
                        onAssigned={retryProducts}
                        onSaveMessage={showSaveMessage}
                      onMove={moveItem} busy={moving}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedCategories.map((c) => {
                    const items = grouped.byCat[c.id] ?? [];
                    return (
                      <section key={c.id}>
                        <div className="mb-2 flex items-baseline gap-2">
                          <h2 className="text-sm font-semibold text-charcoal">{c.name}</h2>
                          <span className="text-xs text-forest-muted">{items.length}</span>
                        </div>
                        {items.length === 0 ? (
                          <p className="rounded-xl bg-white/60 px-3 py-4 text-sm text-forest-muted ring-1 ring-dashed ring-cream-dark">
                            Nothing in this section yet
                          </p>
                        ) : (
                          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-cream-dark">
                            {items.map((p) => (
                              <div key={p.id} className="border-b border-cream-dark last:border-b-0">
                                <PlacementRow
                                  storeId={selectedStoreId}
                                  product={p}
                                  categories={sortedCategories}
                                  assignedId={assignments[p.id]}
                                  onAssigned={retryProducts}
                                  onSaveMessage={showSaveMessage}
                                  onMove={moveItem} busy={moving}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}

                  {grouped.unassigned.length > 0 ? (
                    <section>
                      <div className="mb-2 flex items-baseline gap-2">
                        <h2 className="text-sm font-semibold text-charcoal">Unassigned</h2>
                        <span className="text-xs text-amber-800">{grouped.unassigned.length} not on the guest menu</span>
                      </div>
                      <div className="overflow-hidden rounded-xl bg-amber-50/40 ring-1 ring-amber-200/80">
                        {grouped.unassigned.map((p) => (
                          <div key={p.id} className="border-b border-amber-200/60 last:border-b-0">
                            <PlacementRow
                              storeId={selectedStoreId}
                              product={p}
                              categories={sortedCategories}
                              assignedId={assignments[p.id]}
                              onAssigned={retryProducts}
                              onSaveMessage={showSaveMessage}
                              onMove={moveItem} busy={moving}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              )}

              {filteredProducts.length > 0 ? (
                <p className="text-xs text-forest-muted">
                  Showing {filteredProducts.length} of {products.length}
                </p>
              ) : null}
            </div>
          )}
        </>
      )}

      <Modal
        open={categoryModalOpen}
        onClose={closeCategoryModal}
        title={editingCategory ? `Edit “${editingCategory.name}”` : 'Add menu section'}
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={closeCategoryModal} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="category-form" size="sm" disabled={submitting}>
              {submitting ? 'Saving…' : editingCategory ? 'Save' : 'Create section'}
            </Button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label htmlFor="mc-name" className="mb-1 block text-xs font-medium text-forest-muted">
              Section name
            </label>
            <input
              id="mc-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Starters, Mains, Drinks"
              className="field-input"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="mc-description" className="mb-1 block text-xs font-medium text-forest-muted">
              Internal note <span className="font-normal">(optional)</span>
            </label>
            <input
              id="mc-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Not shown to guests"
              className="field-input"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
