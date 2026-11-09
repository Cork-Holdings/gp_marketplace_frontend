import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/(owner)/quotes/ServiceQuotesPage.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('ServiceQuotesPage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const messages = [];
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'setFeedback') {
    const message = node.arguments[0];
    if (message && ts.isObjectLiteralExpression(message)) {
      messages.push(Object.fromEntries(message.properties.filter(ts.isPropertyAssignment).map(property => [property.name.getText(ast), property.initializer])));
    }
  }
  ts.forEachChild(node, visit);
}
visit(ast);

test('successful service-job creation is explicitly success feedback, not an error', () => {
  const success = messages.find(message => message.text && ts.isStringLiteral(message.text) && message.text.text.startsWith('Service job created.'));
  assert.ok(success, 'Service-job creation must acknowledge success');
  assert.equal(success.error?.kind, ts.SyntaxKind.FalseKeyword);
  assert.doesNotMatch(source, /setApiError/);
});

test('quote validation and failed actions retain error feedback', () => {
  const failures = messages.filter(message => message !== messages.find(item => item.text && ts.isStringLiteral(item.text) && item.text.text.startsWith('Service job created.')));
  assert.equal(failures.length, 4);
  for (const failure of failures) assert.equal(failure.error?.kind, ts.SyntaxKind.TrueKeyword);
});

test('all quote feedback surfaces use severity for both styling and announcements', () => {
  const surfaces = [...source.matchAll(/<p role=\{feedback\.error \? 'alert' : 'status'\} className=\{([^\n]+?)\}>\{feedback\.text\}<\/p>/g)];
  assert.equal(surfaces.length, 3, 'List, detail and editor must agree on feedback severity');
  for (const [, classes] of surfaces) assert.match(classes, /feedback\.error \? '(?:workflow-feedback )?is-error'|feedback\.error \? ' is-error'/);
});

test('feedback belongs to the selected business and quote, not other records', () => {
  assert.match(source, /recordFeedback\?\.storeId === selectedStoreId/);
  assert.match(source, /recordFeedback\?\.recordId === selectedId/);
  assert.match(source, /storeId: selectedStoreId, recordId: selectedId/);
});
