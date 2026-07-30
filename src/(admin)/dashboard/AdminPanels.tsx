import { useState } from 'react';
import { adminApi } from '@/lib/api/services';
import { normalizeStoreList } from '@/lib/normalizeApi';
import { useAsync } from '@/hooks/useAsync';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PasswordField } from '@/components/shared/PasswordField';
import { DEFAULT_PHONE_PLACEHOLDER } from '@/lib/locale';

export function OnboardOwnerForm({ onSuccess }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const owner = await adminApi.onboardOwner(form);
      setForm({ email: '', password: '', full_name: '', phone: '' });
      onSuccess?.(owner);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Onboard Store Owner</h3>
      {['full_name', 'email', 'phone'].map((field) => (
        <div key={field}>
          <label htmlFor={field} className="mb-1 block text-xs font-medium capitalize text-gray-600">
            {field.replace('_', ' ')}
          </label>
          <input
            id={field}
            name={field}
            type={field === 'email' ? 'email' : 'tel'}
            required={field !== 'phone'}
            placeholder={field === 'phone' ? DEFAULT_PHONE_PLACEHOLDER : undefined}
            value={form[field]}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>
      ))}
      <PasswordField
        id="password"
        label="Password"
        required
        value={form.password}
        onChange={(val) => setForm((f) => ({ ...f, password: val }))}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
      />
      {error && <ErrorState error={error} title="Onboarding failed" />}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-cream disabled:opacity-60 hover:bg-forest-dark"
      >
        {submitting ? 'Creating…' : 'Create Owner Account'}
      </button>
    </form>
  );
}

export function OwnerList() {
  const { data, loading, error, retry } = useAsync(() => adminApi.listOwners(), []);

  const owners = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];

  if (loading) return <TableSkeleton rows={4} cols={4} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {owners.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                No store owners yet.
              </td>
            </tr>
          ) : (
            owners.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{o.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{o.email}</td>
                <td className="px-4 py-3 text-gray-600">{o.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.is_active !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {o.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StoreListAdmin() {
  const { data, loading, error, retry } = useAsync(() => adminApi.listStores(), []);
  const stores = normalizeStoreList(data);

  if (loading) return <TableSkeleton rows={4} cols={5} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (stores.length === 0) {
    return (
      <EmptyState
        title="No stores yet"
        description="Create the first storefront for a merchant business."
        actionLabel="Create first store"
        actionTo="/portal/admin/stores/new"
      />
    );
  }

  return (
    <div className="dashboard-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-cream-dark bg-cream/60 text-[11px] font-medium uppercase tracking-wide text-forest-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">USSD</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-dark">
            {stores.map((s) => (
              <tr key={s.id} className="hover:bg-cream/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-charcoal">{s.name}</p>
                  <p className="text-xs text-forest-muted">{s.branch_name ?? '—'}</p>
                </td>
                <td className="px-4 py-3 text-forest-muted">{s.slug}</td>
                <td className="px-4 py-3 text-forest-muted">{s.store_type ?? s.store_category ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-sm">{s.ussd_code}</td>
                <td className="px-4 py-3">{s.currency}</td>
                <td className="px-4 py-3">
                  <a
                    href={`/store/${s.slug}`}
                    className="text-sm font-medium text-forest hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
