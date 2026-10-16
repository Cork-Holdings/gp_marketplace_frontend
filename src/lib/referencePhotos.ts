export const REFERENCE_PHOTO_LIMIT = 4;
export const REFERENCE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const REFERENCE_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
export function referencePhotosError(existingCount: number, files: Pick<File, 'type' | 'size'>[]): string | null {
  if (existingCount + files.length > REFERENCE_PHOTO_LIMIT) return 'You can attach up to four photos. Remove one before adding another.';
  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Choose JPEG, PNG or WebP photos.';
    if (file.size <= 0) return 'One of these files is empty. Choose another photo.';
    if (file.size > REFERENCE_PHOTO_MAX_BYTES) return 'Each photo must be no larger than 2 MB.';
  }
  return null;
}
