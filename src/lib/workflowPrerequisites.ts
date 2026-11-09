type Readiness = { first_confirmed: boolean; balance_confirmed: boolean } | null;
export function orderActionBlock({ accepted, checking, readiness, target, wholesale, bulkReady }: {
  accepted: boolean; checking: boolean; readiness: Readiness; target: string; wholesale: boolean; bulkReady: boolean;
}): string | null {
  if (!accepted) return 'Send a price and wait for the customer to accept it before starting work.';
  if (checking) return 'Checking payment confirmation…';
  if (!readiness) return 'Payment confirmation is unavailable. Refresh payment readiness before continuing.';
  if (!readiness.first_confirmed) return 'Waiting for the customer’s first payment. They can pay from their request details. Work becomes available once payment is confirmed.';
  if (target === 'fulfilled' && !readiness.balance_confirmed) return 'Waiting for the remaining payment. The customer must pay from their request details before handover.';
  if (wholesale && ['ready', 'fulfilled'].includes(target) && !bulkReady) return 'Allocate the full requested quantity and record every line as fulfilled before marking this order ready.';
  return null;
}
export function jobActionBlock({ checking, readiness, assigned, needsEvidence, hasEvidence }: {
  checking: boolean; readiness: Readiness; assigned: boolean; needsEvidence: boolean; hasEvidence: boolean;
}): string | null {
  if (!assigned) return 'Choose and assign a provider before continuing.';
  if (checking) return 'Checking payment confirmation…';
  if (!readiness) return 'Payment confirmation is unavailable. Refresh payment readiness before continuing.';
  if (!readiness.first_confirmed) return 'Waiting for the customer’s payment. They can pay from their accepted estimate. Dispatch and work become available once payment is confirmed.';
  if (needsEvidence && !hasEvidence) return 'Payment is confirmed. A work note is still required. Describe the completed work below and click “Record note”, then submit for customer confirmation.';
  return null;
}
