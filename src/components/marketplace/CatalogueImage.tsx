import { useState } from 'react';
import type { DiscoveryCategory } from '@/lib/discovery';
import { CategoryImage } from './CategoryImage';

/** Uploaded item images take priority. Broken/missing images use labelled defaults. */
export function CatalogueImage({ imageUrl, alt, category, className = '', labelClassName = '', label = 'Illustrative category image', eager = false, sizes }: {
  imageUrl?: string | null; alt: string; category: DiscoveryCategory;
  className?: string; labelClassName?: string; label?: string; eager?: boolean; sizes?: string;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const hasPhoto = Boolean(imageUrl?.trim() && imageUrl !== failedImage);
  // Recognisable goods should not inherit an unrelated shop-wide illustration.
  const illustrationCategory = /\b(tote|mug|basket|bag)\b/i.test(alt) ? 'other' : category;
  return hasPhoto ? <img
    src={imageUrl!} alt={alt} width={800} height={800} className={className}
    loading={eager ? 'eager' : 'lazy'} decoding="async" data-image-origin="merchant"
    onError={() => setFailedImage(imageUrl!)}
  /> : <>
    <CategoryImage category={illustrationCategory} className={className} eager={eager} sizes={sizes} />
    <span className={labelClassName} title="Illustrative category image, not the merchant's actual item">{label}</span>
  </>;
}
