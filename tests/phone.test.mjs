import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { internationalPhone, localPhone, validPhone, PHONE_MAX_DIGITS, PHONE_EXAMPLE } from '../src/lib/phone.ts';

test('local entry is limited to ten digits and the example is valid', () => {
  assert.equal(PHONE_MAX_DIGITS, 10);
  assert.equal(validPhone(PHONE_EXAMPLE), true);
  for (const invalid of ['', '096123456', '09612345678', '+260961234567', '961234567', 'abcdefghij']) assert.equal(validPhone(invalid), false);
});
test('international conversion removes the trunk zero exactly once', () => {
  assert.equal(internationalPhone('0961234567'), '+260961234567');
  assert.equal(internationalPhone('0771234567'), '+260771234567');
  assert.equal(internationalPhone('+260961234567'), '+260961234567');
});
test('existing international profiles and formatted pastes become local numbers', () => {
  for (const input of ['0961234567', '096 123 4567', '+260961234567', '260961234567', '00260961234567']) assert.equal(localPhone(input), '0961234567');
});
test('invalid and oversized numbers are rejected, never silently truncated', () => {
  for (const input of ['09612345678', '+2600961234567', '+254712345678', 'call 0961234567']) {
    assert.equal(localPhone(input), '');
    assert.throws(() => internationalPhone(input), /10-digit.*0961234567/);
  }
});
test('empty optional entry stays empty; missing values are safe', () => {
  assert.equal(localPhone(''), '');
  assert.equal(localPhone(undefined), '');
  assert.equal(localPhone(null), '');
  assert.equal(localPhone('096'), '096');
});
test('all entry surfaces share the phone input instead of an unlimited raw field', async () => {
  for (const file of ['components/onboarding/OnboardingFields.tsx', '(public)/register/CustomerRegisterPage.tsx', '(public)/checkout/CheckoutPage.tsx', 'components/common/WorkflowPaymentPanel.tsx', 'components/storefront/PaymentStatus.tsx', '(admin)/dashboard/AdminPanels.tsx']) {
    const source = await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8');
    assert.match(source, /<PhoneInput\b/, file);
    assert.doesNotMatch(source, /<input\b[^>]*type="tel"/s, file);
  }
});
test('country prefix and linked format hint are present; paste is not disabled', async () => {
  const source = await readFile(new URL('../src/components/shared/PhoneInput.tsx', import.meta.url), 'utf8');
  assert.match(source, /maxLength=\{PHONE_MAX_DIGITS\}/);
  assert.match(source, /inputMode="numeric"/);
  assert.match(source, /aria-describedby=/);
  assert.match(source, /PHONE_COUNTRY_PREFIX/);
  assert.doesNotMatch(source, /preventDefault/);
});
