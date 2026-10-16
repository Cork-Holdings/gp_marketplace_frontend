import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { kycLabel } from '@/lib/kycReview';
import { KycReviewPage } from './KycReviewPage';

function KycQueue() {
  const { data, loading, error, retry } = useAsync(async () => {
    const [kycRes, merchantsRes] = await Promise.all([
      adminApi.listKyc({ status: 'pending', limit: '200' }),
      adminApi.listMerchants().catch(() => null),
    ]);
    const merchants = Object.fromEntries((merchantsRes?.merchants || []).map(merchant => [merchant.id, merchant]));
    return (kycRes?.verifications || []).map(item => ({ ...item, merchant: merchants[item.merchant_id] }));
  }, []);

  if (loading) return <TableSkeleton rows={4} cols={5} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  return <section aria-labelledby="kyc-queue-title" className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="kyc-queue-title" className="text-lg font-semibold">Awaiting review</h2>
        <p className="mt-1 text-sm text-muted-foreground">Open an application to review the business, applicant and supporting documents.</p>
      </div>
      <Button variant="secondary" onClick={() => retry().catch(() => {})}><WorkflowIcon name="refresh" className="mr-2" />Refresh</Button>
    </header>
    {data?.length ? <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <ul className="divide-y divide-border">{data.map(item => <li key={item.id} className="flex min-w-0 flex-wrap items-center gap-4 p-5 hover:bg-muted/40 sm:flex-nowrap">
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex"><WorkflowIcon name="document" size={20} /></span>
        <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{item.merchant?.legal_name || 'Business application'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{kycLabel(item.verification_type)}{item.merchant?.business_type ? ` · ${kycLabel(item.merchant.business_type)}` : ''}</p>
          <p className="mt-1 text-xs text-muted-foreground">Submitted {new Date(item.submitted_at).toLocaleDateString('en-ZM', { dateStyle: 'medium' })}</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Pending review</span>
        <Button asChild><Link to={`?review=${encodeURIComponent(item.id)}`} aria-label={`Review ${item.merchant?.legal_name || 'business application'}: ${kycLabel(item.verification_type)}`}>Review application<WorkflowIcon name="arrowRight" className="ml-2" /></Link></Button>
      </li>)}</ul>
    </div> : <div className="flex flex-col items-center rounded-2xl border border-border bg-background px-5 py-12 text-center">
      <WorkflowIcon name="checkCircle" size={32} className="mb-4 text-primary" />
      <h3 className="text-base font-semibold">The review queue is clear</h3>
      <p className="mt-2 text-sm text-muted-foreground">New verification submissions will appear here.</p>
    </div>}
  </section>;
}

export function KycVerificationPanel() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('review');
  function back() {
    const next = new URLSearchParams(params);
    next.delete('review');
    setParams(next);
  }
  return selectedId ? <KycReviewPage key={selectedId} verificationId={selectedId} onBack={back} /> : <KycQueue />;
}

export default KycVerificationPanel;
