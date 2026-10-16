import { RecordListTable } from '@/components/common/RecordListTable';
import { Link, useNavigate } from 'react-router-dom';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { getStoreImageUrl } from '@/lib/normalizeApi';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

function StoreRow({ store, onManage }) {
  const imageUrl = getStoreImageUrl(store);
  const isActive = store.is_active !== false;
  const isPublic = store.public_trading_ready === true;
  const status = !isActive ? 'Branch disabled' : store.merchant_active === false ? 'Business disabled' : store.merchant_verified === false ? 'Awaiting approval' : isPublic ? 'Published' : 'Visibility not confirmed';

  return (
    <tr className="hover:bg-cream/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cover bg-center ${
              imageUrl ? '' : 'bg-gradient-to-br from-forest to-forest-muted'
            }`}
            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
            aria-hidden="true"
          >
            {!imageUrl && (
              <svg className="h-5 w-5 text-cream/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-medium text-charcoal">{store.name}</p>
            <p className="text-xs text-forest-muted">{store.branch_name ?? store.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-forest-muted">{store.store_type ?? store.store_category ?? '—'}</td>
      <td className="px-4 py-3 font-mono text-sm">{store.ussd_code ?? '—'}</td>
      <td className="px-4 py-3">{store.currency ?? 'ZMW'}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isPublic ? 'bg-sage text-forest' : 'bg-cream-dark text-forest-muted'
          }`}
        >
          {status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onManage(store.id)}
            className="text-sm font-medium text-forest hover:underline"
          >
            Manage branding
          </button>
          {isPublic && <a
            href={`/store/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-forest-muted hover:text-forest hover:underline"
          >
            Storefront
          </a>}
        </div>
      </td>
    </tr>
  );
}

export default function MerchantStoresPage() {
  const { stores, loading, error, refreshStores, selectStore } = useMarketplace();
  const navigate = useNavigate();

  const handleManage = (storeId: string) => {
    selectStore(storeId);
    navigate('/portal/owner/store-settings');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">Stores &amp; branches</h1>
          <p className="mt-1 text-sm text-forest-muted">
            Stores appear in the marketplace once a GeePay administrator approves your business verification. An enabled branch is not the same as a published storefront.
          </p>
        </div>
        <Button asChild>
          <Link to="/portal/owner/stores/new">+ Add store</Link>
        </Button>
      </header>

      {loading && !stores.length ? (
        <TableSkeleton rows={4} cols={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={refreshStores} />
      ) : stores.length === 0 ? (
        <EmptyState
          title="No stores yet"
          description="Create your first branch to launch a customer-facing storefront."
          actionLabel="Create first store"
          actionTo="/portal/owner/stores/new"
        />
      ) : (
        <div className="dashboard-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <RecordListTable className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-cream-dark bg-cream/60 text-[11px] font-medium uppercase tracking-wide text-forest-muted">
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">USSD</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {stores.map((store) => (
                  <StoreRow key={store.id} store={store} onManage={handleManage} />
                ))}
              </tbody>
            </RecordListTable>
          </div>
        </div>
      )}
    </div>
  );
}
