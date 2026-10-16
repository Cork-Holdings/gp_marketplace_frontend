import test from 'node:test';
import assert from 'node:assert/strict';
import { referencePhotosError, REFERENCE_PHOTO_MAX_BYTES } from '../src/lib/referencePhotos.ts';
test('reference photos accept supported types up to the exact size limit', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp']) assert.equal(referencePhotosError(0, [{ type, size: REFERENCE_PHOTO_MAX_BYTES }]), null);
});
test('invalid reference batches cannot discard an existing selection', () => {
  const photo = { type: 'image/png', size: 12 };
  assert.match(referencePhotosError(3, [photo, photo]), /four/);
  assert.equal(referencePhotosError(3, [photo]), null);
  assert.match(referencePhotosError(0, [{ ...photo, size: 0 }]), /empty/);
  assert.match(referencePhotosError(0, [{ ...photo, size: REFERENCE_PHOTO_MAX_BYTES + 1 }]), /2 MB/);
  for (const type of ['', 'application/pdf', 'image/svg+xml', 'image/gif']) assert.match(referencePhotosError(0, [{ ...photo, type }]), /JPEG, PNG or WebP/);
});
