import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { TableProvider } from '@/lib/context/table';
import { useTable } from '@/lib/context/useTable';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { TableQrCard } from './TableQrCard';
import { TableQrPrintSheet } from './TableQrPrintSheet';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/useConfirm';
import { useQrPrint } from '@/hooks/useQrPrint';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'needs_cleaning', label: 'Needs Cleaning' },
];

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-amber-100 text-amber-800',
  reserved: 'bg-blue-100 text-blue-800',
  needs_cleaning: 'bg-gray-200 text-gray-700',
};

function TablesManager({ store }) {
  const { tables, loading, error, loadTables, createTable, deleteTable, setTableStatus } = useTable();
  const { confirm, dialog } = useConfirm();
  const { printMode, printTableId, printOne, printAll } = useQrPrint();
  const [showForm, setShowForm] = useState(false);
  const [showAllQr, setShowAllQr] = useState(false);
  const [selectedQrTableId, setSelectedQrTableId] = useState<string | null>(null);
  const [form, setForm] = useState({ table_number: '', capacity: '4' });
  const [submitting, setSubmitting] = useState(false);

  const selectedTable = tables.find((t) => t.id === selectedQrTableId) ?? null;
  const storeName = store?.name;

  const printTables = (() => {
    if (printMode === 'single' && printTableId) {
      return tables.filter((t) => t.id === printTableId);
    }
    if (printMode === 'all') {
      return tables;
    }
    return [];
  })();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTable({
        table_number: form.table_number,
        label: `Table ${form.table_number}`,
        capacity: parseInt(form.capacity, 10) || undefined,
        status: 'available',
      });
      setForm({ table_number: '', capacity: '4' });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tableId: string, label: string) => {
    const ok = await confirm({
      title: 'Delete this table?',
      description: `"${label}" and its QR code will be removed.`,
      confirmLabel: 'Delete table',
      tone: 'danger',
    });
    if (!ok) return;
    if (selectedQrTableId === tableId) setSelectedQrTableId(null);
    await deleteTable(tableId);
  };

  if (loading && !tables.length) return <TableSkeleton rows={5} cols={4} />;
  if (error) return <ErrorState error={error} onRetry={loadTables} />;

  return (
    <div className="space-y-6">
      {dialog}
      {printMode ? (
        <TableQrPrintSheet
          storeName={storeName}
          tables={printTables}
          mode={printMode === 'single' ? 'single' : 'all'}
        />
      ) : null}
      <div className="dashboard-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-charcoal">Tables</h2>
          <div className="flex gap-2 print:hidden">
            {tables.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAllQr((v) => !v);
                  setSelectedQrTableId(null);
                }}
              >
                {showAllQr ? 'Back to list' : 'Print all QR codes'}
              </Button>
            )}
            {showAllQr && tables.some((t) => t.qr_code?.public_token) && (
              <Button type="button" size="sm" onClick={printAll}>
                Print sheet
              </Button>
            )}
            <Button type="button" size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add Table'}
            </Button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-3 print:hidden">
            <div>
              <label className="mb-1 block text-xs font-medium text-forest-muted">Table number</label>
              <input
                required
                value={form.table_number}
                onChange={(e) => setForm((f) => ({ ...f, table_number: e.target.value }))}
                className="field-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-forest-muted">Capacity</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                className="field-input"
              />
            </div>
            <Button type="submit" disabled={submitting} className="self-end">
              {submitting ? 'Saving…' : 'Save Table'}
            </Button>
          </form>
        )}

        {tables.length === 0 ? (
          <EmptyState
            title="No tables yet"
            description="Add your first table to generate a QR code guests can scan to order."
            actionLabel="Add first table"
            onAction={() => setShowForm(true)}
          />
        ) : showAllQr ? (
          <div className="qr-print-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {tables.map((table) => (
              <TableQrCard
                key={table.id}
                store={store}
                table={table}
                onChanged={loadTables}
                onPrint={printOne}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="overflow-hidden rounded-xl border border-cream-dark">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-cream-dark bg-cream/60 text-[11px] font-medium uppercase tracking-wide text-forest-muted">
                  <tr>
                    <th className="px-4 py-3">Table</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">QR</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-dark">
                  {tables.map((t) => {
                    const hasQr = Boolean(t.qr_code?.public_token);
                    const qrActive = t.qr_code?.is_active !== false;
                    const label = t.label ?? `Table ${t.table_number}`;
                    return (
                      <tr
                        key={t.id}
                        className={`hover:bg-cream/40 ${selectedQrTableId === t.id ? 'bg-sage/40' : ''}`}
                      >
                        <td className="px-4 py-3 font-medium text-charcoal">{label}</td>
                        <td className="px-4 py-3 text-forest-muted">{t.capacity ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                              !hasQr
                                ? 'bg-amber-100 text-amber-800'
                                : qrActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {!hasQr ? 'Missing' : qrActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={t.status ?? 'available'}
                            onChange={(e) => setTableStatus(t.id, e.target.value as any)}
                            className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[t.status ?? 'available']}`}
                            aria-label={`Status for ${label}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedQrTableId(t.id)}
                              className="text-xs font-medium text-forest hover:underline"
                            >
                              QR
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(t.id, label)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <aside className="print:hidden">
              {selectedTable ? (
                <div className="sticky top-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-forest-muted">Table QR</p>
                    <button
                      type="button"
                      onClick={() => setSelectedQrTableId(null)}
                      className="text-xs text-forest-muted hover:text-forest"
                    >
                      Close
                    </button>
                  </div>
                  <TableQrCard
                    store={store}
                    table={selectedTable}
                    onChanged={loadTables}
                    onPrint={printOne}
                    compact
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-cream-dark bg-cream/40 p-6 text-center text-sm text-forest-muted">
                  Select a table&apos;s <span className="font-medium text-forest">QR</span> to preview, print, or download.
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TablesPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStore, selectedStoreId } = useMarketplace();
  const capabilities = useMarketplaceCapabilities(selectedStore);

  if (!isStoreOwner) return <Navigate to="/portal" replace />;
  if (!capabilities.isFood) return <Navigate to="/portal/owner/products" replace />;

  return (
    <div className="space-y-6">
      <header className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">Tables &amp; Seating</h1>
        <p className="mt-1 text-sm text-forest-muted">
          Manage tables and print QR codes customers can scan to order directly from their seat.
        </p>
      </header>

      <TableProvider storeId={selectedStoreId}>
        <TablesManager store={selectedStore} />
      </TableProvider>
    </div>
  );
}
