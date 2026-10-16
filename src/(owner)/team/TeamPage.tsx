import { RecordListTable } from '@/components/common/RecordListTable';
import { userMessage } from '@/lib/userMessage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { rolesApi } from '@/lib/api/services';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { usePermissions } from '@/lib/context/permissions';
import { useConfirm } from '@/hooks/useConfirm';
import { PERM } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

type MemberRow = {
  id: string;
  employee_number?: string;
  display_name?: string;
  recovery_email?: string;
  store_ids?: string[];
  last_pin_change_at?: string | null;
  roles?: { role?: { name?: string; id?: string }; role_id?: string }[];
  user?: { full_name?: string; email?: string };
};

type RoleOption = { id: string; name: string };

const fieldClass =
  'w-full rounded-xl border border-cream-dark bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-forest-muted/60 focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15';

function initials(name?: string) {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function avatarTone(seed: string) {
  const tones = [
    'from-forest to-forest-muted',
    'from-navy to-forest',
    'from-cobalt to-navy',
    'from-forest-muted to-sage',
  ];
  let n = 0;
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i);
  return tones[n % tones.length];
}

export default function TeamPage() {
  const { selectedStore, stores } = useMarketplace();
  const { hasPermission } = usePermissions();
  const { confirm, dialog } = useConfirm();
  const merchantId = selectedStore?.merchant_id as string | undefined;

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [pinMember, setPinMember] = useState<MemberRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [pin, setPin] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [pinValue, setPinValue] = useState('');

  const canManage = hasPermission(PERM.membersManage);

  const storeOptions = useMemo(
    () => stores.filter((s) => s.merchant_id === merchantId),
    [stores, merchantId],
  );

  const storeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of storeOptions) map.set(s.id, s.name ?? s.branch_name ?? s.slug ?? 'Store');
    return map;
  }, [storeOptions]);

  const load = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    try {
      const [membersRes, rolesRes]: any[] = await Promise.all([
        rolesApi.listMembers(merchantId),
        rolesApi.listRoles(merchantId),
      ]);
      setMembers(Array.isArray(membersRes?.members) ? membersRes.members : []);
      const roleList = Array.isArray(rolesRes?.roles) ? rolesRes.roles : [];
      setRoles(roleList.map((r: any) => ({ id: r.id, name: r.name })));
      if (roleList.length) setRoleId((prev) => prev || roleList[0].id);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetCreateForm = () => {
    setDisplayName('');
    setPin('');
    setRecoveryEmail('');
    setFormError(null);
    setStoreIds(selectedStore?.id ? [selectedStore.id] : []);
    if (roles[0]) setRoleId(roles[0].id);
  };

  const openCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const roleName = m.roles?.[0]?.role?.name ?? '';
      const name = m.display_name ?? m.user?.full_name ?? '';
      if (q) {
        const hay = `${name} ${m.employee_number ?? ''} ${roleName} ${m.recovery_email ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roleFilter !== 'all' && roleName !== roleFilter) return false;
      if (storeFilter !== 'all') {
        const ids = m.store_ids ?? [];
        if (ids.length === 0) return true; // merchant-wide
        if (!ids.includes(storeFilter)) return false;
      }
      return true;
    });
  }, [members, search, roleFilter, storeFilter]);

  const stats = useMemo(() => {
    const withPin = members.filter((m) => m.last_pin_change_at).length;
    const branchCovered = new Set(members.flatMap((m) => m.store_ids ?? [])).size;
    return {
      total: members.length,
      withPin,
      branches: branchCovered || (members.length ? storeOptions.length : 0),
      roles: new Set(members.map((m) => m.roles?.[0]?.role?.name).filter(Boolean)).size,
    };
  }, [members, storeOptions.length]);

  const roleNames = useMemo(
    () => Array.from(new Set(members.map((m) => m.roles?.[0]?.role?.name).filter(Boolean))) as string[],
    [members],
  );

  const toggleStore = (id: string) => {
    setStoreIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await rolesApi.createMember(merchantId, {
        display_name: displayName.trim(),
        role_id: roleId,
        store_ids: storeIds,
        pin: pin || undefined,
        recovery_email: recoveryEmail.trim() || undefined,
      });
      setCreateOpen(false);
      resetCreateForm();
      await load();
    } catch (err: any) {
      setFormError(userMessage(err, 'Could not create employee'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (member: MemberRow) => {
    if (!merchantId) return;
    const ok = await confirm({
      title: 'Remove team member?',
      description: `${member.display_name ?? 'This employee'} will lose access immediately. Their employee ID will be released.`,
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await rolesApi.deactivateMember(merchantId, member.id);
      await load();
    } catch (err) {
      setError(err);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId || !pinMember) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await rolesApi.setMemberPin(merchantId, pinMember.id, pinValue);
      setPinMember(null);
      setPinValue('');
      await load();
    } catch (err: any) {
      setFormError(userMessage(err, 'Could not update PIN'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!merchantId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">Team</h1>
          <p className="mt-1 text-sm text-forest-muted">Select a branch to manage employees.</p>
        </header>
        <EmptyState title="Select a store" description="Choose a branch from the store selector to manage team members." />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {dialog}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">Team</h1>
          <p className="mt-1 text-sm text-forest-muted">
            Employees sign in with a 6-digit ID and PIN. Assign roles and branches per person.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary">
            <Link to="/portal/owner/roles">Manage roles</Link>
          </Button>
          {canManage && (
            <Button type="button" onClick={openCreate}>
              + Add employee
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Team members', value: stats.total },
          { label: 'With PIN set', value: stats.withPin },
          { label: 'Branches covered', value: stats.branches },
          { label: 'Roles in use', value: stats.roles },
        ].map((s) => (
          <div key={s.label} className="dashboard-card flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-muted">{s.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-charcoal">{s.value}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-forest">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
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
            placeholder="Search by name, ID, or role…"
            className={cn(fieldClass, 'pl-9')}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={cn(fieldClass, 'w-auto min-w-[8rem]')}
          >
            <option value="all">All roles</option>
            {roleNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className={cn(fieldClass, 'w-auto min-w-[8rem]')}
          >
            <option value="all">All branches</option>
            {storeOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <ErrorState error={error} onRetry={load} /> : null}

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Add your first employee — they'll get a 6-digit ID and can sign in with a PIN."
          actionLabel={canManage ? 'Add employee' : undefined}
          onAction={canManage ? openCreate : undefined}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try a different search or clear the filters." />
      ) : (
        <div className="dashboard-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <RecordListTable className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-cream-dark bg-cream/60 text-[11px] font-medium uppercase tracking-wide text-forest-muted">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Branches</th>
                  <th className="px-4 py-3">PIN</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {filtered.map((m) => {
                  const name = m.display_name ?? m.user?.full_name ?? 'Employee';
                  const roleName = m.roles?.[0]?.role?.name ?? '—';
                  const storeIdsList = m.store_ids ?? [];
                  return (
                    <tr key={m.id} className="hover:bg-cream/40">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-semibold text-white',
                              avatarTone(m.id),
                            )}
                          >
                            {initials(name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-charcoal">{name}</p>
                            {m.recovery_email ? (
                              <p className="truncate text-xs text-forest-muted">{m.recovery_email}</p>
                            ) : (
                              <p className="text-xs text-forest-muted/70">No recovery email</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-lg bg-navy/5 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-navy">
                          {m.employee_number ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-sage/40 px-2.5 py-0.5 text-xs font-medium text-forest">
                          {roleName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {storeIdsList.length === 0 ? (
                          <span className="text-xs text-forest-muted">All branches</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {storeIdsList.slice(0, 3).map((id) => (
                              <span
                                key={id}
                                className="rounded-md border border-cream-dark bg-cream/50 px-2 py-0.5 text-[11px] text-charcoal"
                              >
                                {storeNameById.get(id) ?? id.slice(0, 6)}
                              </span>
                            ))}
                            {storeIdsList.length > 3 && (
                              <span className="text-[11px] text-forest-muted">+{storeIdsList.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {m.last_pin_change_at ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-forest">
                            <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                            Set
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Not set
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center justify-end gap-3">
                            <button
                              type="button"
                              className="text-sm font-medium text-forest hover:underline"
                              onClick={() => {
                                setFormError(null);
                                setPinValue('');
                                setPinMember(m);
                              }}
                            >
                              {m.last_pin_change_at ? 'Reset PIN' : 'Set PIN'}
                            </button>
                            <button
                              type="button"
                              className="text-sm font-medium text-red-600 hover:underline"
                              onClick={() => handleDeactivate(m)}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </RecordListTable>
          </div>
          <div className="border-t border-cream-dark bg-cream/30 px-4 py-2.5 text-xs text-forest-muted">
            Showing {filtered.length} of {members.length} employees
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => !submitting && setCreateOpen(false)}
        title="Add employee"
        size="lg"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="secondary" disabled={submitting} onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-employee-form" disabled={submitting || storeIds.length === 0 || !displayName.trim()}>
              {submitting ? 'Creating…' : 'Create employee'}
            </Button>
          </div>
        }
      >
        <form id="create-employee-form" onSubmit={handleCreate} className="space-y-6">
          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </p>
          )}

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-charcoal">Identity</h3>
              <p className="text-xs text-forest-muted">A 6-digit employee ID is generated automatically.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal">Display name</label>
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={fieldClass}
                placeholder="Jane Phiri"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal">
                Recovery email <span className="font-normal text-forest-muted">(optional)</span>
              </label>
              <input
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className={fieldClass}
                placeholder="Only used for password reset"
              />
            </div>
          </section>

          <section className="space-y-3 border-t border-cream-dark pt-5">
            <div>
              <h3 className="text-sm font-semibold text-charcoal">Access</h3>
              <p className="text-xs text-forest-muted">Role controls permissions; branches control where they can work.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal">Role</label>
              <select required value={roleId} onChange={(e) => setRoleId(e.target.value)} className={fieldClass}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {!roles.length && (
                <p className="mt-1.5 text-xs text-amber-700">
                  No roles yet —{' '}
                  <Link to="/portal/owner/roles" className="font-medium underline">
                    create one first
                  </Link>
                  .
                </p>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-charcoal">Assigned branches</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {storeOptions.map((s) => {
                  const active = storeIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStore(s.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                        active
                          ? 'border-forest bg-sage/25 ring-1 ring-forest/20'
                          : 'border-cream-dark hover:border-forest/30 hover:bg-cream/40',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px]',
                          active ? 'border-forest bg-forest text-white' : 'border-cream-dark text-transparent',
                        )}
                      >
                        ✓
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-charcoal">{s.name}</span>
                        <span className="block truncate text-[11px] text-forest-muted">{s.branch_name ?? s.slug}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {storeIds.length === 0 && (
                <p className="mt-1.5 text-xs text-red-600">Select at least one branch.</p>
              )}
            </div>
          </section>

          <section className="space-y-3 border-t border-cream-dark pt-5">
            <div>
              <h3 className="text-sm font-semibold text-charcoal">Credentials</h3>
              <p className="text-xs text-forest-muted">PIN is 4–6 digits. You can set it now or later.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-charcoal">
                PIN <span className="font-normal text-forest-muted">(optional)</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4,6}"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={cn(fieldClass, 'max-w-[12rem] font-mono tracking-widest')}
                placeholder="••••"
                autoComplete="new-password"
              />
            </div>
          </section>
        </form>
      </Modal>

      <Modal
        open={Boolean(pinMember)}
        onClose={() => !submitting && setPinMember(null)}
        title={pinMember?.last_pin_change_at ? 'Reset PIN' : 'Set PIN'}
        size="sm"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="secondary" disabled={submitting} onClick={() => setPinMember(null)}>
              Cancel
            </Button>
            <Button type="submit" form="set-pin-form" disabled={submitting || pinValue.length < 4}>
              {submitting ? 'Saving…' : 'Save PIN'}
            </Button>
          </div>
        }
      >
        <form id="set-pin-form" onSubmit={handleSetPin} className="space-y-4">
          <p className="text-sm text-forest-muted">
            Set a 4–6 digit PIN for{' '}
            <span className="font-medium text-charcoal">{pinMember?.display_name}</span>
            {pinMember?.employee_number ? (
              <>
                {' '}
                (<span className="font-mono">{pinMember.employee_number}</span>)
              </>
            ) : null}
            .
          </p>
          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {formError}
            </p>
          )}
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{4,6}"
            maxLength={6}
            required
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={cn(fieldClass, 'font-mono tracking-[0.35em]')}
            placeholder="••••••"
            autoComplete="new-password"
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
}
