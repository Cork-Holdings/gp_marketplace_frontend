import { userMessage } from '@/lib/userMessage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { rolesApi } from '@/lib/api/services';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { usePermissions } from '@/lib/context/permissions';
import { PERM } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

type RoleRow = {
  id: string;
  name: string;
  is_system?: boolean;
  permissions?: string[];
};

type PermissionRow = { id?: string; name: string; description?: string };

const fieldClass =
  'w-full rounded-xl border border-cream-dark bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-forest-muted/60 focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15';

const GROUP_META: Record<string, { label: string; hint: string }> = {
  stores: { label: 'Stores & branches', hint: 'View and manage storefronts' },
  products: { label: 'Products & menu', hint: 'Catalog and inventory' },
  orders: { label: 'Orders', hint: 'View, fulfill, and update status' },
  transactions: { label: 'Transactions', hint: 'Payments and refunds' },
  members: { label: 'Team', hint: 'Employees and access' },
  roles: { label: 'Roles', hint: 'Create and assign roles' },
  permissions: { label: 'Permissions', hint: 'View permission catalog' },
  merchants: { label: 'Merchants', hint: 'Business profile' },
  kyc: { label: 'KYC', hint: 'Verification documents' },
  admin: { label: 'Admin', hint: 'Platform administration' },
  other: { label: 'Other', hint: 'Additional capabilities' },
};

function groupKey(name: string) {
  const prefix = name.split('.')[0] ?? 'other';
  return GROUP_META[prefix] ? prefix : 'other';
}

function groupPermissions(list: PermissionRow[]) {
  const map = new Map<string, PermissionRow[]>();
  for (const p of list) {
    const key = groupKey(p.name);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries()).sort(([a], [b]) => {
    const order = Object.keys(GROUP_META);
    return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b));
  });
}

function PermissionChips({ permissions, limit = 4 }: { permissions: string[]; limit?: number }) {
  if (!permissions.length) {
    return <span className="text-xs text-forest-muted">No permissions</span>;
  }
  const shown = permissions.slice(0, limit);
  const rest = permissions.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((p) => (
        <span
          key={p}
          className="rounded-md border border-cream-dark bg-cream/60 px-2 py-0.5 font-mono text-[10px] text-charcoal"
        >
          {p}
        </span>
      ))}
      {rest > 0 && (
        <span className="rounded-md bg-navy/5 px-2 py-0.5 text-[10px] font-medium text-navy">+{rest} more</span>
      )}
    </div>
  );
}

