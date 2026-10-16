import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onboardingIssue } from '../src/lib/onboardingValidation.ts';

test('informal applications require owner evidence before review, not incorporation', () => {
  assert.equal(onboardingIssue('kyc', false, '', false, false)?.field, 'owner_id');
  assert.equal(onboardingIssue('kyc', false, '', true, false), null);
});
test('formal applications need a registration number and both required documents', () => {
  assert.equal(onboardingIssue('business', true, '  ', true, true)?.field, 'registration_number');
  assert.equal(onboardingIssue('kyc', true, 'TEST-1', true, false)?.field, 'company_registration');
  assert.equal(onboardingIssue('review', true, 'TEST-1', true, true), null);
});
test('review rechecks changed details without losing the draft', () => {
  assert.equal(onboardingIssue('review', true, '', true, true)?.step, 'business');
  assert.equal(onboardingIssue('review', false, '', false, false)?.step, 'kyc');
  assert.equal(onboardingIssue('profile', false, '', false, false), null);
});
