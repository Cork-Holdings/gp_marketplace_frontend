import type { ServiceJobStatus } from '@/types/serviceQuote';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';

const steps = ['Assigned', 'On the way', 'In progress', 'Customer review', 'Complete'];
const position: Record<ServiceJobStatus, number> = {
  scheduled: -1, assigned: 0, dispatched: 1, arrived: 1, in_progress: 2,
  provider_completed: 3, customer_confirmed: 4, disputed: 2, cancelled: -1,
};

export function ServiceJobProgress({ status, compact = false }: { status: ServiceJobStatus; compact?: boolean }) {
  const current = position[status];
  const issue = status === 'disputed';
  const caption = status === 'scheduled' ? 'Waiting for a provider' : status === 'disputed' ? 'Issue reported · work needs follow-up' : status === 'cancelled' ? 'This visit was cancelled' : status === 'arrived' ? 'Provider has arrived' : status === 'provider_completed' ? 'Waiting for customer confirmation' : status === 'customer_confirmed' ? 'Customer confirmed completion' : `${steps[current]} stage`;
  if (compact) return <span className={`workflow-mini-progress${issue ? ' is-issue' : ''}`}><span className="workflow-mini-progress-bars" aria-hidden="true">{steps.map((step, index) => <span key={step} className={current >= index ? 'is-reached' : ''} />)}</span><span>{caption}</span></span>;
  return <section className="job-progress" aria-label="Service progress">
    <div className="job-progress-heading"><h3>Work progress</h3><span role="status">{caption}</span></div>
    <div className="job-progress-rail" aria-hidden="true"><span style={{ width: `${Math.max(0, current) * 25}%` }} /></div>
    <ol className="job-progress-steps">{steps.map((label, index) => <li key={label} className={index < current || (index === current && status === 'customer_confirmed') ? 'is-done' : index === current ? issue ? 'is-issue' : 'is-current' : ''} aria-current={index === current ? 'step' : undefined}><span className="job-progress-dot" aria-hidden="true">{index < current || status === 'customer_confirmed' ? <WorkflowIcon name="check" size={15} /> : index + 1}</span><span>{label}</span></li>)}</ol>
    {issue && <p className="job-progress-issue">Customer reported a problem. Record the rework before requesting another review.</p>}
  </section>;
}
