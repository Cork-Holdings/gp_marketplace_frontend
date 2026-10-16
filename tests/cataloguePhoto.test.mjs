import test from 'node:test';
import assert from 'node:assert/strict';
import { cataloguePhotoError, CATALOGUE_PHOTO_MAX_BYTES } from '../src/lib/cataloguePhoto.ts';
test('all catalogue photos use the same supported formats and limit', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) assert.equal(cataloguePhotoError({ type, size: CATALOGUE_PHOTO_MAX_BYTES }), null);
  for (const type of ['image/svg+xml', 'application/pdf', '', 'image/gif']) assert.match(cataloguePhotoError({ type, size: 30 }), /JPEG, PNG or WebP/);
  assert.match(cataloguePhotoError({ type: 'image/png', size: 0 }), /empty/);
  assert.match(cataloguePhotoError({ type: 'image/jpeg', size: CATALOGUE_PHOTO_MAX_BYTES + 1 }), /5 MB/);
});
