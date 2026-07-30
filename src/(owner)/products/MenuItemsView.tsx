import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import type { Product } from '@/types/product';

const Icons = {
  search: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  grid: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  list: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
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
  addons: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  eyeOff: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  ),
  eye: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
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
  plus: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  ),
};

function IconBtn({
  label,
  onClick,
  children,
  danger = false,
  accent = false,
  size = 'md',
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
  accent?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/35 active:scale-[0.96] ${
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
      } ${
        danger
          ? 'text-forest-muted/55 hover:bg-red-50 hover:text-red-600'
          : accent
            ? 'text-amber-700 hover:bg-amber-50'
            : 'text-forest-muted/55 hover:bg-sage-light hover:text-forest'
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

function ItemImage({
  product,
  className = '',
  showEightySixBadge = false,
}: {
  product: Product;
  className?: string;
  showEightySixBadge?: boolean;
}) {
  const available = product.is_active !== false;
  const initial = (product.name?.[0] ?? '?').toUpperCase();

  return (
    <div
      className={`relative overflow-hidden bg-sage-light ${className} ${!available ? 'opacity-60' : ''}`}
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
          <span className="text-base font-semibold tracking-tight text-forest-muted/35">{initial}</span>
        </div>
      )}
      {showEightySixBadge && !available && (
        <span className="absolute inset-x-0 bottom-0 bg-amber-600/95 px-1.5 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wider text-white">
          86&apos;d
        </span>
      )}
    </div>
  );
}

function ItemActions({
  available,
  onEdit,
  onAddons,
  onToggleActive,
  onDelete,
  size = 'md',
}: {
  available: boolean;
  onEdit: () => void;
  onAddons: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="flex items-center gap-0.5">
      <IconBtn label="Edit item" onClick={onEdit} size={size}>
        {Icons.edit}
      </IconBtn>
      <IconBtn label="Manage add-ons" onClick={onAddons} size={size}>
        {Icons.addons}
      </IconBtn>
      <IconBtn
        label={available ? 'Mark unavailable (86)' : 'Make available'}
        onClick={onToggleActive}
        accent={!available}
        size={size}
      >
        {available ? Icons.eyeOff : Icons.eye}
      </IconBtn>
      <IconBtn label="Delete item" onClick={onDelete} danger size={size}>
        {Icons.trash}
      </IconBtn>
    </div>
  );
}

function MenuItemCard({
  product,
  categoryName,
  showCategory = true,
  onEdit,
  onAddons,
  onToggleActive,
  onDelete,
}: {
  product: Product;
  categoryName?: string;
  showCategory?: boolean;
  onEdit: () => void;
  onAddons: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const available = product.is_active !== false;
  const meta = showCategory ? categoryName || 'No category' : null;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-white ring-1 transition ${
        available
          ? 'ring-cream-dark hover:ring-forest/20 hover:shadow-[0_8px_24px_-12px_rgba(8,12,48,0.18)]'
          : 'bg-amber-50/35 ring-amber-200/80'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-0.5 transition ${
          available ? 'bg-transparent group-hover:bg-forest/35' : 'bg-amber-500'
        }`}
      />

      <div className="relative flex min-h-[5.25rem] flex-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex min-w-0 flex-1 items-center gap-3 p-2.5 pl-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest/30"
          aria-label={`Edit ${product.name}`}
        >
          <ItemImage
            product={product}
            showEightySixBadge
            className="h-16 w-16 shrink-0 rounded-lg sm:h-[4.25rem] sm:w-[4.25rem]"
          />

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="truncate text-[13px] font-semibold leading-tight tracking-tight text-charcoal">
                {product.name}
              </h3>
              <p className="shrink-0 text-[13px] font-semibold tabular-nums text-forest">
                {formatCurrency(product.price)}
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-1.5">
              {meta && <span className="truncate text-[11px] text-forest-muted">{meta}</span>}
              {!available && (
                <span className="inline-flex shrink-0 items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  Off menu
                </span>
              )}
              {available && product.description && (
                <span
                  className={`truncate text-[11px] text-forest-muted/65 ${meta ? 'before:mr-1.5 before:content-["·"]' : ''}`}
                >
                  {product.description}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Desktop: hover/focus action chip */}
        <div
          className={`absolute bottom-1.5 right-1.5 z-10 hidden items-center rounded-lg bg-white/95 px-0.5 py-0.5 shadow-sm ring-1 ring-cream-dark/80 backdrop-blur-sm transition sm:flex sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 ${
            !available ? 'sm:pointer-events-auto sm:opacity-100' : ''
          }`}
        >
          <ItemActions
            available={available}
            onEdit={onEdit}
            onAddons={onAddons}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
            size="sm"
          />
        </div>
      </div>

      {/* Mobile: always-visible action strip */}
      <div className="flex items-center justify-end border-t border-cream-dark/60 bg-sage-light/20 px-1.5 py-1 sm:hidden">
        <ItemActions
          available={available}
          onEdit={onEdit}
          onAddons={onAddons}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          size="sm"
        />
      </div>
    </article>
  );
}

function MenuItemRow({
  product,
  categoryName,
  onEdit,
  onAddons,
  onToggleActive,
  onDelete,
}: {
  product: Product;
  categoryName?: string;
  onEdit: () => void;
  onAddons: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const available = product.is_active !== false;

  return (
    <tr
      className={`group border-b border-cream-dark/60 last:border-0 hover:bg-sage-light/40 ${
        !available ? 'bg-amber-50/40' : ''
      }`}
    >
      <td className="px-3 py-2.5">
        <button
          type="button"
          onClick={onEdit}
          className="flex w-full items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30"
          aria-label={`Edit ${product.name}`}
        >
          <ItemImage product={product} showEightySixBadge className="h-11 w-11 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-charcoal">{product.name}</p>
            {product.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-forest-muted">{product.description}</p>
            )}
          </div>
        </button>
      </td>
      <td className="hidden px-3 py-2.5 text-sm text-forest-muted sm:table-cell">
        {categoryName ?? 'No category'}
      </td>
      <td className="px-3 py-2.5 text-sm font-medium tabular-nums text-forest">
        {formatCurrency(product.price)}
      </td>
      <td className="hidden px-3 py-2.5 md:table-cell">
        {available ? (
          <span className="text-sm text-forest-muted">On menu</span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Off menu
          </span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex justify-end opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <ItemActions
            available={available}
            onEdit={onEdit}
            onAddons={onAddons}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}

export type MenuItemsViewProps = {
  products: Product[];
  categories: Array<{ id: string; name: string }>;
  filtered: Product[];
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  availabilityFilter: string;
  onAvailabilityFilterChange: (v: string) => void;
  onClearFilters: () => void;
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onAddons: (product: Product) => void;
  onToggleActive: (product: Product) => void;
  onDelete: (product: Product) => void;
  deleteError?: unknown;
};

export function MenuItemsView({
  products,
  categories,
  filtered,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  onClearFilters,
  onAdd,
  onEdit,
  onAddons,
  onToggleActive,
  onDelete,
  deleteError,
}: MenuItemsViewProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) map[c.id] = c.name;
    return map;
  }, [categories]);

  const stats = useMemo(() => {
    const available = products.filter((p) => p.is_active !== false).length;
    const unassigned = products.filter((p) => !p.menu_category_id).length;
    return {
      total: products.length,
      available,
      unassigned,
    };
  }, [products]);

  const grouped = useMemo(() => {
    if (viewMode !== 'cards' || categoryFilter !== 'all') return null;
    const byCat: Record<string, Product[]> = {};
    const unassigned: Product[] = [];
    for (const p of filtered) {
      const catId = p.menu_category_id;
      if (!catId) {
        unassigned.push(p);
        continue;
      }
      if (!byCat[catId]) byCat[catId] = [];
      byCat[catId].push(p);
    }
    return { byCat, unassigned };
  }, [filtered, viewMode, categoryFilter]);

  const hasActiveFilters =
    Boolean(search.trim()) || categoryFilter !== 'all' || availabilityFilter !== 'all';

  const renderCard = (p: Product, opts?: { showCategory?: boolean }) => (
    <MenuItemCard
      key={p.id}
      product={p}
      categoryName={p.menu_category_id ? categoryNameById[p.menu_category_id] : undefined}
      showCategory={opts?.showCategory ?? true}
      onEdit={() => onEdit(p)}
      onAddons={() => onAddons(p)}
      onToggleActive={() => onToggleActive(p)}
      onDelete={() => onDelete(p)}
    />
  );

  const cardGridClass =
    'grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

  return (
    <div className="space-y-5">
      {products.length > 0 && (
        <p className="text-sm text-forest-muted">
          <span className="font-medium text-charcoal">{stats.total}</span> items
          <span className="mx-2 text-cream-dark">|</span>
          <span className="font-medium text-charcoal">{stats.available}</span> on menu
          {stats.unassigned > 0 && (
            <>
              <span className="mx-2 text-cream-dark">|</span>
              <span className="font-medium text-charcoal">{stats.unassigned}</span> need a category
            </>
          )}
        </p>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-forest-muted/70">
              {Icons.search}
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search menu items"
              className="h-10 w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm text-charcoal ring-1 ring-cream-dark placeholder:text-forest-muted/60 focus:outline-none focus:ring-2 focus:ring-forest/30"
            />
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto" role="group" aria-label="Layout">
            <button
              type="button"
              title="Card view"
              aria-label="Card view"
              aria-pressed={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition active:scale-[0.97] ${
                viewMode === 'cards'
                  ? 'bg-forest text-white'
                  : 'bg-white text-forest-muted ring-1 ring-cream-dark hover:text-charcoal'
              }`}
            >
              {Icons.grid}
            </button>
            <button
              type="button"
              title="List view"
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition active:scale-[0.97] ${
                viewMode === 'list'
                  ? 'bg-forest text-white'
                  : 'bg-white text-forest-muted ring-1 ring-cream-dark hover:text-charcoal'
              }`}
            >
              {Icons.list}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={categoryFilter === 'all'} onClick={() => onCategoryFilterChange('all')}>
            All
          </FilterChip>
          <FilterChip
            active={categoryFilter === 'unassigned'}
            onClick={() => onCategoryFilterChange('unassigned')}
          >
            Unassigned
          </FilterChip>
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              active={categoryFilter === c.id}
              onClick={() => onCategoryFilterChange(c.id)}
            >
              {c.name}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'available', 'unavailable'] as const).map((value) => {
            const labels = { all: 'Any status', available: 'On menu', unavailable: "86'd" };
            return (
              <FilterChip
                key={value}
                active={availabilityFilter === value}
                onClick={() => onAvailabilityFilterChange(value)}
              >
                {labels[value]}
              </FilterChip>
            );
          })}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-1 text-xs font-medium text-forest-muted underline-offset-2 hover:text-forest hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {deleteError && <ErrorState error={deleteError} />}

      {products.length === 0 ? (
        <EmptyState
          title="No menu items yet"
          description="Add your first dish or drink. Guests will see it on your storefront once it is available and assigned to a category."
          actionLabel="Add first item"
          onAction={onAdd}
          icon={Icons.plus}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different search or filter."
          actionLabel="Clear filters"
          onAction={onClearFilters}
        />
      ) : viewMode === 'list' ? (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-cream-dark">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-cream-dark text-xs text-forest-muted">
                  <th className="px-3 py-2.5 font-medium">Item</th>
                  <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Category</th>
                  <th className="px-3 py-2.5 font-medium">Price</th>
                  <th className="hidden px-3 py-2.5 font-medium md:table-cell">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <MenuItemRow
                    key={p.id}
                    product={p}
                    categoryName={p.menu_category_id ? categoryNameById[p.menu_category_id] : undefined}
                    onEdit={() => onEdit(p)}
                    onAddons={() => onAddons(p)}
                    onToggleActive={() => onToggleActive(p)}
                    onDelete={() => onDelete(p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : grouped && categoryFilter === 'all' ? (
        <div className="space-y-7">
          {categories.map((c) => {
            const items = grouped.byCat[c.id] ?? [];
            if (!items.length) return null;
            return (
              <section key={c.id}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-charcoal">{c.name}</h2>
                  <span className="text-xs tabular-nums text-forest-muted">{items.length}</span>
                </div>
                <div className={cardGridClass}>
                  {items.map((p) => renderCard(p, { showCategory: false }))}
                </div>
              </section>
            );
          })}
          {grouped.unassigned.length > 0 && (
            <section>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="text-sm font-semibold tracking-tight text-charcoal">Unassigned</h2>
                <span className="text-xs text-forest-muted">
                  {grouped.unassigned.length} items. Assign in{' '}
                  <Link to="/portal/owner/menu" className="font-medium text-forest hover:underline">
                    Menu
                  </Link>
                </span>
              </div>
              <div className={cardGridClass}>
                {grouped.unassigned.map((p) => renderCard(p, { showCategory: false }))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className={cardGridClass}>
          {filtered.map((p) => renderCard(p))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-forest-muted">
          Showing {filtered.length} of {products.length}
        </p>
      )}
    </div>
  );
}

export default MenuItemsView;
