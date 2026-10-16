import { userMessage } from '@/lib/userMessage';
import { useEffect, useId, useRef, useState } from 'react';
import { customerApi } from '@/lib/api/services';
import { useAuth } from '@/lib/context/useAuth';
import { ConfirmDialog } from './ConfirmDialog';
import { WorkflowIcon } from './WorkflowIcon';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { internationalPhone, localPhone, validPhone } from '@/lib/phone';

type Payment = { amount: string; currency: string; status: string; collection_enabled: boolean; reference?: string; simulated?: boolean };
type Props = { kind: 'reservation' | 'quote' | 'custom_order'; sourceId: string; stage: 'full' | 'deposit' | 'balance'; label?: string; onPaid?: () => void; compact?: boolean };
const currency = (amount: string, code: string) => new Intl.NumberFormat('en-ZM', { style: 'currency', currency: code }).format(Number(amount));

export function WorkflowPaymentPanel({ kind, sourceId, stage, label, onPaid, compact = false }: Props) {
  const { user } = useAuth();
  const phoneId = useId();
  const onPaidRef = useRef(onPaid);
  const sourceRef = useRef('');
  const actionRef = useRef(false);
  const [reload, setReload] = useState(0);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { onPaidRef.current = onPaid; }, [onPaid]);

  useEffect(() => {
    let live = true;
    const key = `${kind}:${sourceId}:${stage}`;
    sourceRef.current = key;
    setPayment(null); setError(''); setPhone(localPhone(user?.phone)); setConfirm(false);
    customerApi.getWorkflowPayment(kind, sourceId, stage)
      .then((value: Payment) => { if (live) { setPayment(value); if (value.status === 'successful') onPaidRef.current?.(); } })
      .catch((cause: unknown) => { if (live) setError(userMessage(cause, 'Payment details are unavailable.')); });
    return () => { live = false; sourceRef.current = ''; };
  }, [kind, sourceId, stage, user?.phone, reload]);

  useEffect(() => {
    if (payment?.status !== 'pending' || !payment.collection_enabled) return;
    let live = true;
    let polling = false;
    const timer = window.setInterval(() => {
      if (polling || actionRef.current) return;
      polling = true;
      customerApi.syncWorkflowPayment(kind, sourceId, stage).then((value: Payment) => {
        if (!live) return;
        setPayment(value);
        if (value.status === 'successful') onPaidRef.current?.();
      }).catch(() => { /* Retain pending; a failed poll is not a failed payment. */ }).finally(() => { polling = false; });
    }, 5000);
    return () => { live = false; window.clearInterval(timer); };
  }, [payment?.status, payment?.collection_enabled, kind, sourceId, stage]);

  async function collect() {
    if (!payment || actionRef.current) return;
    actionRef.current = true;
    const key = `${kind}:${sourceId}:${stage}`;
    setConfirm(false); setBusy(true); setError('');
    try {
      const value: Payment = await customerApi.collectWorkflowPayment(kind, sourceId, stage, payment.simulated ? '0970000000' : internationalPhone(phone));
      if (sourceRef.current !== key) return;
      setPayment(value);
      if (value.status === 'successful') onPaidRef.current?.();
    } catch (cause) {
      if (sourceRef.current !== key) return;
      setError(userMessage(cause, 'Could not request collection. Check status before retrying.'));
      try { const current = await customerApi.getWorkflowPayment(kind, sourceId, stage); if (sourceRef.current === key) setPayment(current); } catch { /* preserve the error */ }
    } finally { actionRef.current = false; setBusy(false); }
  }

  async function check() {
    if (actionRef.current) return;
    actionRef.current = true;
    const key = `${kind}:${sourceId}:${stage}`;
    setBusy(true); setError('');
    try {
      const value: Payment = await customerApi.syncWorkflowPayment(kind, sourceId, stage);
      if (sourceRef.current !== key) return;
      setPayment(value);
      if (value.status === 'successful') onPaidRef.current?.();
    } catch (cause) { if (sourceRef.current === key) setError(userMessage(cause, 'Could not check payment status.')); }
    finally { actionRef.current = false; setBusy(false); }
  }

  return <section className={`workflow-payment${compact ? ' is-compact' : ''}`} aria-label={label ?? `${stage} payment`}>
    <div className="workflow-payment-heading"><span className="workflow-payment-icon"><WorkflowIcon name="creditCard" /></span><div><strong>{label ?? (stage === 'full' ? 'Payment' : `${stage[0].toUpperCase()}${stage.slice(1)} payment`)}</strong><small>{payment ? currency(payment.amount, payment.currency) : 'Loading the confirmed price…'}</small></div></div>
    {payment?.simulated && <p className="workflow-help" role="note">Local simulation. No phone prompt, charge or real payout.</p>}
    {payment?.status === 'failed' && <p role="alert" className="workflow-feedback is-error">Payment failed. No paid step has been unlocked. Review the details before trying again.</p>}
    {payment?.status === 'refunded' ? <p role="status" className="workflow-help">This test payment was refunded. It no longer unlocks work. Arrange a new agreed request with the business.</p> : payment?.status === 'successful' ? <p role="status" className="workflow-payment-success"><WorkflowIcon name="check" /> {payment.simulated ? 'Simulated payment confirmed. The test journey can continue.' : 'Payment confirmed. The business can continue.'}</p> : payment?.status === 'pending' || payment?.status === 'verification_required' ? <div className="workflow-payment-pending"><p role="status">{payment.status === 'verification_required' ? 'Payment needs verification. Please do not pay again.' : payment.simulated ? 'The test provider is set to pending. No money has moved. Check status without creating a second attempt.' : 'Approve the prompt on your phone, then check the result. Do not start another payment while this one is pending.'}</p><button type="button" className="booking-back-button" disabled={busy} onClick={() => void check()}>{busy ? 'Checking…' : 'Check payment status'}</button></div> : payment?.collection_enabled ? <div className="workflow-payment-entry">{!payment.simulated && <div className="workflow-payment-field"><label htmlFor={phoneId}>Mobile-money number</label><PhoneInput id={phoneId} name="phone" value={phone} onChange={event => setPhone(event.target.value)} /></div>}<button type="button" className="workflow-primary" disabled={busy || (!payment.simulated && !validPhone(phone))} onClick={() => setConfirm(true)}>{busy ? 'Requesting…' : `${payment.simulated ? 'Simulate' : 'Pay'} ${currency(payment.amount, payment.currency)}`}</button><small>{compact ? 'You will review the amount before sending the request.' : 'One collection request is sent for this stage. The amount comes from the agreed price.'}</small></div> : payment ? <p className="workflow-help">Online payment is unavailable right now. No payment has been taken. Please try again later.</p> : null}
    {error && <p role="alert" className="workflow-feedback is-error">{error}</p>}
    {!payment && error && <button type="button" className="booking-back-button" onClick={() => setReload(value => value + 1)}>Retry payment details</button>}
    <ConfirmDialog open={confirm} title={payment?.simulated ? 'Simulate this payment?' : 'Request mobile-money payment?'} description={payment ? payment.simulated ? `Record a test payment of ${currency(payment.amount, payment.currency)}. No gateway or phone will be contacted, and no money will move.` : `GeePay will request ${currency(payment.amount, payment.currency)} from ${phone.trim()}. Confirm only if you intend to make this payment.` : undefined} tone="primary" confirmLabel={payment?.simulated ? 'Simulate payment' : 'Request payment'} cancelLabel="Not now" busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void collect()} />
  </section>;
}
