import { useRef, useState } from 'react';
import { PhoneInput } from '@/components/shared/PhoneInput';

export interface FileUploadFieldProps {
  id?: string;
  label?: string;
  hint?: string;
  optional?: boolean;
  value?: File | null;
  onChange?: (file: File) => void;
  accept?: string;
}

export function FileUploadField({
  id,
  label,
  hint,
  optional,
  value,
  onChange,
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | null | undefined) => {
    if (file) onChange?.(file);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-forest-muted">(optional)</span>}
      </label>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${value ? 'Replace' : 'Upload'} ${label ?? 'document'}`}
        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); inputRef.current?.click(); } }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt ${
          dragOver ? 'border-forest bg-sage/30' : 'border-cream-dark bg-cream/40 hover:border-forest-muted'
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {value ? (
          <div>
            <p className="text-sm font-medium text-forest">✓ {value.name}</p>
            <p className="mt-1 text-xs text-forest-muted">{(value.size / 1024).toFixed(1)} KB · Click to replace</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-charcoal">Drag & drop or click to upload</p>
            {hint && <p className="mt-1 text-xs text-forest-muted">{hint}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export interface BusinessTypeCardsProps {
  value: string;
  onChange: (id: string) => void;
}

export function BusinessTypeCards({ value, onChange }: BusinessTypeCardsProps) {
  const types = [
    {
      id: 'informal',
      title: 'Informal Business',
      desc: 'Sole traders, barbershops, market stalls — minimal paperwork.',
      badge: 'Popular',
    },
    {
      id: 'formal',
      title: 'Formal Business',
      desc: 'Registered company with incorporation certificate and tax ID.',
      badge: null,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {types.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(t.id)}
            className={`relative rounded-2xl border p-4 text-left transition ${
              active
                ? 'border-forest bg-sage/40 ring-2 ring-forest/20'
                : 'border-cream-dark bg-white hover:border-forest-muted'
            }`}
          >
            {t.badge && (
              <span className="absolute right-3 top-3 rounded-full bg-forest px-2 py-0.5 text-[10px] font-semibold text-cream">
                {t.badge}
              </span>
            )}
            <p className="font-semibold text-charcoal">{t.title}</p>
            <p className="mt-1 text-xs text-forest-muted">{t.desc}</p>
          </button>
        );
      })}
    </div>
  );
}

export interface FormFieldProps {
  label?: string;
  id?: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}

export function FormField({ label, id, type = 'text', required, value, onChange, placeholder, hint }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">
        {label}
      </label>
      {type === 'tel' ? <PhoneInput id={id} name={id} required={required} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} /> : <input
        id={id}
        name={id}
        autoComplete={id === 'full_name' ? 'name' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off'}
        spellCheck={type !== 'email'}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
      />}
      {hint && <p className="mt-1 text-xs text-forest-muted">{hint}</p>}
    </div>
  );
}

export interface SelectFieldOption {
  value?: string;
  code?: string;
  label: string;
}

export interface SelectFieldProps {
  label?: string;
  id?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
}

export function SelectField({ label, id, required, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">
        {label}
      </label>
      <select id={id} name={id} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="field-input">
        {options.map((o) => (
          <option key={o.value ?? o.code} value={o.value ?? o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
