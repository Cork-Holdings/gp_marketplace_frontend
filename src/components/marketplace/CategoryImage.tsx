import { useState } from 'react';
import type { DiscoveryCategory } from '@/lib/discovery';
import { DiscoveryIcon } from './DiscoveryIcon';

/** Category illustrations are never represented as a merchant's actual item. */
export function CategoryImage({ category, className = '', eager = false, sizes = '(max-width: 767px) 45vw, (max-width: 1360px) 23vw, 320px' }: {
  category: DiscoveryCategory; className?: string; eager?: boolean; sizes?: string;
}) {
  const [failedCategories, setFailedCategories] = useState<DiscoveryCategory[]>([]);
  const imageCategory = failedCategories.includes(category) ? 'other' : category;
  if (failedCategories.includes(imageCategory)) {
    return <span className={`flex items-center justify-center bg-sky-100 text-slate-500 ${className}`} role="img" aria-label="Category illustration unavailable"><DiscoveryIcon name="bag" size={32} /></span>;
  }
  const base = `/images/discovery/painted/${imageCategory === 'repairs' ? 'repairs-v2' : imageCategory}`;
  return <img
    className={`!object-contain bg-sky-100 ${className}`} src={`${base}-800.webp`}
    srcSet={`${base}-160.webp 160w, ${base}-400.webp 400w, ${base}-800.webp 800w`}
    sizes={sizes} alt="" width={800} height={800} data-image-origin="illustration"
    loading={eager ? 'eager' : 'lazy'} decoding="async"
    onError={() => setFailedCategories(current => current.includes(imageCategory) ? current : [...current, imageCategory])}
  />;
}
