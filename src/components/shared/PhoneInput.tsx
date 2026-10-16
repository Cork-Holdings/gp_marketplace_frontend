import { useId, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { localPhone, PHONE_COUNTRY_PREFIX, PHONE_ERROR, PHONE_EXAMPLE, PHONE_MAX_DIGITS } from '@/lib/phone';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'maxLength' | 'pattern' | 'inputMode'> & { hint?: string };

/** One shared format for signup, admin forms, checkout and payment retries. */
export function PhoneInput({ onChange, onPaste, onBlur, hint, className = 'field-input', ...props }: Props) {
  const hintId = useId();
  const pendingPaste = useRef<string | null>(null);
  const previousValue = useRef(localPhone(props.value ?? props.defaultValue ?? ''));
  const [entryError, setEntryError] = useState('');

  function change(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const raw = pendingPaste.current ?? input.value;
    pendingPaste.current = null;
    const next = localPhone(raw);
    // Reject oversized/invalid pastes instead of charging a truncated number.
    const invalid = raw.trim() !== '' && next === '';
    if (invalid) {
      input.value = localPhone(typeof props.value === 'string' ? props.value : previousValue.current);
      input.setCustomValidity(PHONE_ERROR);
      setEntryError(PHONE_ERROR);
      return;
    }
    input.value = next;
    previousValue.current = next;
    input.setCustomValidity('');
    setEntryError('');
    onChange?.(event);
  }

  return <>
    <div className="phone-input-control">
      <span className="shrink-0 rounded-lg border border-cream-dark bg-cream px-3 py-3 text-sm font-semibold text-forest" aria-label="Zambia country code">{PHONE_COUNTRY_PREFIX}</span>
      <input {...props} type="tel" inputMode="numeric" autoComplete={props.autoComplete ?? 'tel-national'}
        maxLength={PHONE_MAX_DIGITS} pattern="0[0-9]{9}" title={PHONE_ERROR}
        placeholder={props.placeholder ?? `e.g. ${PHONE_EXAMPLE}`}
        className={`${className} min-w-0 flex-1`}
        aria-invalid={Boolean(entryError) || props['aria-invalid']}
        aria-describedby={[props['aria-describedby'], (entryError || hint) && hintId].filter(Boolean).join(' ') || undefined}
        onChange={change}
        onPaste={event => {
          const input = event.currentTarget;
          // Read the complete paste before the browser applies maxlength.
          // Paste remains enabled; recognised +260 numbers are localised.
          pendingPaste.current = input.value.slice(0, input.selectionStart ?? 0)
            + event.clipboardData.getData('text') + input.value.slice(input.selectionEnd ?? input.value.length);
          if (pendingPaste.current.trim() && !localPhone(pendingPaste.current)) {
            input.setCustomValidity(PHONE_ERROR);
            setEntryError(PHONE_ERROR);
          }
          onPaste?.(event);
          // A cancelled paste or a full field may not emit an input event.
          setTimeout(() => { pendingPaste.current = null; }, 0);
        }}
        onBlur={event => {
          if (event.currentTarget.value && !event.currentTarget.validity.valid) setEntryError(PHONE_ERROR);
          onBlur?.(event);
        }}
      />
    </div>
    {(entryError || hint) && <span id={hintId} className={`mt-1 block text-xs ${entryError ? 'text-red-600' : 'text-forest-muted'}`} aria-live="polite">{entryError || hint}</span>}
  </>;
}
