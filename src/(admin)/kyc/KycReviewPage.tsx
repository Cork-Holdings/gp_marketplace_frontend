import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { WorkflowIcon, type WorkflowIconName } from '@/components/common/WorkflowIcon';
import { WorkflowDetailPage } from '@/components/common/WorkflowDetailPage';
import { showToast } from '@/lib/actionFeedback';
import { kycDecisionIssue, kycDocumentUrl, kycDocuments, kycLabel, type ReviewDocument } from '@/lib/kycReview';

function date(value?: string | null) {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Not recorded' : parsed.toLocaleString('en-ZM', { dateStyle: 'medium', timeStyle: 'short' });
}

function Status({ value }: { value?: string }) {
  const tone = value === 'approved' ? 'bg-emerald-50 text-emerald-800' : value === 'rejected' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{kycLabel(value)}</span>;
}

function Section({ id, title, icon, children }: { id: string; title: string; icon: WorkflowIconName; children: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-title`} className="min-w-0 scroll-mt-6 border-t border-border py-6">
    <h2 id={`${id}-title`} className="mb-5 flex items-center gap-3 text-lg font-semibold text-foreground">
      <WorkflowIcon name={icon} size={20} className="shrink-0 text-primary" />{title}
    </h2>
    {children}
  </section>;
}

function Fields({ items }: { items: [string, ReactNode][] }) {
  return <dl className="grid min-w-0 gap-x-8 gap-y-5 sm:grid-cols-2">
    {items.map(([label, value]) => <div key={label} className="min-w-0">
      <dt className="mb-1 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground [overflow-wrap:anywhere]">{value || 'Not provided'}</dd>
    </div>)}
  </dl>;
}

function Document({ doc, initiallyOpen }: { doc: ReviewDocument; initiallyOpen: boolean }) {
  const url = kycDocumentUrl(doc.file_url, import.meta.env.VITE_API_BASE_URL);
  const image = doc.content_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url || '');
  const pdf = doc.content_type === 'application/pdf' || /\.pdf(\?|$)/i.test(doc.file_name || url || '');
  return <div className="min-w-0 border-b border-border pb-6 last:border-0">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><WorkflowIcon name="document" />{doc.title}</h3>
        <p className="mt-1 break-all text-sm text-muted-foreground">{doc.file_name || 'Uploaded document'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{doc.source}{doc.file_size ? ` · ${Math.ceil(doc.file_size / 1024)} KB` : ''}</p>
      </div>
      {doc.status && <Status value={doc.status} />}
    </div>
    {url ? <>
      {(image || pdf) && <details open={initiallyOpen} className="mt-4">
        <summary className="cursor-pointer rounded-lg py-3 text-sm font-medium text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Document preview</summary>
        {image ? <img src={url} alt={`${doc.title}: ${doc.file_name || 'submitted document'}`} loading="lazy" className="mt-2 max-h-[36rem] w-full rounded-xl border border-border bg-muted object-contain" />
          : <iframe src={url} title={`${doc.title} document preview`} loading="lazy" className="mt-2 h-[32rem] w-full rounded-xl border border-border bg-muted" />}
      </details>}
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Open full document <span className="text-xs font-normal">(new tab)</span><WorkflowIcon name="arrowRight" /></a>
    </> : <p className="mt-3 text-sm text-muted-foreground">The file is unavailable. Ask the applicant to upload it again before approving this check.</p>}
  </div>;
}

export function KycReviewPage({ verificationId, onBack }: { verificationId: string; onBack: () => void }) {
  const { data, loading, error, retry } = useAsync(() => adminApi.getKyc(verificationId), [verificationId]);
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<unknown>(null);
  const [notesIssue, setNotesIssue] = useState<string | null>(null);
  const [savedReview, setSavedReview] = useState(null);
  const submissionGuard = useRef(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const verification = savedReview || data?.verification;
  const merchant = data?.merchant;
  const applicant = data?.applicant;
  const documents = kycDocuments(data || {});
  const pending = verification?.status === 'pending';

  function prepare(approved: boolean) {
    const issue = kycDecisionIssue(approved, notes);
    setNotesIssue(issue);
    if (issue) { notesRef.current?.focus(); return; }
    setDecisionError(null);
    setDecision(approved);
  }

  async function submitDecision() {
    if (decision === null || submissionGuard.current || !pending) return;
    const issue = kycDecisionIssue(decision, notes);
    if (issue) { setNotesIssue(issue); notesRef.current?.focus(); return; }
    submissionGuard.current = true;
    setSubmitting(true);
    setDecisionError(null);
    try {
      const result = await (decision ? adminApi.approveKyc : adminApi.rejectKyc)(verificationId, { review_notes: notes.trim() || undefined });
      setSavedReview(result?.verification || result);
      showToast(decision ? 'Verification check approved.' : 'Verification check rejected.');
      setDecision(null);
      // Keep the full record open after a decision. Reload related checks and visibility.
      await retry().catch(() => {});
    } catch (err) { setDecisionError(err); }
    finally { submissionGuard.current = false; setSubmitting(false); }
  }

  return <WorkflowDetailPage open onOpenChange={onBack} busy={submitting}>
    {loading && !data ? <div aria-label="Loading application"><TableSkeleton rows={6} cols={2} /></div>
      : error ? <ErrorState error={error} onRetry={retry} title="Could not load the application" />
      : !verification || !merchant ? <ErrorState title="Application unavailable" error="Return to the review queue and select an application." onRetry={retry} />
      : <>
        <header className="mb-6 flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Business verification</p>
            <h1 tabIndex={-1} className="break-words text-2xl font-bold text-foreground">{merchant.legal_name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{kycLabel(merchant.business_type)} · Submitted {date(verification.submitted_at)}</p>
          </div><Status value={verification.status} />
        </header>
        <nav aria-label="Application sections" className="mb-6 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-primary">
          {['Business', 'Applicant', 'Branches', 'Documents', 'History', 'Decision'].map(label => <a key={label} href={`#kyc-${label.toLowerCase()}`} className="inline-flex min-h-11 items-center rounded-md hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{label}</a>)}
        </nav>
        <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <Section id="kyc-business" title="Business details" icon="store">
              <Fields items={[
                ['Legal name', merchant.legal_name], ['Trading name', merchant.trading_name],
                ['Business type', kycLabel(merchant.business_type)], ['Country', merchant.country_code === 'ZM' ? 'Zambia' : merchant.country_code],
                ['PACRA registration number', merchant.registration_number], ['Taxpayer Identification Number (TPIN)', merchant.tax_id],
                ['Business access', merchant.is_active ? 'Enabled' : 'Disabled'],
                ['Trading approval', merchant.is_verified ? 'Approved' : 'Awaiting verification'],
                ['Registered', date(merchant.created_at)],
              ]} />
            </Section>
            <Section id="kyc-applicant" title="Applicant details" icon="briefcase">
              {applicant ? <Fields items={[
                ['Full name', applicant.full_name], ['Email address', applicant.email], ['Phone number', applicant.phone],
                ['Account created', date(applicant.created_at)],
              ]} /> : <p className="text-sm text-muted-foreground">Applicant details could not be retrieved. Refresh before completing the review.</p>}
            </Section>
            <Section id="kyc-branches" title="Submitted branches" icon="pin">
              {data.stores?.length ? <div className="space-y-6">{data.stores.map(store => <article key={store.id} className="min-w-0 border-b border-border pb-6 last:border-0 last:pb-0">
                <h3 className="mb-4 text-base font-semibold">{store.name}</h3>
                <Fields items={[
                  ['Branch label', store.branch_name], ['Business category', kycLabel(store.store_category)], ['Store type', kycLabel(store.store_type)],
                  ['Storefront address', `/store/${store.slug}`], ['USSD code', store.ussd_code], ['Currency', store.currency],
                  ['Description', store.description], ['Public visibility', store.is_active && merchant.is_active && merchant.is_verified ? 'Published' : 'Not published'],
                ]} />
                <Link to={`/portal/admin/stores?q=${encodeURIComponent(store.slug)}`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">Manage branch<WorkflowIcon name="arrowRight" /></Link>
              </article>)}</div> : <p className="text-sm text-muted-foreground">No branch has been created yet. Business registration can be reviewed before storefront setup.</p>}
            </Section>
            <Section id="kyc-documents" title={`Submitted documents (${documents.length})`} icon="document">
              {documents.length ? <div className="space-y-6">{documents.map((doc, i) => <Document key={doc.id || `${doc.title}-${i}`} doc={doc} initiallyOpen={doc.verification_type === verification.verification_type} />)}</div>
                : <p className="text-sm text-muted-foreground">No documents are available. Ask the applicant to upload the required documents before approving.</p>}
            </Section>
            <Section id="kyc-history" title="Verification history" icon="clock">
              <ol className="divide-y divide-border">{(data.reviews || [verification]).map(review => {
                const current = review.id === verification.id ? verification : review;
                return <li key={review.id} className="py-4 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{kycLabel(current.verification_type)}</h3><Status value={current.status} /></div>
                  <p className="mt-2 text-xs text-muted-foreground">Submitted {date(current.submitted_at)}{current.reviewed_at ? ` · Reviewed ${date(current.reviewed_at)}` : ''}</p>
                  {current.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm">Applicant note: {current.notes}</p>}
                  {current.review_notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm">Reviewer note: {current.review_notes}</p>}
                </li>;
              })}</ol>
            </Section>
          </div>
          <aside id="kyc-decision" aria-labelledby="kyc-decision-title" className="min-w-0 scroll-mt-6 rounded-2xl border border-border bg-background p-5 xl:sticky xl:top-6">
            <h2 id="kyc-decision-title" className="flex items-center gap-2 text-lg font-semibold"><WorkflowIcon name="checkCircle" size={20} className="text-primary" />Review decision</h2>
            <p className="mt-3 text-sm font-semibold">{kycLabel(verification.verification_type)}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">This decision applies to this verification check only. Public trading also requires all mandatory checks to be approved and the business and branch to be enabled.</p>
            {pending ? <>
              <label htmlFor="kyc-review-notes" className="mb-2 mt-6 block text-sm font-medium">Reviewer notes <span className="font-normal text-muted-foreground">(required for rejection)</span></label>
              <textarea ref={notesRef} id="kyc-review-notes" value={notes} maxLength={2000} disabled={submitting} onChange={e => { setNotes(e.target.value); setNotesIssue(null); setDecision(null); }} rows={5} placeholder="Explain your decision or what needs correcting…" aria-invalid={Boolean(notesIssue)} aria-describedby="kyc-notes-help" className="field-input w-full resize-y" />
              <p id="kyc-notes-help" className={`mt-2 text-xs ${notesIssue ? 'text-destructive' : 'text-muted-foreground'}`} role={notesIssue ? 'alert' : undefined}>{notesIssue || `${notes.length.toLocaleString()} / 2,000 characters`}</p>
              {decision === null ? <div className="mt-5 flex flex-wrap gap-3"><Button variant="secondary" disabled={submitting} onClick={() => prepare(false)}><WorkflowIcon name="closeCircle" className="mr-2" />Reject</Button><Button disabled={submitting} onClick={() => prepare(true)}><WorkflowIcon name="check" className="mr-2" />Approve check</Button></div>
                : <div className="mt-5 space-y-4 rounded-xl bg-muted p-4" role="status">
                  <p className="text-sm font-semibold">{decision ? 'Approve this verification check?' : 'Reject this verification check?'}</p>
                  <p className="text-sm text-muted-foreground">{decision ? 'Confirm that you have checked the submitted information and supporting document.' : 'Your reason will be saved with this review.'}</p>
                  <Button className="w-full" variant={decision ? 'primary' : 'danger'} disabled={submitting} onClick={submitDecision}>{submitting ? 'Saving decision…' : decision ? 'Confirm approval' : 'Confirm rejection'}</Button>
                  <Button variant="ghost" className="w-full" disabled={submitting} onClick={() => setDecision(null)}>Keep reviewing</Button>
                </div>}
              {decisionError && <div className="mt-4"><ErrorState error={decisionError} title="Decision not saved" /></div>}
            </> : <div className="mt-5 rounded-xl bg-muted p-4"><Status value={verification.status} /><p className="mt-3 text-sm">{verification.review_notes || 'No reviewer notes were recorded.'}</p><p className="mt-2 text-xs text-muted-foreground">Reviewed {date(verification.reviewed_at)}</p></div>}
            <Button variant="ghost" className="mt-5 w-full" disabled={submitting} onClick={onBack}>Back to review queue</Button>
          </aside>
        </div>
      </>}
  </WorkflowDetailPage>;
}
