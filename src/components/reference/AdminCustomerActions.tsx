import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/useConfirm';
import { adminApi } from '@/lib/api/services';
import { userMessage } from '@/lib/userMessage';

export function AdminCustomerActions({ id, email, active, onStatusChange }: {
  id: string;
  email: string;
  active: boolean;
  onStatusChange: (active: boolean) => void;
}) {
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handle(action: 'reset' | 'access') {
    const reset = action === 'reset';
    const label = reset ? 'Send password reset link' : active ? 'Deactivate account' : 'Reactivate account';
    const confirmed = await confirm({
      title: label,
      description: reset
        ? `Send a single-use password reset link to ${email}.`
        : active
          ? 'This signs the customer out and blocks sign-in. Their orders, receipts and account history are kept.'
          : 'This restores sign-in. The customer can use their existing password or request a reset link.',
      confirmLabel: label,
      tone: !reset && active ? 'danger' : 'primary',
    });
    if (!confirmed) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (reset) {
        await adminApi.sendCustomerReset(id);
        setMessage(`Password reset link sent to ${email}.`);
      } else {
        const result = await adminApi.setCustomerAccess(id, !active);
        onStatusChange(result.is_active);
        setMessage(result.is_active ? 'Account reactivated.' : 'Account deactivated.');
      }
    } catch (cause) {
      setError(userMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Customer account actions" className="mt-5 border-t border-cream-dark pt-4" aria-busy={busy}>
      <div className="flex flex-wrap gap-2">
        {active && <Button type="button" variant="secondary" disabled={busy} onClick={() => void handle('reset')}>Send password reset link</Button>}
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void handle('access')}>
          {active ? 'Deactivate account' : 'Reactivate account'}
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-forest-muted" role="status">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      {dialog}
    </section>
  );
}
