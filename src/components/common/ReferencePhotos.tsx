import { useEffect, useId, useState } from 'react';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import secureApi from '@/lib/api/crud';
import { getRoute } from '@/lib/api/end_points';
import { REFERENCE_PHOTO_ACCEPT, REFERENCE_PHOTO_LIMIT, referencePhotosError } from '@/lib/referencePhotos';
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import './reference-photos.css';

type Photo = { id: string; file_name: string; position: number };
export function ReferencePhotoPreviews({ files, onRemove, disabled = false }: { files: File[]; onRemove?: (index: number) => void; disabled?: boolean }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const previews = files.map(file => URL.createObjectURL(file)); setUrls(previews);
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  if (!files.length) return null;
  return <ul className="reference-photo-list">{files.map((file, index) => <li key={`${index}-${file.name}`}><img src={urls[index]} alt={`Reference ${index + 1}: ${file.name}`} /><span>{file.name}</span>{onRemove && <button type="button" disabled={disabled} onClick={() => onRemove(index)} aria-label={`Remove reference photo ${index + 1}: ${file.name}`}>Remove</button>}</li>)}</ul>;
}
export function ReferencePhotoField({ files, onChange, disabled = false }: { files: File[]; onChange: (files: File[]) => void; disabled?: boolean }) {
  const id = useId(); const [error, setError] = useState<string | null>(null);
  return <fieldset className="reference-photos" disabled={disabled}><legend>Reference photos <span>(optional)</span></legend>
    <p>Show the business the design, colour or item you have in mind. These photos are shared with the business handling your request, not displayed in the marketplace.</p>
    <label htmlFor={id}>Add reference photos</label><input id={id} type="file" multiple accept={REFERENCE_PHOTO_ACCEPT} disabled={disabled || files.length >= REFERENCE_PHOTO_LIMIT} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint ${id}-error`} onChange={event => {
      const selected = Array.from(event.target.files ?? []); event.target.value = ''; if (!selected.length) return;
      const message = referencePhotosError(files.length, selected); setError(message); if (!message) onChange([...files, ...selected]);
    }} />
    <p id={`${id}-hint`} className="reference-photo-hint">Up to 4 photos · JPEG, PNG or WebP · 2 MB each. {files.length}/4 selected.{files.length === 4 ? ' Remove a photo to add another.' : ''}</p>
    <p id={`${id}-error`} className="reference-photo-error" role={error ? 'alert' : undefined}>{error}</p>
    <ReferencePhotoPreviews files={files} disabled={disabled} onRemove={index => { onChange(files.filter((_, i) => i !== index)); setError(null); }} />
  </fieldset>;
}
function SavedPhoto({ photo, path }: { photo: Photo; path: string }) {
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const { data, loading, error, retry } = useFetchWrapper(({ signal }) => secureApi.get(path, { signal }), [path]);
  return <li>{loading ? <p role="status">Loading photo…</p> : error || imageFailed ? <><p role="alert">Photo unavailable.</p><button type="button" onClick={() => { setImageFailed(false); void retry().catch(() => {}); }}>Retry photo</button></> : <button type="button" className="reference-photo-open" onClick={() => setOpen(true)} aria-label={`View reference photo: ${photo.file_name}`}><img src={data?.data_url} alt={photo.file_name} onError={() => setImageFailed(true)} /><span>{photo.file_name}</span><small>View full image</small></button>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>{photo.file_name}</DialogTitle></DialogHeader><DialogBody><img className="reference-photo-full" src={data?.data_url} alt={photo.file_name} /><button type="button" className="booking-back-button" onClick={() => setOpen(false)}>Close image</button></DialogBody></DialogContent></Dialog>
  </li>;
}
export function RequestReferencePhotos({ orderId, storeId }: { orderId: string; storeId?: string }) {
  const path = storeId ? getRoute('OWNER_CUSTOM_ORDER_PHOTOS', { storeId, orderId }) : getRoute('CUSTOMER_CUSTOM_ORDER_PHOTOS', { orderId });
  const { data, loading, error, retry } = useFetchWrapper(({ signal }) => secureApi.get(path, { signal }), [path]); const photos: Photo[] = data?.photos ?? [];
  if (!loading && !error && !photos.length) return null;
  return <section className="reference-photos" aria-label="Reference photos"><h3>Reference photos</h3>{loading ? <p role="status">Loading reference photos…</p> : error ? <><p role="alert">Could not load reference photos.</p><button type="button" className="workflow-text-action" onClick={() => void retry().catch(() => {})}>Try again</button></> : <><p className="reference-photo-hint">Customer-supplied samples. Open a photo to see the details.</p><ul className="reference-photo-list">{photos.map(photo => <SavedPhoto key={photo.id} photo={photo} path={`${path}/${photo.id}`} />)}</ul></>}</section>;
}
