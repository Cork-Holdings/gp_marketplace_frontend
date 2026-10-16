import { useEffect, useId, useState } from 'react';
import { cataloguePhotoError, CATALOGUE_PHOTO_ACCEPT } from '@/lib/cataloguePhoto';
import './catalogue-photo.css';

/** Shared by every catalogue form; selection is uploaded only when the form is saved. */
export function CataloguePhotoField({ file, existingUrl, removed = false, disabled = false, onChange, onRemove }: {
  file: File | null; existingUrl?: string | null; removed?: boolean; disabled?: boolean;
  onChange: (file: File | null) => void; onRemove: () => void;
}) {
  const id = useId();
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const url = preview || (!removed ? existingUrl : '') || '';
  return <fieldset className="catalogue-photo" disabled={disabled}>
    <legend>Item photo <span>(optional)</span></legend>
    <div className="catalogue-photo-layout">
      <div className="catalogue-photo-preview">
        {url && broken !== url ? <img src={url} alt="Item photo preview" onError={() => setBroken(url)} /> : <div>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></svg>
          <span>{url ? 'Preview unavailable' : 'No photo selected'}</span>
        </div>}
      </div>
      <div className="catalogue-photo-controls">
        <p>Show customers the product or service you offer.</p>
        <label htmlFor={id}>{url ? 'Replace photo' : 'Add photo'}</label>
        <input id={id} type="file" accept={CATALOGUE_PHOTO_ACCEPT} aria-describedby={`${id}-hint ${id}-error`} aria-invalid={Boolean(error)} onChange={event => {
          const selected = event.target.files?.[0];
          event.target.value = '';
          if (!selected) return;
          const message = cataloguePhotoError(selected);
          setError(message);
          if (!message) onChange(selected);
        }} />
        <p id={`${id}-hint`} className="catalogue-photo-hint">JPEG, PNG or WebP · up to 5 MB. Saved when you save this item.</p>
        {file && <p className="catalogue-photo-filename">Selected: {file.name}</p>}
        <p id={`${id}-error`} role={error ? 'alert' : undefined} className="catalogue-photo-error">{error}</p>
        {(file || (existingUrl && !removed)) && <button type="button" onClick={() => { setError(null); if (file) onChange(null); else onRemove(); }}>{file ? 'Cancel replacement' : 'Remove photo'}</button>}
        {removed && !file && <p className="catalogue-photo-hint">The current photo will be removed when you save.</p>}
      </div>
    </div>
  </fieldset>;
}
