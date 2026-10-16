import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kycDecisionIssue, kycDocuments, kycDocumentUrl, kycLabel } from '../src/lib/kycReview.ts';

test('review shows every business and applicant document, merging a reused NRC', () => {
  const docs = kycDocuments({ documents: [
    { id: 'id', file_url: '/uploads/nrc.png', verification_type: 'owner_id' },
    { id: 'pacra', file_url: '/uploads/pacra.pdf', verification_type: 'company_registration' },
  ], applicant: { documents: [
    { id: 'nrc', file_url: '/uploads/nrc.png', document_type: 'national_id' },
    { id: 'passport', file_url: '/uploads/passport.pdf', document_type: 'passport' },
  ] } });
  assert.equal(docs.length, 3);
  assert.match(docs[0].source, /NRC/);
  assert.equal(docs[1].title, 'PACRA registration');
});
test('legacy verification-only attachments remain visible', () => {
  assert.equal(kycDocuments({ verification: { document_url: '/uploads/legacy.pdf', verification_type: 'owner_id' } }).length, 1);
  assert.deepEqual(kycDocuments({}), []);
});
test('document links reject executable and malformed schemes', () => {
  assert.equal(kycDocumentUrl('javascript:alert(1)', 'http://127.0.0.1:8080/api/v1'), null);
  assert.equal(kycDocumentUrl('data:text/html,secret'), null);
  assert.equal(kycDocumentUrl('/uploads/document.pdf', 'http://127.0.0.1:8080/api/v1'), 'http://127.0.0.1:8080/uploads/document.pdf');
});
test('rejection needs actionable notes and limits review length', () => {
  assert.match(kycDecisionIssue(false, '  '), /needs correcting/);
  assert.equal(kycDecisionIssue(false, 'Please upload a readable NRC.'), null);
  assert.equal(kycDecisionIssue(true, ''), null);
  assert.match(kycDecisionIssue(true, 'x'.repeat(2001)), /2,000/);
});
test('Zambian document names replace internal field names', () => {
  assert.match(kycLabel('national_id'), /NRC/);
  assert.match(kycLabel('structural_approval'), /Council licence/);
});
