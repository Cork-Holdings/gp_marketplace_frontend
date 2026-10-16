import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestedMenuSection } from '../src/lib/menuSuggestions.ts';
test('simple suggestions recognise local dishes without forcing a category', () => {
  assert.equal(suggestedMenuSection('Nshima + Chicken'), 'Mains');
  assert.equal(suggestedMenuSection('Grilled Choma Platter'), 'Mains');
  assert.equal(suggestedMenuSection('Soft Drink 500ml'), 'Drinks');
  assert.equal(suggestedMenuSection('Chocolate cake'), 'Desserts');
  assert.equal(suggestedMenuSection('An unfamiliar item'), null);
});
