import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('compact workflow payments keep phone entry and action in separate rows', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  const rules = [...css.matchAll(/\.workflow-payment\.is-compact \.workflow-payment-entry\s*\{([^}]+)\}/g)];
  assert.ok(rules.length > 0);
  for (const [, declarations] of rules) {
    assert.match(declarations, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*;/);
    assert.doesNotMatch(declarations, /minmax\(0,\s*1fr\)\s+auto/);
  }
});

test('shared phone control reserves country-prefix space and prevents field overflow', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  const source = await readFile(new URL('../src/components/shared/PhoneInput.tsx', import.meta.url), 'utf8');
  assert.match(source, /className="phone-input-control"/);
  assert.match(css, /\.phone-input-control\{[^}]*grid-template-columns:auto minmax\(0,1fr\)/);
  assert.match(css, /\.phone-input-control>input\{[^}]*font-size:16px/);
});

test('workflow payment labels target a unique phone field', async () => {
  const source = await readFile(new URL('../src/components/common/WorkflowPaymentPanel.tsx', import.meta.url), 'utf8');
  assert.match(source, /const phoneId = useId\(\)/);
  assert.match(source, /<label htmlFor=\{phoneId\}>Mobile-money number<\/label>/);
  assert.match(source, /<PhoneInput id=\{phoneId\}/);
});
