/**
 * Build multipart FormData from flat fields and optional file map.
 * Skips null/undefined; appends File/Blob values under file keys.
 */
export function buildFormData(
  fields: Record<string, unknown> = {},
  files: Record<string, Blob | undefined | null> = {},
) {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      fd.append(key, String(value));
    }
  });
  Object.entries(files).forEach(([key, file]) => {
    if (file) fd.append(key, file);
  });
  return fd;
}

export function slugify(text: unknown) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
