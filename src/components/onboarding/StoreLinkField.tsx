import { useEffect, useState } from 'react';
import { checkStoreLink } from '@/lib/api/storeLink';
import { storeLinkIssue } from '@/lib/storeIdentity';

export function StoreLinkField({ id = 'slug', value, onChange, admin = false }: { id?: string; value: string; onChange: (value: string) => void; admin?: boolean }) {
  const [result, setResult] = useState<{ value: string; status: 'available' | 'taken' | 'failed' } | null>(null);
  const issue = value ? storeLinkIssue(value) : null;
  useEffect(() => {
    if (!value || storeLinkIssue(value)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      checkStoreLink(value, admin, controller.signal).then(available => {
        if (!controller.signal.aborted) setResult({ value, status: available ? 'available' : 'taken' });
      }).catch(() => { if (!controller.signal.aborted) setResult({ value, status: 'failed' }); });
    }, 400);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [value, admin]);
  const status = result?.value === value ? result.status : null;
  const message = issue || (status === 'taken' ? 'This link is already in use. Choose a different ending.' : status === 'available' ? 'This link is available.' : status === 'failed' ? 'We could not check this link. Try again before continuing.' : value ? 'Checking link availability…' : 'A link is generated when you enter your store name.');
  return <div className="min-w-0">
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">Storefront link ending</label>
    <input id={id} name={id} required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" autoComplete="off" autoCapitalize="none" spellCheck={false} value={value} onChange={e => onChange(e.target.value)} aria-invalid={Boolean(issue || status === 'taken')} aria-describedby={`${id}-hint ${id}-status`} className="field-input" />
    <p id={`${id}-hint`} className="mt-1 text-xs text-forest-muted">We generate this for you—no change is needed. You can personalise it if the link is available.</p>
    <p id={`${id}-status`} role="status" className={`mt-1 text-xs ${issue || status === 'taken' ? 'text-danger-fg' : 'text-forest'}`}>{message}</p>
  </div>;
}
