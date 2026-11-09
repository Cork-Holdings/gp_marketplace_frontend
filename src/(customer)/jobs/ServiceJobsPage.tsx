import { userMessage } from '@/lib/userMessage';
import { useCustomerWorkflowList } from '@/hooks/useCustomerWorkflowList';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { customerApi } from '@/lib/api/services';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CustomerWorkflowList } from '@/components/common/CustomerWorkflowList';
import { workflowDate, workflowGroup } from '@/lib/workflowView';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { WorkflowDetailPage, WorkflowDetailBody, WorkflowDetailContent, WorkflowDetailFooter, WorkflowDetailHeader, WorkflowDetailTitle } from '@/components/common/WorkflowDetailPage';
import { ServiceJobProgress } from '@/components/jobs/ServiceJobProgress';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { WorkflowPageHeader, WorkflowEmpty } from '@/components/common/WorkflowVisuals';
import type { ServiceJob, ServiceJobEvidence } from '@/types/serviceQuote';
import { PaymentReceipts } from '@/components/payments/PaymentReceipts';

export default function CustomerServiceJobsPage() {
  const { hasRole, isAuthenticated } = useAuth();
  const customer = hasRole('customer');
  const { records: jobs, total, loading, error, retry, selectedId, setSelectedId, active, detailLoading, detailError, query, setQuery, page, setPage, pageSize } = useCustomerWorkflowList<ServiceJob>(customerApi.listServiceJobs, 'service_jobs', isAuthenticated && customer);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const visible = jobs;
  const { data: evidenceData } = useFetchWrapper(() => active ? customerApi.listJobEvidence(active.id) : Promise.resolve([]), [active?.id], { enabled: Boolean(active) });
  const evidence: ServiceJobEvidence[] = Array.isArray(evidenceData) ? evidenceData : evidenceData?.evidence ?? [];
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!customer) return <Navigate to="/portal" replace />;

  async function decide(status: 'customer_confirmed' | 'disputed') {
    if (!active) return; setWorking(true); setFeedback(null);
    try { await customerApi.updateServiceJobStatus(active.id, status, status === 'disputed' ? reason.trim() : undefined); await retry(); setDisputeOpen(false); setConfirmComplete(false); setSelectedId(''); setReason(''); setFeedback({ text: status === 'disputed' ? 'Your issue was sent to the business for follow-up.' : 'Thanks. You confirmed the work is complete.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not update this job.'), error: true }); }
    finally { setWorking(false); }
  }
  return <main className={`workflow-page${selectedId ? ' is-detail-view' : ''}`}><WorkflowPageHeader kind="visit" title="Service visits" description="From arrival to a job well done. Follow your provider's progress and review the work record." />
    {feedback && !selectedId && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}
    <section className="workflow-panel" aria-labelledby="customer-jobs-heading"><div className="workflow-panel-heading"><h2 id="customer-jobs-heading">Your service visits</h2><p>Find a visit, check its progress, then open the work record.</p></div><div className="booking-toolbar"><label htmlFor="job-search"><WorkflowIcon name="search" size={16} />Find a visit</label><input id="job-search" name="job-search" autoComplete="off" type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Search by work, location or status" /><span>{total} {total === 1 ? 'visit' : 'visits'}</span></div>
      <CustomerWorkflowList label="service visits" contextHeading="Location" dateHeading="Scheduled" valueHeading="Record" monetary={false}
        loading={loading} error={error} onRetry={retry} paginated={total > pageSize} onOpen={id => { setSelectedId(id); setDisputeOpen(false); }}
        items={visible.map(job => ({
          id: job.id, title: job.title, context: job.service_address?.line1 ?? 'Location to be arranged',
          date: job.scheduled_start_at ? workflowDate(job.scheduled_start_at, true) : 'Time to be arranged', status: job.status,
          value: job.status === 'provider_completed' ? 'Ready for review' : 'Work record', group: workflowGroup(job.status),
          actionLabel: job.status === 'provider_completed' ? 'Review work' : 'View record', description: job.dispute_reason,
          facts: [
            { label: 'Location', value: job.service_address?.line1 ?? 'Location to be arranged' },
            { label: 'Scheduled', value: job.scheduled_start_at ? workflowDate(job.scheduled_start_at, true) : 'Time to be arranged' },
          ], tracker: <ServiceJobProgress status={job.status} compact />,
        }))}
        empty={<WorkflowEmpty kind="visit" title={query ? 'No matching visits' : 'Your service visits will appear here'} description={query ? 'Try a different service, location or status.' : 'Once the business starts work on an accepted estimate, you can follow the visit and review its work record here.'} />} />
      {total > pageSize && <nav className="booking-pagination" aria-label="Service visit pages"><span>Page {page + 1} of {Math.ceil(total / pageSize)}</span><div><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)}>Next</button></div></nav>}</section>
    <WorkflowDetailPage open={Boolean(selectedId)} loading={detailLoading} available={Boolean(active)} error={detailError} busy={working} onOpenChange={open => { if (!open) setSelectedId(''); }}><WorkflowDetailContent aria-describedby="job-detail-description"><WorkflowDetailHeader><WorkflowDetailTitle>{active?.title ?? 'Service visit'}</WorkflowDetailTitle></WorkflowDetailHeader>
      {active && <WorkflowDetailBody><div className="workflow-detail !p-0">{feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}<p id="job-detail-description">{active.service_address?.line1 ? `At ${active.service_address.line1}` : 'Location to be arranged'}</p><div className="workflow-status-row"><StatusBadge status={active.status} /></div><ServiceJobProgress status={active.status} /><section aria-labelledby="work-record-heading"><h3 id="work-record-heading">Work record</h3>{evidence.length ? <ul className="job-evidence-list">{evidence.map(item => <li key={item.id} className="job-evidence-item"><span className="job-evidence-icon"><WorkflowIcon name="document" size={18} /></span><div><strong>{item.kind === 'note' ? 'Work note' : item.kind.replaceAll('_', ' ')}</strong><p>{item.note || 'File attached'}</p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div></li>)}</ul> : <p>The provider has not recorded a work note yet.</p>}</section>
        {active.status === 'provider_completed' && <div><p>The provider has finished. Please review the work and record above.</p><div className="workflow-actions job-review-actions"><button type="button" className="workflow-primary" disabled={working} onClick={() => setConfirmComplete(true)}>Confirm completed</button><button type="button" className="workflow-text-action" aria-expanded={disputeOpen} onClick={() => setDisputeOpen(!disputeOpen)}>Report a problem</button></div>{disputeOpen && <form className="workflow-form workflow-embedded-form" onSubmit={event => { event.preventDefault(); void decide('disputed'); }}><label>What needs fixing?<textarea required maxLength={2000} rows={4} value={reason} onChange={event => setReason(event.target.value)} placeholder="Describe what is incomplete or incorrect so the business can respond" /></label><button className="workflow-primary" type="submit" aria-busy={working}>Send issue</button></form>}</div>}
        {active.status === 'disputed' && <p>Issue reported: {active.dispute_reason || 'The business will follow up.'}</p>}
        {active.status === 'customer_confirmed' && <p>You confirmed this work is complete.</p>}
        {active.quote_id&&<PaymentReceipts key={active.quote_id} kind="quote" sourceId={active.quote_id} compact/>}
      </div></WorkflowDetailBody>}<WorkflowDetailFooter><button type="button" className="booking-back-button" onClick={() => setSelectedId('')}>Close</button></WorkflowDetailFooter></WorkflowDetailContent></WorkflowDetailPage>
    <ConfirmDialog open={confirmComplete} title="Confirm this work is complete?" description={active ? `You are confirming that ${active.title} was completed. Review the work record before proceeding.` : undefined} confirmLabel="Confirm completed" cancelLabel="Keep reviewing" tone="primary" busy={working} onCancel={() => setConfirmComplete(false)} onConfirm={() => { void decide('customer_confirmed'); }} />
  </main>;
}
