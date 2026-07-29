import { useState } from 'react';
import { adminApi } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';

function resolveUploadUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

function formatLabel(value?: string | null) {
  if (!value) return '—';
  return value.replace(/_/g, ' ');
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function isImageUrl(url: string, contentType?: string | null) {
  if (contentType?.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

function DocumentPreview({ title, url, contentType, fileName }) {
  const resolved = resolveUploadUrl(url);
  if (!resolved) {
    return (
      <div className="space-y-2 rounded-xl border border-cream-dark bg-cream/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-forest-muted">{title}</p>
        <p className="text-sm text-forest-muted">No document uploaded.</p>
      </div>
    );
  }

  const showImage = isImageUrl(resolved, contentType);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-forest-muted">{title}</p>
      <div className="overflow-hidden rounded-xl border border-cream-dark bg-cream/40">
        {showImage ? (
          <img src={resolved} alt={title} className="h-48 w-full object-cover" />
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-sm font-medium text-charcoal">{fileName || 'Document on file'}</p>
            <p className="text-xs text-forest-muted">{contentType || 'Open to review'}</p>
          </div>
        )}
      </div>
      <a href={resolved} target="_blank" rel="noopener noreferrer" className="text-xs text-forest hover:underline">
        Open full document
      </a>
    </div>
  );
}

function KycReviewModal({ verificationId, open, onClose, onDecision }) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState(null);

  const { data, loading, error, retry } = useAsync(
    () => (verificationId ? adminApi.getKyc(verificationId) : Promise.resolve(null)),
    [verificationId],
  );

  if (!open || !verificationId) return null;

  const verification = data?.verification;
  const merchant = data?.merchant;
  const documents = data?.documents ?? [];

  const handleDecision = async (approved) => {
    setSubmitting(true);
    setDecisionError(null);
    try {
      await onDecision(verificationId, approved, notes.trim() || undefined);
      setNotes('');
      onClose();
    } catch (err) {
      setDecisionError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`KYC Review — ${merchant?.legal_name ?? 'Verification'}`}
      size="xl"
      footer={
        <>
          <Button variant="danger" disabled={submitting || loading || Boolean(error)} onClick={() => handleDecision(false)}>
            Reject
          </Button>
          <Button disabled={submitting || loading || Boolean(error)} onClick={() => handleDecision(true)}>
            Approve
          </Button>
        </>
      }
    >
      {loading && <p className="text-sm text-forest-muted">Loading verification…</p>}
      {error && <ErrorState error={error} onRetry={retry} title="Could not load KYC detail" />}

      {!loading && !error && verification && (
        <>
          <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <span className="text-forest-muted">Merchant:</span> {merchant?.legal_name ?? '—'}
            </div>
            <div>
              <span className="text-forest-muted">Type:</span>{' '}
              <span className="capitalize">{formatLabel(merchant?.business_type)}</span>
            </div>
            <div>
              <span className="text-forest-muted">Verification:</span>{' '}
              <span className="capitalize">{formatLabel(verification.verification_type)}</span>
            </div>
            <div>
              <span className="text-forest-muted">Reg #:</span>{' '}
              {merchant?.registration_number || '—'}
            </div>
            <div>
              <span className="text-forest-muted">Submitted:</span> {formatDate(verification.submitted_at)}
            </div>
            <div>
              <span className="text-forest-muted">Status:</span>{' '}
              <span className="capitalize">{formatLabel(verification.status)}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <DocumentPreview
                  key={doc.id}
                  title={formatLabel(doc.verification_type)}
                  url={doc.file_url}
                  contentType={doc.content_type}
                  fileName={doc.file_name}
                />
              ))
            ) : (
              <DocumentPreview
                title={formatLabel(verification.verification_type)}
                url={verification.document_url}
              />
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-forest-muted" htmlFor="kyc-review-notes">
              Reviewer notes
            </label>
            <textarea
              id="kyc-review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Approval conditions or rejection reason…"
              className="field-input w-full"
            />
          </div>

          {decisionError && (
            <div className="mt-3">
              <ErrorState error={decisionError} title="Review failed" />
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export function KycVerificationPanel() {
  const [selectedId, setSelectedId] = useState(null);

  const { data, loading, error, retry } = useAsync(async () => {
    const kycRes = await adminApi.listKyc({ status: 'pending' });
    const verifications = kycRes?.verifications ?? [];

    let merchants = [];
    try {
      const merchantsRes = await adminApi.listMerchants();
      merchants = merchantsRes?.merchants ?? [];
    } catch {
      /* Merchant names are optional enrichment */
    }

    const byId = Object.fromEntries(merchants.map((m) => [m.id, m]));
    return verifications.map((v) => ({
      ...v,
      merchant: byId[v.merchant_id] ?? null,
    }));
  }, []);

  const queue = data ?? [];

  const handleDecision = async (verificationId, approved, notes) => {
    const payload = notes ? { review_notes: notes } : {};
    if (approved) {
      await adminApi.approveKyc(verificationId, payload);
    } else {
      await adminApi.rejectKyc(verificationId, payload);
    }
    await retry();
  };

  if (loading) return <TableSkeleton rows={4} cols={5} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-charcoal">KYC Verification Queue</h2>
        <p className="text-sm text-forest-muted">
          Review company registration and identity documents before merchant approval.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-dark bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-cream-dark bg-cream/50 text-xs uppercase text-forest-muted">
            <tr>
              <th className="px-4 py-3">Merchant</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Registration</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-dark">
            {queue.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-forest-muted">
                  No pending KYC applications.
                </td>
              </tr>
            ) : (
              queue.map((item) => (
                <tr key={item.id} className="hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-charcoal">
                      {item.merchant?.legal_name ?? 'Unknown merchant'}
                    </p>
                    <p className="text-xs capitalize text-forest-muted">
                      {formatLabel(item.merchant?.business_type)}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize">{formatLabel(item.verification_type)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {item.merchant?.registration_number || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-forest-muted">
                    {formatDate(item.submitted_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium capitalize text-amber-700">
                      {formatLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" onClick={() => setSelectedId(item.id)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <KycReviewModal
          key={selectedId}
          verificationId={selectedId}
          open
          onClose={() => setSelectedId(null)}
          onDecision={handleDecision}
        />
      )}
    </div>
  );
}

export default KycVerificationPanel;
