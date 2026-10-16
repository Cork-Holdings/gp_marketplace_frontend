import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DRAFT_TTL_MS, clearOnboardingDraft, onboardingDraftKey, readOnboardingDraft, safeDraftFields, saveOnboardingDraft } from '../src/lib/onboardingDraft.ts';
const memory = () => { const records=new Map();return { getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k) }; };

test('draft stores entered details and step, not passwords or identity file data', () => {
  const storage=memory(),key=onboardingDraftKey('self');
  assert.equal(saveOnboardingDraft(storage,key,{email:'test@example.test',phone:'0961234567',password:'secret',national_id:'private',file_url:'/private',legal_name:'Test'},'kyc',true),true);
  const raw=storage.getItem(key),draft=readOnboardingDraft(storage,key);
  assert.doesNotMatch(raw,/secret|national_id|file_url/);
  assert.equal(draft.step,'kyc');assert.equal(draft.fields.legal_name,'Test');assert.equal(draft.hasDocuments,true);
});
test('admin, self and additional-business drafts do not mix accounts', () => {
  assert.notEqual(onboardingDraftKey('admin','one'),onboardingDraftKey('admin','two'));
  assert.notEqual(onboardingDraftKey('self'),onboardingDraftKey('additional','one'));
});
test('malformed, expired, future or incompatible drafts never crash onboarding', () => {
  const s=memory(),key='test';
  for(const raw of ['not JSON',JSON.stringify({version:999,savedAt:100,fields:{},step:'type'}),JSON.stringify({version:1,savedAt:Date.now()+10000,fields:{},step:'type'})]){s.setItem(key,raw);assert.equal(readOnboardingDraft(s,key),null);}
  s.setItem(key,JSON.stringify({version:1,savedAt:100,fields:{},step:'type'}));assert.equal(readOnboardingDraft(s,key,100+DRAFT_TTL_MS+1),null);assert.equal(s.getItem(key),null);
});
test('storage failures keep the app usable and are reported to the caller', () => {
  const s={getItem(){throw Error('blocked');},setItem(){throw Error('quota');},removeItem(){throw Error('blocked');}};
  assert.equal(readOnboardingDraft(s,'key'),null);assert.equal(saveOnboardingDraft(s,'key',{},'type',false),false);assert.equal(clearOnboardingDraft(s,'key'),false);
});
test('discard clears exactly the requested draft and allows a fresh start', () => {
  const s=memory();saveOnboardingDraft(s,'one',{email:'one@example.test'},'profile',false);saveOnboardingDraft(s,'two',{email:'two@example.test'},'profile',false);
  clearOnboardingDraft(s,'one');assert.equal(readOnboardingDraft(s,'one'),null);assert.ok(readOnboardingDraft(s,'two'));
});
test('unknown, non-string and oversized fields cannot be restored', () => {
  assert.deepEqual(safeDraftFields({password:'secret',legal_name:'Test',phone:1,tax_id:'x'.repeat(2001),unknown:'x'}),{legal_name:'Test'});
});
