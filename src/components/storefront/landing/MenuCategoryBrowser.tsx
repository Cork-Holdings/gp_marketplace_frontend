import { useEffect, useMemo, useRef } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { storefrontApi } from '@/lib/api/services';
import { normalizeMenuCategoryList, normalizeProductList } from '@/lib/normalizeApi';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '../../common/Skeleton';

const UNCATEGORIZED_KEY = '__uncategorized__';

/**
 * Food-store menu browsing grouped by menu category — replaces the flat
 * "Full Collection" grid for FOOD_BEVERAGE stores only. Non-food stores keep
 * the existing ShopGrid/CategoryGrid behavior untouched.
 *
 * The category → product mapping is derived from each product's own
 * `menu_category_id` field rather than a separate lookup, since the public
 * storefront has no product-category-map endpoint (owner-only).
 */
export function MenuCategoryBrowser({
  storeId,
  products,
  currency,
  onAdd,
  searchQuery = '',
  highlightCategoryId,
  stickyCategories = false,
  store,
}) {
  const { data: categoryData, loading: categoriesLoading } = useAsync(
    () => (storeId ? storefrontApi.listMenuCategories(storeId) : Promise.resolve([])),
    [storeId],
  );

  const categories = normalizeMenuCategoryList(categoryData);

  const productList = normalizeProductList(products);
  const filtered = searchQuery
    ? productList.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : productList;

  const sections = useMemo(() => {
    const byCategory: Record<string, any[]> = {};
    filtered.forEach((product) => {
      const categoryId = product.menu_category_id ?? UNCATEGORIZED_KEY;
      byCategory[categoryId] = byCategory[categoryId] ?? [];
      byCategory[categoryId].push(product);
    });

    const ordered = categories
      .filter((c) => byCategory[c.id]?.length)
      .map((c) => ({ id: c.id, name: c.name, products: byCategory[c.id] }));

    if (byCategory[UNCATEGORIZED_KEY]?.length) {
      ordered.push({ id: UNCATEGORIZED_KEY, name: 'Other', products: byCategory[UNCATEGORIZED_KEY] });
    }
    return ordered;
  }, [filtered, categories]);

  const scrolledRef = useRef(false);
  useEffect(() => {
    if (scrolledRef.current || !highlightCategoryId || sections.length === 0) return;
    const el = document.getElementById(`menu-${highlightCategoryId}`);
    if (el) {
      scrolledRef.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [highlightCategoryId, sections]);

  if (categoriesLoading) return <ProductGridSkeleton />;

  if (filtered.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-forest/20 py-16 text-center text-forest-muted">
        {searchQuery ? 'No menu items match your search.' : 'No menu items available yet.'}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <nav
        className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${
          stickyCategories
            ? 'sticky top-[7.25rem] z-20 -mx-4 bg-cream/95 px-4 py-3 backdrop-blur-md md:top-[7.5rem]'
            : 'flex-wrap'
        }`}
        aria-label="Menu categories"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#menu-${section.id}`}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              section.id === highlightCategoryId
                ? 'border-forest bg-forest text-cream'
                : 'border-cream-dark bg-white text-forest-muted hover:border-forest hover:text-forest'
            }`}
          >
            {section.name}
          </a>
        ))}
      </nav>

      {sections.map((section) => (
        <div key={section.id} id={`menu-${section.id}`}>
          <h3 className="mb-4 font-serif text-2xl text-charcoal">{section.name}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {section.products.map((product, index) => (
              <ProductCard key={product.id} product={product} currency={currency} onAdd={onAdd} store={store} index={index} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MenuCategoryBrowser;