export default function RolesPage() {
  const { selectedStore } = useMarketplace();
  const { hasPermission } = usePermissions();
  const merchantId = selectedStore?.merchant_id as string | undefined;

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'custom' | 'system'>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [detailRole, setDetailRole] = useState<RoleRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState('');

  const canManage = hasPermission(PERM.rolesManage);

  const load = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes]: any[] = await Promise.all([
        rolesApi.listRoles(merchantId),
        rolesApi.listPermissions(merchantId),
      ]);
      setRoles(Array.isArray(rolesRes?.roles) ? rolesRes.roles : []);
      setPermissions(Array.isArray(permsRes?.permissions) ? permsRes.permissions : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter((r) => {
      if (typeFilter === 'custom' && r.is_system) return false;
      if (typeFilter === 'system' && !r.is_system) return false;
      if (!q) return true;
      const hay = `${r.name} ${(r.permissions ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [roles, search, typeFilter]);

  const stats = useMemo(
    () => ({
      total: roles.length,
      custom: roles.filter((r) => !r.is_system).length,
      system: roles.filter((r) => r.is_system).length,
      perms: permissions.length,
    }),
    [roles, permissions.length],
  );

  const grouped = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    const list = q
      ? permissions.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description ?? '').toLowerCase().includes(q),
        )
      : permissions;
    return groupPermissions(list);
  }, [permissions, permSearch]);

  const togglePerm = (perm: string) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const toggleGroup = (perms: PermissionRow[]) => {
    const names = perms.map((p) => p.name);
    const allOn = names.every((n) => selectedPerms.includes(n));
    setSelectedPerms((prev) =>
      allOn ? prev.filter((p) => !names.includes(p)) : Array.from(new Set([...prev, ...names])),
    );
  };

  const openCreate = () => {
    setName('');
    setSelectedPerms([]);
    setPermSearch('');
    setFormError(null);
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await rolesApi.createRole(merchantId, { name: name.trim(), permissions: selectedPerms });
      setCreateOpen(false);
      await load();
    } catch (err: any) {
      setFormError(userMessage(err, 'Could not create role'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!merchantId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">Roles</h1>
          <p className="mt-1 text-sm text-forest-muted">Select a branch to manage roles.</p>
        </header>
        <EmptyState title="Select a store" description="Choose a branch from the store selector to manage roles." />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">Roles &amp; permissions</h1>
          <p className="mt-1 text-sm text-forest-muted">
            Build roles like Waiter or Kitchen, then assign them to employees on the Team page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary">
            <Link to="/portal/owner/team">View team</Link>
          </Button>
          {canManage && (
            <Button type="button" onClick={openCreate}>
              + Create role
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total roles', value: stats.total },
          { label: 'Custom', value: stats.custom },
          { label: 'System templates', value: stats.system },
          { label: 'Permissions available', value: stats.perms },
        ].map((s) => (
          <div key={s.label} className="dashboard-card flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-muted">{s.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-charcoal">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles or permissions…"
            className={cn(fieldClass, 'pl-9')}
          />
        </div>
        <div className="flex rounded-xl border border-cream-dark p-1">
          {([
            ['all', 'All'],
            ['custom', 'Custom'],
            ['system', 'System'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTypeFilter(value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                typeFilter === value ? 'bg-forest text-white' : 'text-forest-muted hover:text-charcoal',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorState error={error} onRetry={load} /> : null}

      {loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : roles.length === 0 ? (
        <EmptyState
          title="No roles yet"
          description="Create a custom role (e.g. Waiter, Kitchen) and pick the permissions it needs."
          actionLabel={canManage ? 'Create role' : undefined}
          onAction={canManage ? openCreate : undefined}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try a different search or filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const perms = r.permissions ?? [];
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setDetailRole(r)}
                className="dashboard-card group flex flex-col gap-4 p-5 text-left transition hover:border-forest/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-charcoal group-hover:text-forest">
                      {r.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-forest-muted">
                      {perms.length} permission{perms.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      r.is_system ? 'bg-navy/10 text-navy' : 'bg-sage/50 text-forest',
                    )}
                  >
                    {r.is_system ? 'System' : 'Custom'}
                  </span>
                </div>
                <PermissionChips permissions={perms} />
                <span className="mt-auto text-xs font-medium text-forest opacity-0 transition group-hover:opacity-100">
                  View details →
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => !submitting && setCreateOpen(false)}
        title="Create custom role"
        size="xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-forest-muted">
              {selectedPerms.length} permission{selectedPerms.length === 1 ? '' : 's'} selected
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" disabled={submitting} onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="create-role-form" disabled={submitting || !name.trim()}>
                {submitting ? 'Saving…' : 'Create role'}
              </Button>
            </div>
          </div>
        }
      >
        <form id="create-role-form" onSubmit={handleCreate} className="space-y-5">
          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-charcoal">Role name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Waiter, Kitchen, Cashier"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-charcoal">Permissions</h3>
                <p className="text-xs text-forest-muted">Toggle groups or pick individual capabilities.</p>
              </div>
              <input
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Filter permissions…"
                className={cn(fieldClass, 'max-w-xs')}
              />
            </div>

            <div className="max-h-[min(28rem,55vh)] space-y-4 overflow-y-auto pr-1">
              {grouped.map(([key, perms]) => {
                const meta = GROUP_META[key] ?? GROUP_META.other;
                const allOn = perms.every((p) => selectedPerms.includes(p.name));
                const someOn = !allOn && perms.some((p) => selectedPerms.includes(p.name));
                return (
                  <div key={key} className="rounded-xl border border-cream-dark bg-cream/20">
                    <div className="flex items-center justify-between gap-3 border-b border-cream-dark px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{meta.label}</p>
                        <p className="text-[11px] text-forest-muted">{meta.hint}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGroup(perms)}
                        className="text-xs font-semibold text-forest hover:underline"
                      >
                        {allOn ? 'Clear' : someOn ? 'Select all' : 'Select all'}
                      </button>
                    </div>
                    <div className="grid gap-1 p-2 sm:grid-cols-2">
                      {perms.map((p) => {
                        const on = selectedPerms.includes(p.name);
                        return (
                          <label
                            key={p.id ?? p.name}
                            className={cn(
                              'flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 transition',
                              on ? 'bg-sage/30' : 'hover:bg-white',
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => togglePerm(p.name)}
                              className="mt-0.5 rounded border-cream-dark text-forest focus:ring-forest/30"
                            />
                            <span className="min-w-0">
                              <span className="block font-mono text-xs font-medium text-charcoal">{p.name}</span>
                              {p.description ? (
                                <span className="block text-[11px] leading-snug text-forest-muted">{p.description}</span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {!grouped.length && (
                <p className="py-6 text-center text-sm text-forest-muted">No permissions match that filter.</p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailRole)}
        onClose={() => setDetailRole(null)}
        title={detailRole?.name}
        size="lg"
        footer={
          <div className="flex w-full justify-end">
            <Button type="button" variant="secondary" onClick={() => setDetailRole(null)}>
              Close
            </Button>
          </div>
        }
      >
        {detailRole && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  detailRole.is_system ? 'bg-navy/10 text-navy' : 'bg-sage/50 text-forest',
                )}
              >
                {detailRole.is_system ? 'System template' : 'Custom role'}
              </span>
              <span className="text-xs text-forest-muted">
                {(detailRole.permissions ?? []).length} permissions
              </span>
            </div>
            {(detailRole.permissions ?? []).length === 0 ? (
              <p className="text-sm text-forest-muted">This role has no permissions assigned.</p>
            ) : (
              <div className="space-y-3">
                {groupPermissions(
                  (detailRole.permissions ?? []).map((name) => ({
                    name,
                    description: permissions.find((p) => p.name === name)?.description,
                  })),
                ).map(([key, perms]) => {
                  const meta = GROUP_META[key] ?? GROUP_META.other;
                  return (
                    <div key={key}>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-forest-muted">
                        {meta.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((p) => (
                          <span
                            key={p.name}
                            className="rounded-md border border-cream-dark bg-cream/50 px-2 py-1 font-mono text-[11px] text-charcoal"
                            title={p.description}
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
