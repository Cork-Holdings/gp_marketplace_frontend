export const CATALOGUE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const CATALOGUE_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

export function cataloguePhotoError(file: Pick<File, 'type' | 'size'>): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Choose a JPEG, PNG or WebP image.';
  if (file.size <= 0) return 'This file is empty. Choose another image.';
  if (file.size > CATALOGUE_PHOTO_MAX_BYTES) return 'Choose an image smaller than 5 MB.';
  return null;
}
