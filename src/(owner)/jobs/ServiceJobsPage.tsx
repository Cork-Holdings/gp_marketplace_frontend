import { userMessage } from '@/lib/userMessage';
import { useWorkflowRecordSelection } from '@/hooks/useWorkflowRecordSelection';
import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { ownerApi, rolesApi } from '@/lib/api/services';
import { CustomerWorkflowList } from '@/components/common/CustomerWorkflowList';
import { workflowDate, workflowGroup } from '@/lib/workflowView';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WorkflowDetailPage, WorkflowDetailBody, WorkflowDetailContent, WorkflowDetailFooter, WorkflowDetailHeader, WorkflowDetailTitle } from '@/components/common/WorkflowDetailPage';
import { ServiceJobProgress } from '@/components/jobs/ServiceJobProgress';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { useOwnerPaymentReadiness } from '@/hooks/useOwnerPaymentReadiness';
import { jobActionBlock } from '@/lib/workflowPrerequisites';
import type { ServiceJob, ServiceJobEvidence, ServiceJobStatus } from '@/types/serviceQuote';

type Member = { id: string; user_id: string; display_name?: string; user?: { full_name?: string; email?: string }; store_ids?: string[]; is_active: boolean };
const next: Partial<Record<ServiceJobStatus, { status: ServiceJobStatus; label: string }>> = {
  assigned: { status: 'dispatched', label: 'Dispatch provider' }, dispatched: { status: 'arrived', label: 'Mark arrived' },
  arrived: { status: 'in_progress', label: 'Start work' }, in_progress: { status: 'provider_completed', label: 'Submit for customer confirmation' },
};

