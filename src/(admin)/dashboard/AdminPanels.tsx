import { useState } from 'react';
import { adminApi } from '@/lib/api/services';
import { normalizeStoreList } from '@/lib/normalizeApi';
import { useAsync } from '@/hooks/useAsync';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { PasswordField } from '@/components/shared/PasswordField';
import { DEFAULT_CURRENCY, DEFAULT_PHONE_PLACEHOLDER } from '@/lib/locale';

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

export function CreateStoreForm() {
  const [form, setForm] = useState({
    merchant_id: '',
    owner_id: '',
    name: '',
    slug: '',
    ussd_code: '252',
    currency: DEFAULT_CURRENCY,
    store_category: 'PHYSICAL_GOODS',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const store = await adminApi.createStore(form);
      setSuccess(`Store "${store.name}" created.`);
      setForm({ merchant_id: '', owner_id: '', name: '', slug: '', ussd_code: '252', currency: DEFAULT_CURRENCY, store_category: 'PHYSICAL_GOODS', description: '' });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">Create Store</h3>
      {Object.entries({
        merchant_id: 'Merchant ID',
        owner_id: 'Owner User ID (legacy)',
        name: 'Store Name',
        slug: 'URL Slug',
        ussd_code: 'USSD Code',
        currency: 'Currency',
        store_category: 'Store Category',
        description: 'Description',
      }).map(([key, label]) => (
        <div key={key}>
          <label htmlFor={key} className="mb-1 block text-xs font-medium text-gray-600">
            {label}
          </label>
          <input
            id={key}
            name={key}
            required={!['description', 'owner_id', 'merchant_id'].includes(key) || key === 'name'}
            value={form[key]}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>
      ))}
      {error && <ErrorState error={error} title="Failed to create store" />}
      {success && <p className="text-sm text-green-700">{success}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-cream disabled:opacity-60 hover:bg-forest-dark"
      >
        {submitting ? 'Creating…' : 'Create Store'}
      </button>
    </form>
  );
}

export function StoreListAdmin() {
  const { data, loading, error, retry } = useAsync(() => adminApi.listStores(), []);
  const stores = normalizeStoreList(data);

  if (loading) return <TableSkeleton rows={4} cols={5} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">USSD</th>
            <th className="px-4 py-3">Currency</th>
            <th className="px-4 py-3">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {stores.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{s.name}</td>
              <td className="px-4 py-3 text-gray-600">{s.slug}</td>
              <td className="px-4 py-3 font-mono">{s.ussd_code}</td>
              <td className="px-4 py-3">{s.currency}</td>
              <td className="px-4 py-3">
                <a
                  href={`/store/${s.slug}`}
                  className="text-emerald-600 hover:underline"
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
  );
}