export default function ServiceJobsPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStoreId: storeId, selectedStore } = useMarketplace();
  const merchantId = selectedStore?.merchant_id;
  const [params] = useSearchParams();
  const detailId = params.get('detail') ?? '';
  const { data, loading, error, retry } = useFetchWrapper(() => storeId ? ownerApi.listServiceJobs(storeId, { limit: 50, ...(detailId ? { id: detailId } : {}) }) : Promise.resolve({ service_jobs: [] }), [storeId, detailId], { enabled: Boolean(storeId) });
  const { data: memberData } = useFetchWrapper(() => merchantId ? rolesApi.listMembers(merchantId) : Promise.resolve({ members: [] }), [merchantId], { enabled: Boolean(merchantId) });
  const jobs: ServiceJob[] = data?.service_jobs ?? [];
  const members: Member[] = (memberData?.members ?? []).filter((member: Member) => member.is_active && (!member.store_ids?.length || member.store_ids.includes(storeId)));
  const { selectedId, setSelectedId } = useWorkflowRecordSelection(jobs);
  const active = jobs.find(job => job.id === selectedId);
  const payment = useOwnerPaymentReadiness(storeId, 'job', active?.id);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const matching = jobs.filter(job => `${job.title} ${job.status} ${job.service_address?.line1 ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = matching.slice(page * 6, (page + 1) * 6);
  const { data: evidenceData, retry: reloadEvidence } = useFetchWrapper(() => storeId && active ? ownerApi.listJobEvidence(storeId, active.id) : Promise.resolve([]), [storeId, active?.id], { enabled: Boolean(storeId && active) });
  const evidence: ServiceJobEvidence[] = Array.isArray(evidenceData) ? evidenceData : evidenceData?.evidence ?? [];
  const hasCurrentWorkNote = evidence.some(item => !active?.dispute_reason || (active.updated_at && new Date(item.created_at).getTime() > new Date(active.updated_at).getTime()));
  const actionBlock = jobActionBlock({ checking: payment.checking, readiness: payment.readiness, assigned: Boolean(active?.assigned_to), needsEvidence: active?.status === 'in_progress', hasEvidence: Boolean(hasCurrentWorkNote) });
  const [assigneeId, setAssigneeId] = useState('');
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  async function assign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!storeId || !active || working || !(assigneeId || active.assigned_to) || !members.length) return; setWorking(true); setFeedback(null);
    try { await ownerApi.assignServiceJob(storeId, active.id, assigneeId || active.assigned_to); await retry(); setFeedback({ text: 'Provider assigned.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not assign this job.'), error: true }); }
    finally { setWorking(false); }
  }
  async function recordEvidence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!storeId || !active) return; setWorking(true); setFeedback(null);
    try { await ownerApi.addJobEvidence(storeId, active.id, { kind: 'note', note: note.trim() }); setNote(''); await reloadEvidence(); setFeedback({ text: 'Work note recorded for the customer.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not save the work note.'), error: true }); }
    finally { setWorking(false); }
  }
  async function move(status: ServiceJobStatus) {
    if (!storeId || !active || working || actionBlock) return; setWorking(true); setFeedback(null);
    try { await ownerApi.updateServiceJobStatus(storeId, active.id, status); await retry(); setFeedback({ text: 'Job progress updated.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not update this job.'), error: true }); }
    finally { setWorking(false); }
  }
  return <div className={`workflow-page${selectedId ? ' is-detail-view' : ''}`}><header className="workflow-header"><p className="workflow-eyebrow">Operations</p><h1>Service jobs</h1><p>Assign a provider, record work and hand completion back to the customer.</p></header>
    {feedback && !selectedId && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}
    <section className="workflow-panel" aria-labelledby="job-queue-heading"><div className="workflow-panel-heading"><h2 id="job-queue-heading">Job queue</h2><p>Search by work, status or location. Open a job to manage it.</p></div><div className="booking-toolbar"><label htmlFor="owner-job-search">Find a job</label><input id="owner-job-search" type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Search work, location or status" /><span>{matching.length} {matching.length === 1 ? 'job' : 'jobs'}</span></div>
      <CustomerWorkflowList label="service jobs" contextHeading="Location" dateHeading="Scheduled" valueHeading="Provider" monetary={false}
        loading={loading} error={error} onRetry={retry} paginated={matching.length > 6} onOpen={setSelectedId}
        items={visible.map(job => {
          const member = members.find(member => member.user_id === job.assigned_to);
          const provider = member?.display_name || member?.user?.full_name || (job.assigned_to ? 'Provider assigned' : 'Not assigned');
          return {
            id: job.id, title: job.title, context: job.service_address?.line1 ?? 'Location to be arranged',
            date: job.scheduled_start_at ? workflowDate(job.scheduled_start_at, true) : 'Time to be arranged', status: job.status, value: provider,
            group: workflowGroup(job.status, job.status === 'scheduled'), actionLabel: 'Manage job', description: job.dispute_reason,
            facts: [{ label: 'Provider', value: provider }, { label: 'Location', value: job.service_address?.line1 ?? 'Location to be arranged' }],
            tracker: <ServiceJobProgress status={job.status} compact />,
          };
        })}
        empty={<p className="workflow-empty">{query ? 'No jobs match that search.' : 'No jobs yet. Create one from an accepted quote.'}</p>} />
      {matching.length > 6 && <nav className="booking-pagination" aria-label="Job pages"><span>Page {page + 1} of {Math.ceil(matching.length / 6)}</span><div><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * 6 >= matching.length} onClick={() => setPage(page + 1)}>Next</button></div></nav>}</section>
    <WorkflowDetailPage open={Boolean(selectedId)} loading={loading} available={Boolean(active)} error={error} busy={working} onOpenChange={open => { if (!open) setSelectedId(''); }}><WorkflowDetailContent aria-describedby="owner-job-description"><WorkflowDetailHeader><WorkflowDetailTitle>{active?.title ?? 'Job details'}</WorkflowDetailTitle></WorkflowDetailHeader>
      {active && <WorkflowDetailBody><div className="workflow-detail !p-0">{feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}<p id="owner-job-description">{active.service_address?.line1 ? `At ${active.service_address.line1}` : 'Location to be arranged'}</p><div className="workflow-status-row"><StatusBadge status={active.status} /></div><ServiceJobProgress status={active.status} />
        {(active.status === 'scheduled' || active.status === 'assigned') && <form className="workflow-form workflow-embedded-form" onSubmit={assign}><label>Provider<select required disabled={working} value={assigneeId || active.assigned_to || ''} onChange={event => setAssigneeId(event.target.value)}><option value="">Choose a team member</option>{members.map(member => <option key={member.user_id} value={member.user_id}>{member.display_name || member.user?.full_name || member.user?.email || 'Team member'}</option>)}</select></label>{!members.length ? <p>Add a team member with access to this branch before assigning a provider.</p> : !(assigneeId || active.assigned_to) && <p className="workflow-help">Choose a provider to enable assignment.</p>}<button className="workflow-primary" type="submit" disabled={working || !members.length || !(assigneeId || active.assigned_to)} aria-busy={working}>Assign provider</button></form>}
        {next[active.status] && <section aria-label="Next step">{actionBlock && <p className="workflow-help" role="status">{actionBlock}</p>}<div className="workflow-actions"><button className="workflow-primary" type="button" disabled={working || Boolean(actionBlock)} title={actionBlock || undefined} onClick={() => move(next[active.status]!.status)}>{next[active.status]!.label}</button><button className="workflow-text-action" type="button" disabled={payment.checking} onClick={payment.refresh}>Refresh payment readiness</button></div></section>}
        {['assigned', 'dispatched', 'arrived', 'in_progress'].includes(active.status) && <form className="workflow-form workflow-embedded-form" onSubmit={recordEvidence}><label>Work note<textarea required rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="What was done, materials used, and any follow-up needed" /></label><button className="workflow-primary" type="submit" aria-busy={working}>Record note</button></form>}
        <section aria-labelledby="evidence-heading"><h3 id="evidence-heading">Work record</h3>{evidence.length ? <ul className="job-evidence-list">{evidence.map(item => <li key={item.id} className="job-evidence-item"><span className="job-evidence-icon"><WorkflowIcon name="document" size={18} /></span><div><strong>{item.kind === 'note' ? 'Work note' : item.kind.replaceAll('_', ' ')}</strong><p>{item.note || 'File attached'}</p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div></li>)}</ul> : <p>No work notes yet. Record what happened before submitting completion.</p>}</section>
        {active.status === 'provider_completed' && <p>Waiting for the customer to confirm the completed work or raise an issue.</p>}
        {active.status === 'customer_confirmed' && <p>The customer confirmed completion.</p>}
        {active.status === 'disputed' && <div><p>The customer raised an issue: {active.dispute_reason || 'No reason supplied.'}</p>{actionBlock && <p className="workflow-help">{actionBlock}</p>}<button type="button" className="workflow-primary" disabled={working || Boolean(actionBlock)} onClick={() => move('in_progress')}>Reopen for rework</button></div>}
      </div></WorkflowDetailBody>}<WorkflowDetailFooter><button type="button" className="booking-back-button" onClick={() => setSelectedId('')}>Close</button></WorkflowDetailFooter></WorkflowDetailContent></WorkflowDetailPage>
  </div>;
}
